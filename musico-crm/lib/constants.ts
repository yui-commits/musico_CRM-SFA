import type { LeadStatus, DealStatus, NextAction, FacilityType, AppointmentMethod, OutreachType, FlyerDeliveryMethod } from '@/types'

export const LEAD_STATUSES: LeadStatus[] = [
  '未着手',
  '不在・掛け直し',
  '資料送付（メール/郵送）',
  '検討中・連絡待ち',
  'アポ獲得',
  'NG（失注）',
]

export const DEAL_STATUSES: DealStatus[] = [
  '面談日程調整中',
  '面談設定済',
  '【Ph1】面談実施済・合意',
  '【Ph2】体験会・講師調整中',
  '【Ph2】体験会日程確定',
  '【Ph3】チラシ作成中',
  '【Ph3】チラシ送付完了',
  '【Ph4】告知・募集期間中',
  '【Ph5】体験会準備中',
  '【Ph5】体験会実施済・集計中',
  '【Ph6】開講決定・準備中',
  '開講見送り / 失注',
]

export const KANBAN_LANES: { status: DealStatus; label: string; emoji: string }[] = [
  { status: '面談日程調整中', label: '面談日程調整中', emoji: '⏳' },
  { status: '面談設定済', label: '面談設定済', emoji: '📅' },
  { status: '【Ph2】体験会・講師調整中', label: 'Ph1-2 面談実施済・体験会講師調整中', emoji: '🎻' },
  { status: '【Ph2】体験会日程確定', label: 'Ph2 体験会日程および講師確定', emoji: '📆' },
  { status: '【Ph3】チラシ作成中', label: 'Ph3 チラシ作成中', emoji: '🎨' },
  { status: '【Ph4】告知・募集期間中', label: 'Ph3-4 チラシ送付完了・告知期間中', emoji: '📬' },
  { status: '【Ph5】体験会準備中', label: 'Ph5 体験会準備中', emoji: '🎯' },
  { status: '【Ph5】体験会実施済・集計中', label: 'Ph5 体験会実施済・集計中', emoji: '📊' },
  { status: '【Ph6】開講決定・準備中', label: 'Ph6 開講決定🎊', emoji: '🎊' },
  { status: '開講見送り / 失注', label: '開講見送り / 失注', emoji: '❌' },
]

/** @deprecated DBマスタ(ng_reasons)から取得する。フォールバック用に残す */
export const NG_REASONS_FALLBACK: string[] = [
  '物理的要因',
  '競合・既存あり',
  '特色・ターゲット不一致',
  '募集停止中',
  'その他',
]

export const NEXT_ACTIONS: NextAction[] = [
  '設定なし',
  '再架電（フォローコール）',
  'メール送付',
  '資料郵送',
  '先方からの連絡待ち',
  'MTG・体験会実施',
]

export const FACILITY_TYPES: FacilityType[] = [
  '幼稚園',
  '保育園',
  '認定こども園',
  '学童',
  'その他',
]

export const APPOINTMENT_METHODS: AppointmentMethod[] = [
  '訪問',
  'オンライン',
  '来社',
]

export const OUTREACH_TYPES: OutreachType[] = [
  '体験会のみ',
  'ミニコンサート＋体験会',
  '効率型',
  'アウトリーチなし',
]

export const FLYER_DELIVERY_METHODS: FlyerDeliveryMethod[] = [
  'データ(PDF)送付',
  '印刷・郵送',
  '印刷・持参',
]

export const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
]

export const SALES_PERSON_KEY = 'musico_sales_person'

export const OUTREACH_BADGE_COLORS: Record<string, string> = {
  'ミニコンサート＋体験会': 'bg-blue-100 text-blue-800 border-blue-300',
  '体験会のみ': 'bg-green-100 text-green-800 border-green-300',
  '効率型': 'bg-orange-100 text-orange-800 border-orange-300',
  'アウトリーチなし': 'bg-gray-100 text-gray-800 border-gray-300',
}

export const INSTRUCTORS = ['三上のどか']

export const MIN_ENROLLMENT_FOR_OPENING = 3
