import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Activity } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json() as Omit<Activity, 'id' | 'called_at'> & {
    appointment_date?: string | null
    appointment_method?: string | null
  }

  const {
    appointment_date,
    appointment_method,
    ...activityData
  } = body

  // '未着手' は実架電ではなくリセット操作なので status_change として記録する
  const activityType: 'call' | 'status_change' =
    activityData.call_status === '未着手'
      ? 'status_change'
      : (activityData.activity_type ?? 'call')

  // Insert activity
  const { data: activity, error: activityError } = await supabase
    .from('activities')
    .insert([{ ...activityData, activity_type: activityType, called_at: new Date().toISOString() }])
    .select()
    .single()

  if (activityError) {
    return NextResponse.json({ error: activityError.message }, { status: 400 })
  }

  // Update facility lead_status
  const facilityUpdate: Record<string, unknown> = {
    lead_status: activityData.call_status,
  }

  // Handle apo acquisition
  if (activityData.call_status === 'アポ獲得') {
    facilityUpdate.appointment_date = appointment_date || null
    facilityUpdate.appointment_method = appointment_method || null
    facilityUpdate.deal_status = appointment_date
      ? '面談設定済'
      : '面談日程調整中'
  }

  const { error: facilityError } = await supabase
    .from('facilities')
    .update(facilityUpdate)
    .eq('id', activityData.facility_id)

  if (facilityError) {
    return NextResponse.json({ error: facilityError.message }, { status: 400 })
  }

  return NextResponse.json({ data: activity }, { status: 201 })
}
