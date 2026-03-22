import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ng_reasons')
    .select('id, name, sort_order')
    .order('sort_order', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const { name } = await req.json()
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'NG理由の名前は必須です' }, { status: 400 })
  }

  const supabase = await createClient()

  // sort_orderの最大値を取得して+1
  const { data: maxRow } = await supabase
    .from('ng_reasons')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = (maxRow?.sort_order ?? 0) + 1

  const { data, error } = await supabase
    .from('ng_reasons')
    .insert({ name: name.trim(), sort_order: nextOrder })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: '同じ名前のNG理由が既に存在します' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ data }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  if (!id) {
    return NextResponse.json({ error: 'IDは必須です' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.from('ng_reasons').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
