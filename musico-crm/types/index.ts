export type LeadStatus =
  | '未着手'
  | '不在・掛け直し'
  | '資料送付（メール/郵送）'
  | '検討中・連絡待ち'
  | 'アポ獲得'
  | 'NG（失注）'

export type DealStatus =
  | '面談日程調整中'
  | '面談設定済'
  | '【Ph1】面談実施済・合意'
  | '【Ph2】体験会・講師調整中'
  | '【Ph2】体験会日程確定'
  | '【Ph3】チラシ作成中'
  | '【Ph3】チラシ送付完了'
  | '【Ph4】告知・募集期間中'
  | '【Ph5】体験会準備中'
  | '【Ph5】体験会実施済・集計中'
  | '【Ph6】開講決定・準備中'
  | '開講見送り / 失注'

export type FacilityType =
  | '幼稚園'
  | '保育園'
  | '認定こども園'
  | '学童'
  | 'その他'

export type AppointmentMethod = '訪問' | 'オンライン' | '来社'

export type OutreachType =
  | '体験会のみ'
  | 'ミニコンサート＋体験会'
  | '効率型'
  | 'アウトリーチなし'

export type FlyerDeliveryMethod =
  | 'データ(PDF)送付'
  | '印刷・郵送'
  | '印刷・持参'

export type NgReason = string

export type NextAction =
  | '設定なし'
  | '再架電（フォローコール）'
  | 'メール送付'
  | '資料郵送'
  | '先方からの連絡待ち'
  | 'MTG・体験会実施'

export interface Facility {
  id: string
  name: string
  operating_company: string | null
  phone_number: string
  type: FacilityType | null
  prefecture: string
  municipality: string
  address: string | null
  email: string | null
  website_url: string | null
  key_person_name: string | null
  capacity: number | null
  existing_classes: string | null
  features: string | null
  ai_sales_script: string | null
  lead_status: LeadStatus
  deal_status: DealStatus | null
  appointment_date: string | null
  appointment_method: AppointmentMethod | null
  outreach_type: OutreachType | null
  required_instructors: number | null
  trial_date: string | null
  flyer_delivery_method: FlyerDeliveryMethod | null
  application_deadline: string | null
  trial_applicants: number | null
  enrollment_count: number | null
  deal_note: string | null
  assigned_instructor: string | null
  instructor_dispatched: boolean
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  facility_id: string
  sales_person: string
  called_at: string
  recipient_name: string | null
  call_status: LeadStatus
  ng_reason: NgReason | null
  note: string | null
  next_action: NextAction | null
  next_action_date: string | null
  /** 'call' = 実架電, 'status_change' = フェーズ移動・状態変更（架電数に含めない） */
  activity_type: 'call' | 'status_change'
}

export interface FacilityWithActivities extends Facility {
  activities: Activity[]
}

export interface KPISummary {
  totalCalls: number
  totalApos: number
  apoRate: number
  totalMeetings: number
  totalEnrollments: number
  enrollmentCount: number
}

export interface LeaderBoardRow {
  sales_person: string
  call_count: number
  apo_count: number
  apo_rate: number
  enrollment_count: number
  top_ng_reason: string | null
}
