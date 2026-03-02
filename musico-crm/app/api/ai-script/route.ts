import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

const SYSTEM_PROMPT = `あなたは高嶋ちさ子プロデュースの音楽教室「ムジコ」の優秀な営業担当です。
以下の【商材の強み】と、入力される【園の特色・既存設備】を掛け合わせ、電話口でそのまま読める1分以内の営業トークを作成してください。

【商材の強み・提案条件】
・高嶋ちさ子の全国コンサートに生徒が登壇し共演できる唯一の音楽教室。
・園の費用・備品負担ゼロ（場所の提供のみ）。月謝の10%（約980円/人）を場所代として還元。3名から開講可能。
・着地点：「無料ミニコンサート＆体験会」の実施提案（または面談の合意）。

【出力ルール】
・挨拶と自己紹介（ムジコ運営担当であること）から始める。
・【園の特色】に対する称賛と、ムジコとの親和性（なぜ御園に合うのかのメリット）を組み込む。
・話し言葉（口語体）で、明るく丁寧なトーン。
・テキストのみ出力すること（マークダウンや補足説明は不要）。`

async function generateWithRetry(
  facilityName: string,
  features: string,
  existingClasses: string,
  maxRetries = 3
): Promise<string | null> {
  const prompt = `${SYSTEM_PROMPT}\n\n施設名：${facilityName} / 園の特色・既存設備：${features}、${existingClasses}`

  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (err) {
      if (i === maxRetries - 1) {
        console.error('AI generation failed after retries:', err)
        return null
      }
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
    }
  }
  return null
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { facility_id } = await request.json() as { facility_id: string }

  const { data: facility, error } = await supabase
    .from('facilities')
    .select('id, name, features, existing_classes')
    .eq('id', facility_id)
    .single()

  if (error || !facility) {
    return NextResponse.json({ error: 'Facility not found' }, { status: 404 })
  }

  if (!facility.features) {
    return NextResponse.json({ error: '園の特色が未入力です' }, { status: 400 })
  }

  const script = await generateWithRetry(
    facility.name,
    facility.features,
    facility.existing_classes || '',
  )

  if (!script) {
    return NextResponse.json({ error: 'AI生成に失敗しました' }, { status: 500 })
  }

  await supabase
    .from('facilities')
    .update({ ai_sales_script: script })
    .eq('id', facility_id)

  return NextResponse.json({ data: script })
}
