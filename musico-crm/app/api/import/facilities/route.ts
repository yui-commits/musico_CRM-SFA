import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'
import { createClient } from '@/lib/supabase/server'
import { normalizePhoneNumber } from '@/lib/normalizers'
import { PREFECTURES } from '@/lib/constants'

interface CSVRow {
  施設名?: string
  電話番号?: string
  施設種別?: string
  都道府県?: string
  市区町村?: string
  '以降の住所'?: string
  代表メール?: string
  HPのURL?: string
  '園長名(決裁者)'?: string
  園児数?: string
  既存の課外教室?: string
  '園の特色・方針'?: string
  [key: string]: string | undefined
}

interface ErrorRow {
  row: number
  phone: string
  reason: string
}

// Normalize raw CSV rows: strip asterisks from keys, apply column aliases
function normalizeRow(raw: Record<string, string | undefined>): Record<string, string | undefined> {
  // Strip trailing/leading asterisks and spaces from all keys
  const normalized: Record<string, string | undefined> = {}
  for (const [key, val] of Object.entries(raw)) {
    normalized[key.replace(/\*/g, '').trim()] = val
  }

  // Column aliases: accept both short names and formal names
  const aliases: Record<string, string[]> = {
    '施設名':      ['施設名'],
    '電話番号':    ['電話番号'],
    '都道府県':    ['都道府県'],
    '市区町村':    ['市区町村'],
    '施設種別':    ['施設種別', '種別'],
    '以降の住所':  ['以降の住所', '住所', '番地以降'],
    '代表メール':  ['代表メール', 'メール', 'email', 'Email'],
    'HPのURL':     ['HPのURL', 'Webサイト', 'URL', 'ホームページ'],
    '園長名(決裁者)': ['園長名(決裁者)', '担当者名', '園長名', 'キーパーソン'],
    '園児数':      ['園児数', '定員数', '定員'],
    '既存の課外教室': ['既存の課外教室', '既存習い事', '既存教室'],
    '園の特色・方針': ['園の特色・方針', '園の特色', '特色・方針', '特色'],
    '運営法人':       ['運営法人', '法人名', '運営会社'],
  }

  const result: Record<string, string | undefined> = { ...normalized }
  for (const [canonical, aliasList] of Object.entries(aliases)) {
    if (result[canonical] === undefined) {
      for (const alias of aliasList) {
        if (normalized[alias] !== undefined) {
          result[canonical] = normalized[alias]
          break
        }
      }
    }
  }
  return result
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const formData = await request.formData()
  const file = formData.get('file') as File
  const duplicateAction = formData.get('duplicate_action') as 'overwrite' | 'skip' || 'skip'

  if (!file) {
    return NextResponse.json({ error: 'ファイルが必要です' }, { status: 400 })
  }

  const rawText = await file.text()
  // Strip BOM (Excel UTF-8 CSV includes \uFEFF at the start)
  const text = rawText.replace(/^\uFEFF/, '')

  // Auto-detect delimiter: tab (TSV from Excel copy-paste) or comma (standard CSV)
  const firstLine = text.split('\n')[0] ?? ''
  const delimiter = firstLine.includes('\t') ? '\t' : ','

  const parseResult = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    delimiter,
  })
  const rawRows = parseResult.data
  const fatalErrors = parseResult.errors.filter(e => (e.type as string) === 'Delimiter' || (e.type as string) === 'Abort')

  if (fatalErrors.length > 0) {
    return NextResponse.json({ error: 'CSVの解析に失敗しました' }, { status: 400 })
  }

  if (rawRows.length === 0) {
    return NextResponse.json({
      error: `CSVにデータ行がありません。検出されたヘッダー: ${parseResult.meta.fields?.join(', ')}`,
    }, { status: 400 })
  }

  const rows = rawRows.map(normalizeRow)

  const successRows: Record<string, unknown>[] = []
  const errorRows: ErrorRow[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2

    const name = row['施設名']?.trim()
    const rawPhone = row['電話番号']?.trim() || ''
    const prefecture = row['都道府県']?.trim()
    const municipality = row['市区町村']?.trim()

    if (!name) {
      errorRows.push({ row: rowNum, phone: rawPhone, reason: '施設名が空です' })
      continue
    }

    const phone = normalizePhoneNumber(rawPhone)

    if (!phone || !/^\d{9,11}$/.test(phone)) {
      errorRows.push({ row: rowNum, phone: rawPhone, reason: `電話番号が不正です（正規化後: "${phone}"）` })
      continue
    }

    if (!prefecture || !PREFECTURES.includes(prefecture)) {
      errorRows.push({ row: rowNum, phone: rawPhone, reason: `都道府県「${prefecture}」が不正です（47都道府県と完全一致が必要）` })
      continue
    }

    if (!municipality) {
      errorRows.push({ row: rowNum, phone: rawPhone, reason: '市区町村が空です' })
      continue
    }

    successRows.push({
      name,
      operating_company: row['運営法人']?.trim() || null,
      phone_number: phone,
      type: row['施設種別']?.trim() || null,
      prefecture,
      municipality,
      address: row['以降の住所']?.trim() || null,
      email: row['代表メール']?.trim() || null,
      website_url: row['HPのURL']?.trim() || null,
      key_person_name: row['園長名(決裁者)']?.trim() || null,
      capacity: row['園児数'] ? parseInt(row['園児数']) || null : null,
      existing_classes: row['既存の課外教室']?.trim() || null,
      features: row['園の特色・方針']?.trim() || null,
      lead_status: '未着手',
    })
  }

  // Perform UPSERT for valid rows
  let successCount = 0
  let upsertErrors: ErrorRow[] = []

  if (successRows.length > 0) {
    if (duplicateAction === 'overwrite') {
      const { data, error } = await supabase
        .from('facilities')
        .upsert(successRows, { onConflict: 'phone_number', ignoreDuplicates: false })
        .select()
      successCount = data?.length || 0
      if (error) {
        upsertErrors.push({ row: 0, phone: '', reason: error.message })
      }
    } else {
      // Skip duplicates
      const { data, error } = await supabase
        .from('facilities')
        .upsert(successRows, { onConflict: 'phone_number', ignoreDuplicates: true })
        .select()
      successCount = data?.length || 0
      if (error) {
        upsertErrors.push({ row: 0, phone: '', reason: error.message })
      }
    }
  }

  // Trigger AI generation for facilities with features (fire and forget)
  void triggerAiGeneration(supabase, successRows.map(r => r['phone_number'] as string))

  const allErrors = [...errorRows, ...upsertErrors]
  return NextResponse.json({
    success_count: successCount,
    error_count: allErrors.length,
    errors: allErrors.map(e => ({ row: e.row, phone_number: e.phone, reason: e.reason })),
    total: rows.length,
  })
}

async function triggerAiGeneration(
  supabase: Awaited<ReturnType<typeof createClient>>,
  phoneNumbers: string[]
) {
  if (!phoneNumbers.length) return

  const { data: facilities } = await supabase
    .from('facilities')
    .select('id, features')
    .in('phone_number', phoneNumbers)
    .is('ai_sales_script', null)
    .not('features', 'is', null)

  if (!facilities?.length) return

  for (const facility of facilities) {
    await new Promise((r) => setTimeout(r, 1000))
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('supabase.co', '')}/api/ai-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facility_id: facility.id }),
      })
    } catch {
      // Best effort - failures are OK
    }
  }
}
