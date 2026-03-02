import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'
import { createClient } from '@/lib/supabase/server'
import { normalizePhoneNumber } from '@/lib/normalizers'

interface CSVRow {
  架電日時?: string
  電話番号?: string
  担当者?: string
  ステータス?: string
  対応者名?: string
  'NG理由'?: string
  詳細メモ?: string
  次回アクション?: string
  次回予定日?: string
  [key: string]: string | undefined
}

interface ErrorRow {
  row: number
  phone: string
  reason: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: 'ファイルが必要です' }, { status: 400 })
  }

  const rawText = await file.text()
  const text = rawText.replace(/^\uFEFF/, '')
  const firstLine = text.split('\n')[0] ?? ''
  const delimiter = firstLine.includes('\t') ? '\t' : ','

  const { data: rows, errors: parseErrors } = Papa.parse<CSVRow>(text, {
    header: true,
    skipEmptyLines: true,
    delimiter,
  })

  const fatalErrors = parseErrors.filter(e => e.type === 'Delimiter' || e.type === 'Abort')
  if (fatalErrors.length > 0) {
    return NextResponse.json({ error: 'CSVの解析に失敗しました' }, { status: 400 })
  }

  let successCount = 0
  const errorRows: ErrorRow[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2

    const rawPhone = row['電話番号']?.trim() || ''
    const phone = normalizePhoneNumber(rawPhone)
    const callStatus = row['ステータス']?.trim()
    const salesPerson = row['担当者']?.trim()
    const calledAt = row['架電日時']?.trim()

    if (!phone) {
      errorRows.push({ row: rowNum, phone: rawPhone, reason: '電話番号が空です' })
      continue
    }
    if (!callStatus) {
      errorRows.push({ row: rowNum, phone: rawPhone, reason: 'ステータスが空です' })
      continue
    }
    if (!salesPerson) {
      errorRows.push({ row: rowNum, phone: rawPhone, reason: '担当者が空です' })
      continue
    }

    // Match facility
    const { data: facility } = await supabase
      .from('facilities')
      .select('id')
      .eq('phone_number', phone)
      .single()

    if (!facility) {
      errorRows.push({ row: rowNum, phone: rawPhone, reason: '施設マスタに未登録の電話番号です' })
      continue
    }

    // Insert activity
    const { error: activityError } = await supabase
      .from('activities')
      .insert([{
        facility_id: facility.id,
        sales_person: salesPerson,
        called_at: calledAt ? new Date(calledAt).toISOString() : new Date().toISOString(),
        recipient_name: row['対応者名']?.trim() || null,
        call_status: callStatus,
        ng_reason: row['NG理由']?.trim() || null,
        note: row['詳細メモ']?.trim() || null,
        next_action: row['次回アクション']?.trim() || null,
        next_action_date: row['次回予定日'] ? new Date(row['次回予定日']).toISOString() : null,
      }])

    if (activityError) {
      errorRows.push({ row: rowNum, phone: rawPhone, reason: activityError.message })
      continue
    }

    // Update facility lead_status (and deal_status if アポ獲得)
    const facilityUpdate: Record<string, unknown> = { lead_status: callStatus }
    if (callStatus === 'アポ獲得') {
      facilityUpdate.deal_status = '面談日程調整中'
    }
    await supabase
      .from('facilities')
      .update(facilityUpdate)
      .eq('id', facility.id)

    successCount++
  }

  return NextResponse.json({
    success_count: successCount,
    error_count: errorRows.length,
    errors: errorRows.map(e => ({ row: e.row, phone_number: e.phone, reason: e.reason })),
    total: rows.length,
  })
}
