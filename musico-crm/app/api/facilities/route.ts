import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Facility } from '@/types'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const leadStatus = searchParams.get('lead_status')
  const prefecture = searchParams.get('prefecture')
  const municipality = searchParams.get('municipality')
  const search = searchParams.get('search')
  const todayTasks = searchParams.get('today_tasks')
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('page_size') || '50')

  let query = supabase
    .from('facilities')
    .select('*', { count: 'exact' })

  // Pre-APO: only non-apo statuses
  if (leadStatus === 'pre-apo') {
    query = query.neq('lead_status', 'アポ獲得')
  } else if (leadStatus) {
    query = query.eq('lead_status', leadStatus)
  }

  // Post-APO: only apo-acquired
  if (searchParams.get('post_apo') === 'true') {
    query = query.eq('lead_status', 'アポ獲得')
  }

  if (prefecture) query = query.eq('prefecture', prefecture)
  if (municipality) query = query.ilike('municipality', `%${municipality}%`)

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone_number.ilike.%${search}%`)
  }

  if (todayTasks === 'true') {
    const today = new Date().toISOString().split('T')[0]
    query = query.lte('activities.next_action_date', `${today}T23:59:59.999Z`)
  }

  const offset = (page - 1) * pageSize

  const { data, error, count } = await query
    .order('updated_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, count, page, pageSize })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json() as Partial<Facility>

  const { data, error } = await supabase
    .from('facilities')
    .insert([body])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
