import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Facility } from '@/types'
import { MIN_ENROLLMENT_FOR_OPENING } from '@/lib/constants'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { id } = await params

  const { data, error } = await supabase
    .from('facilities')
    .select('*, activities(*)')
    .eq('id', id)
    .order('called_at', { referencedTable: 'activities', ascending: false })
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json({ data })
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { id } = await params
  const body = await request.json() as Partial<Facility>

  // Auto-set deal_status based on enrollment_count
  if (
    body.enrollment_count != null &&
    body.enrollment_count >= MIN_ENROLLMENT_FOR_OPENING
  ) {
    body.deal_status = '【Ph6】開講決定・準備中'
  }

  const { data, error } = await supabase
    .from('facilities')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { id } = await params

  const { error } = await supabase.from('facilities').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
