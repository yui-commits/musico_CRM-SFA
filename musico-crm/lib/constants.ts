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

export const KANBAN_LANES: { status: DealStatus; label: string }[] = [
  { status: '面談日程調整中', label: '日程調整中' },
  { status: '面談設定済', label: '面談確定' },
  { status: '【Ph2】体験会・講師調整中', label: '講師・体験会調整' },
  { status: '【Ph2】体験会日程確定', label: '体験会日程確定' },
  { status: '【Ph3】チラシ作成中', label: 'チラシ作成' },
  { status: '【Ph4】告知・募集期間中', label: '告知・募集中' },
  { status: '【Ph5】体験会準備中', label: '体験会準備' },
  { status: '【Ph5】体験会実施済・集計中', label: '実施済・集計' },
  { status: '【Ph6】開講決定・準備中', label: '開講決定' },
  { status: '開講見送り / 失注', label: '見送り・失注' },
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

/** フェーズグループ定義（カンバンUI用） */
export const PHASE_GROUPS = [
  {
    label: '面談',
    color: 'blue',
    headerBg: 'bg-blue-50',
    headerText: 'text-blue-700',
    headerBorder: 'border-blue-200',
    countBg: 'bg-blue-100 text-blue-700',
    dropBg: 'bg-blue-50/50',
    dropBorder: 'border-blue-100',
    dropOverBg: 'bg-blue-100/60',
    dropOverBorder: 'border-blue-400',
    barColor: 'bg-blue-500',
    statuses: ['面談日程調整中', '面談設定済'] as DealStatus[],
  },
  {
    label: '準備',
    color: 'violet',
    headerBg: 'bg-violet-50',
    headerText: 'text-violet-700',
    headerBorder: 'border-violet-200',
    countBg: 'bg-violet-100 text-violet-700',
    dropBg: 'bg-violet-50/50',
    dropBorder: 'border-violet-100',
    dropOverBg: 'bg-violet-100/60',
    dropOverBorder: 'border-violet-400',
    barColor: 'bg-violet-500',
    statuses: ['【Ph2】体験会・講師調整中', '【Ph2】体験会日程確定', '【Ph3】チラシ作成中'] as DealStatus[],
  },
  {
    label: '募集・実施',
    color: 'amber',
    headerBg: 'bg-amber-50',
    headerText: 'text-amber-700',
    headerBorder: 'border-amber-200',
    countBg: 'bg-amber-100 text-amber-700',
    dropBg: 'bg-amber-50/50',
    dropBorder: 'border-amber-100',
    dropOverBg: 'bg-amber-100/60',
    dropOverBorder: 'border-amber-400',
    barColor: 'bg-amber-500',
    statuses: ['【Ph4】告知・募集期間中', '【Ph5】体験会準備中', '【Ph5】体験会実施済・集計中'] as DealStatus[],
  },
  {
    label: '結果',
    color: 'green',
    headerBg: 'bg-green-50',
    headerText: 'text-green-700',
    headerBorder: 'border-green-200',
    countBg: 'bg-green-100 text-green-700',
    dropBg: 'bg-green-50/50',
    dropBorder: 'border-green-100',
    dropOverBg: 'bg-green-100/60',
    dropOverBorder: 'border-green-400',
    barColor: 'bg-green-500',
    statuses: ['【Ph6】開講決定・準備中'] as DealStatus[],
  },
  {
    label: '終了',
    color: 'gray',
    headerBg: 'bg-gray-50',
    headerText: 'text-gray-500',
    headerBorder: 'border-gray-200',
    countBg: 'bg-gray-200 text-gray-600',
    dropBg: 'bg-gray-50/50',
    dropBorder: 'border-gray-100',
    dropOverBg: 'bg-gray-100/60',
    dropOverBorder: 'border-gray-400',
    barColor: 'bg-gray-400',
    statuses: ['開講見送り / 失注'] as DealStatus[],
  },
]

export const OUTREACH_BADGE_COLORS: Record<string, string> = {
  'ミニコンサート＋体験会': 'bg-blue-100 text-blue-800 border-blue-300',
  '体験会のみ': 'bg-green-100 text-green-800 border-green-300',
  '効率型': 'bg-orange-100 text-orange-800 border-orange-300',
  'アウトリーチなし': 'bg-gray-100 text-gray-800 border-gray-300',
}

export const INSTRUCTORS = ['三上のどか']

export const MIN_ENROLLMENT_FOR_OPENING = 3
