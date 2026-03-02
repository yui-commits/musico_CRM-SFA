'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Facility, Activity, DealStatus } from '@/types'
import {
  DEAL_STATUSES,
  APPOINTMENT_METHODS,
  OUTREACH_TYPES,
  FLYER_DELIVERY_METHODS,
  OUTREACH_BADGE_COLORS,
  MIN_ENROLLMENT_FOR_OPENING,
  INSTRUCTORS,
  SALES_PERSON_KEY,
} from '@/lib/constants'
import { cn, formatDate, formatDateTime } from '@/lib/utils'

interface FacilityDetailPanelProps {
  facility: Facility | null
  onClose: () => void
  onUpdate: (facility: Facility) => void
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-gray-600 mb-1">{children}</label>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-1 mb-3">
      {children}
    </h3>
  )
}

function ReadonlyField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <p className="text-sm text-gray-800 bg-gray-50 rounded px-3 py-2 whitespace-pre-wrap">{value}</p>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Activities accordion
// ────────────────────────────────────────────────────────────

const LEAD_STATUS_BADGE: Record<string, string> = {
  '未着手': 'bg-gray-100 text-gray-700 border-gray-300',
  '不在・掛け直し': 'bg-blue-100 text-blue-700 border-blue-300',
  '資料送付（メール/郵送）': 'bg-indigo-100 text-indigo-700 border-indigo-300',
  '検討中・連絡待ち': 'bg-yellow-100 text-yellow-700 border-yellow-300',
  'アポ獲得': 'bg-green-100 text-green-700 border-green-300',
  'NG（失注）': 'bg-red-100 text-red-700 border-red-300',
}

function ActivitiesAccordion({ facilityId }: { facilityId: string }) {
  const [open, setOpen] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (activities.length > 0) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('facility_id', facilityId)
        .order('called_at', { ascending: false })
      if (error) throw error
      setActivities(data ?? [])
    } catch {
      toast.error('活動履歴の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [facilityId, activities.length])

  const handleToggle = () => {
    if (!open) load()
    setOpen((v) => !v)
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-left transition-colors"
      >
        <span className="text-sm font-medium text-gray-700">テレアポ活動履歴</span>
        <span className="text-xs text-gray-500">{open ? '▲ 閉じる' : '▼ 開く'}</span>
      </button>

      {open && (
        <div className="p-3 bg-white">
          {loading && (
            <p className="text-xs text-gray-400 text-center py-4">読み込み中…</p>
          )}
          {!loading && activities.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">活動記録がありません</p>
          )}
          {!loading && activities.length > 0 && (
            <div className="flex flex-col gap-2">
              {activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={cn(
                    'relative pl-5 pb-3',
                    index < activities.length - 1
                      ? 'border-l-2 border-gray-200 ml-2'
                      : 'ml-2',
                  )}
                >
                  <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-gray-300" />
                  <div className="bg-gray-50 rounded border border-gray-200 p-2.5">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs text-gray-500">
                        {formatDateTime(activity.called_at)}
                      </span>
                      <span className="text-xs font-medium text-gray-700">
                        {activity.sales_person}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border',
                          LEAD_STATUS_BADGE[activity.call_status] ??
                            'bg-gray-100 text-gray-700 border-gray-300',
                        )}
                      >
                        {activity.call_status}
                      </span>
                    </div>
                    {activity.ng_reason && (
                      <p className="text-xs text-red-600 mb-1">NG: {activity.ng_reason}</p>
                    )}
                    {activity.note && (
                      <p className="text-xs text-gray-700 whitespace-pre-wrap">{activity.note}</p>
                    )}
                    {activity.next_action && activity.next_action !== '設定なし' && (
                      <p className="text-xs text-gray-500 mt-1">
                        次回: {activity.next_action}
                        {activity.next_action_date && (
                          <span className="ml-1 font-medium text-gray-600">
                            ({formatDate(activity.next_action_date)})
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Main panel
// ────────────────────────────────────────────────────────────

export function FacilityDetailPanel({
  facility,
  onClose,
  onUpdate,
}: FacilityDetailPanelProps) {
  const [dealStatus, setDealStatus] = useState<DealStatus | ''>(
    facility?.deal_status ?? '',
  )
  const [appointmentDate, setAppointmentDate] = useState(
    facility?.appointment_date?.slice(0, 16) ?? '',
  )
  const [appointmentMethod, setAppointmentMethod] = useState(
    facility?.appointment_method ?? '',
  )
  const [outreachType, setOutreachType] = useState(
    facility?.outreach_type ?? '',
  )
  const [requiredInstructors, setRequiredInstructors] = useState(
    String(facility?.required_instructors ?? '1'),
  )
  const [assignedInstructor, setAssignedInstructor] = useState(
    facility?.assigned_instructor ?? '',
  )
  const [instructorDispatched, setInstructorDispatched] = useState(
    facility?.instructor_dispatched ?? false,
  )
  const [trialDate, setTrialDate] = useState(
    facility?.trial_date?.slice(0, 16) ?? '',
  )
  const [flyerDeliveryMethod, setFlyerDeliveryMethod] = useState(
    facility?.flyer_delivery_method ?? '',
  )
  const [applicationDeadline, setApplicationDeadline] = useState(
    facility?.application_deadline?.slice(0, 10) ?? '',
  )
  const [trialApplicants, setTrialApplicants] = useState(
    String(facility?.trial_applicants ?? ''),
  )
  const [enrollmentCount, setEnrollmentCount] = useState(
    String(facility?.enrollment_count ?? ''),
  )
  const [dealNote, setDealNote] = useState(facility?.deal_note ?? '')
  const [saving, setSaving] = useState(false)
  const [showRevertForm, setShowRevertForm] = useState(false)
  const [revertReason, setRevertReason] = useState('')

  useEffect(() => {
    if (!facility) return
    setDealStatus(facility.deal_status ?? '')
    setAppointmentDate(facility.appointment_date?.slice(0, 16) ?? '')
    setAppointmentMethod(facility.appointment_method ?? '')
    setOutreachType(facility.outreach_type ?? '')
    setRequiredInstructors(String(facility.required_instructors ?? '1'))
    setAssignedInstructor(facility.assigned_instructor ?? '')
    setInstructorDispatched(facility.instructor_dispatched ?? false)
    setTrialDate(facility.trial_date?.slice(0, 16) ?? '')
    setFlyerDeliveryMethod(facility.flyer_delivery_method ?? '')
    setApplicationDeadline(facility.application_deadline?.slice(0, 10) ?? '')
    setTrialApplicants(String(facility.trial_applicants ?? ''))
    setEnrollmentCount(String(facility.enrollment_count ?? ''))
    setDealNote(facility.deal_note ?? '')
    setShowRevertForm(false)
    setRevertReason('')
  }, [facility?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const isVisible = facility !== null
  const hideOutreachFields = outreachType === 'アウトリーチなし'

  const handleRevertConfirm = async () => {
    if (!facility) return
    setSaving(true)
    try {
      // 1. lead_status だけ戻す。商談データ（deal_status / deal_note 等）は保持
      const res = await fetch(`/api/facilities/${facility.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_status: '検討中・連絡待ち' }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? '更新に失敗しました')
      }
      const { data: updated }: { data: Facility } = await res.json()

      // 2. 理由を活動履歴として記録
      const salesPerson =
        (typeof window !== 'undefined' && localStorage.getItem(SALES_PERSON_KEY)) || '不明'
      const note = revertReason.trim()
        ? `【テレアポ管理に戻した理由】\n${revertReason.trim()}`
        : '【テレアポ管理に戻した】理由の記載なし'
      await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facility_id: facility.id,
          sales_person: salesPerson,
          call_status: '検討中・連絡待ち',
          note,
          activity_type: 'status_change',
        }),
      })

      toast.success('テレアポ管理に戻しました（履歴を記録しました）')
      onUpdate(updated)
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    if (!facility) return
    setSaving(true)

    const count = parseInt(enrollmentCount, 10)
    const willOpen = !isNaN(count) && count >= MIN_ENROLLMENT_FOR_OPENING

    const resolvedStatus: DealStatus | null =
      willOpen && dealStatus !== '【Ph6】開講決定・準備中'
        ? '【Ph6】開講決定・準備中'
        : (dealStatus as DealStatus) || null

    const payload: Partial<Facility> = {
      deal_status: resolvedStatus,
      appointment_date: appointmentDate ? appointmentDate : null,
      appointment_method: (appointmentMethod as Facility['appointment_method']) || null,
      outreach_type: (outreachType as Facility['outreach_type']) || null,
      required_instructors: hideOutreachFields
        ? null
        : parseInt(requiredInstructors, 10) || null,
      assigned_instructor: hideOutreachFields ? null : assignedInstructor || null,
      instructor_dispatched: hideOutreachFields ? false : instructorDispatched,
      trial_date: hideOutreachFields || !trialDate ? null : trialDate,
      flyer_delivery_method:
        (flyerDeliveryMethod as Facility['flyer_delivery_method']) || null,
      application_deadline: applicationDeadline || null,
      trial_applicants: hideOutreachFields
        ? null
        : parseInt(trialApplicants, 10) || null,
      enrollment_count: isNaN(count) ? null : count,
      deal_note: dealNote || null,
    }

    try {
      const res = await fetch(`/api/facilities/${facility.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? '保存に失敗しました')
      }
      const { data: updated }: { data: Facility } = await res.json()

      onUpdate(updated)

      if (willOpen) {
        toast.success('🎉 開講決定おめでとうございます！', { duration: 5000 })
        setDealStatus('【Ph6】開講決定・準備中')
      } else {
        toast.success('保存しました')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/30 z-40 transition-opacity duration-200',
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-full max-w-[560px] bg-white shadow-2xl z-50',
          'flex flex-col transition-transform duration-300 ease-in-out',
          isVisible ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Panel header */}
        <div className="flex items-start gap-3 px-5 py-4 border-b border-gray-200 bg-white">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 leading-snug truncate">
              {facility?.name ?? ''}
            </h2>
            {facility && (
              <a
                href={`tel:${facility.phone_number}`}
                className="text-sm text-blue-600 hover:underline font-mono"
              >
                {facility.phone_number.replace(/(\d{2,4})(\d{4})(\d{4})/, '$1-$2-$3')}
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none"
            aria-label="閉じる"
          >
            &times;
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
          {facility && (
            <>
              {/* フェーズ */}
              <div>
                <FieldLabel>現在のフェーズ</FieldLabel>
                <select
                  value={dealStatus}
                  onChange={(e) => setDealStatus(e.target.value as DealStatus)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- 未設定 --</option>
                  {DEAL_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* ── 施設基本情報（Pre-APO引き継ぎ） ── */}
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-blue-800">施設情報（テレアポ引き継ぎ）</h3>
                <div className="grid grid-cols-2 gap-3">
                  {facility.type && (
                    <div>
                      <FieldLabel>施設種別</FieldLabel>
                      <p className="text-sm text-gray-800">{facility.type}</p>
                    </div>
                  )}
                  {facility.capacity != null && (
                    <div>
                      <FieldLabel>園児数</FieldLabel>
                      <p className="text-sm text-gray-800">{facility.capacity}名</p>
                    </div>
                  )}
                  {facility.key_person_name && (
                    <div>
                      <FieldLabel>園長／担当者名</FieldLabel>
                      <p className="text-sm text-gray-800">{facility.key_person_name}</p>
                    </div>
                  )}
                  {facility.email && (
                    <div>
                      <FieldLabel>代表メール</FieldLabel>
                      <p className="text-sm text-gray-800 break-all">{facility.email}</p>
                    </div>
                  )}
                </div>
                {facility.existing_classes && (
                  <ReadonlyField label="既存の課外教室" value={facility.existing_classes} />
                )}
                {facility.features && (
                  <ReadonlyField label="園の特色・方針" value={facility.features} />
                )}
                {facility.website_url && (
                  <div>
                    <FieldLabel>Webサイト</FieldLabel>
                    <a
                      href={facility.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {facility.website_url}
                    </a>
                  </div>
                )}
              </div>

              {/* テレアポ活動履歴 */}
              <ActivitiesAccordion facilityId={facility.id} />

              {/* ── 商談メモ ── */}
              <div>
                <SectionHeading>商談・引き継ぎメモ</SectionHeading>
                <textarea
                  value={dealNote}
                  onChange={(e) => setDealNote(e.target.value)}
                  rows={4}
                  placeholder="面談内容、園側の反応、引き継ぎ事項などを記録..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                />
              </div>

              {/* ── 面談・基本情報 ── */}
              <div>
                <SectionHeading>面談・基本情報</SectionHeading>
                <div className="flex flex-col gap-3">
                  <div>
                    <FieldLabel>面談日時</FieldLabel>
                    <input
                      type="datetime-local"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <FieldLabel>面談方法</FieldLabel>
                    <select
                      value={appointmentMethod}
                      onChange={(e) => setAppointmentMethod(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- 未設定 --</option>
                      {APPOINTMENT_METHODS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ── アウトリーチの型 ── */}
              <div>
                <SectionHeading>アウトリーチの型</SectionHeading>
                <div className="flex flex-col gap-2">
                  <select
                    value={outreachType}
                    onChange={(e) => setOutreachType(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- 未設定 --</option>
                    {OUTREACH_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {outreachType && (
                    <span
                      className={cn(
                        'self-start inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                        OUTREACH_BADGE_COLORS[outreachType] ??
                          'bg-gray-100 text-gray-800 border-gray-300',
                      )}
                    >
                      {outreachType}
                    </span>
                  )}
                </div>
              </div>

              {/* ── 調整・手配（アウトリーチなし以外） ── */}
              {!hideOutreachFields && (
                <div>
                  <SectionHeading>講師・体験会調整</SectionHeading>
                  <div className="flex flex-col gap-3">
                    <div>
                      <FieldLabel>必要講師数</FieldLabel>
                      <select
                        value={requiredInstructors}
                        onChange={(e) => setRequiredInstructors(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="1">1名</option>
                        <option value="2">2名</option>
                      </select>
                    </div>

                    {/* 担当講師（将来的に複数選択に拡張可能） */}
                    <div>
                      <FieldLabel>担当講師</FieldLabel>
                      <select
                        value={assignedInstructor}
                        onChange={(e) => setAssignedInstructor(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- 未アサイン --</option>
                        {INSTRUCTORS.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>

                    {/* 派遣済みチェック */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={instructorDispatched}
                        onChange={(e) => setInstructorDispatched(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">講師派遣済み</span>
                    </label>

                    <div>
                      <FieldLabel>体験会日時</FieldLabel>
                      <input
                        type="datetime-local"
                        value={trialDate}
                        onChange={(e) => setTrialDate(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── 販促物・募集 ── */}
              <div>
                <SectionHeading>販促物・募集</SectionHeading>
                <div className="flex flex-col gap-3">
                  <div>
                    <FieldLabel>チラシ配布方法</FieldLabel>
                    <select
                      value={flyerDeliveryMethod}
                      onChange={(e) => setFlyerDeliveryMethod(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- 未設定 --</option>
                      {FLYER_DELIVERY_METHODS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>申込締切日</FieldLabel>
                    <input
                      type="date"
                      value={applicationDeadline}
                      onChange={(e) => setApplicationDeadline(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* ── 結果集計 ── */}
              <div>
                <SectionHeading>結果集計</SectionHeading>
                <div className="flex flex-col gap-3">
                  {!hideOutreachFields && (
                    <div>
                      <FieldLabel>体験会申込者数</FieldLabel>
                      <input
                        type="number"
                        min={0}
                        value={trialApplicants}
                        onChange={(e) => setTrialApplicants(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                  )}
                  <div>
                    <FieldLabel>
                      <span className="font-bold text-gray-800">
                        受講申込数（開講判断ライン: {MIN_ENROLLMENT_FOR_OPENING}名以上）
                      </span>
                    </FieldLabel>
                    <input
                      type="number"
                      min={0}
                      value={enrollmentCount}
                      onChange={(e) => setEnrollmentCount(e.target.value)}
                      className={cn(
                        'w-full border rounded-md px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2',
                        parseInt(enrollmentCount, 10) >= MIN_ENROLLMENT_FOR_OPENING
                          ? 'border-green-400 bg-green-50 text-green-800 focus:ring-green-500'
                          : 'border-gray-300 focus:ring-blue-500',
                      )}
                      placeholder="0"
                    />
                    {parseInt(enrollmentCount, 10) >= MIN_ENROLLMENT_FOR_OPENING && (
                      <p className="text-xs text-green-700 font-semibold mt-1">
                        🎊 開講ラインに達しています！保存すると「開講決定」に移行します。
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex flex-col gap-2">
          {!showRevertForm ? (
            <>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 border border-gray-300 text-gray-700 rounded-md py-2 text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white rounded-md py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? '保存中…' : '保存'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowRevertForm(true)}
                disabled={saving}
                className="w-full border border-orange-300 text-orange-700 rounded-md py-1.5 text-xs font-medium hover:bg-orange-50 disabled:opacity-50 transition-colors"
              >
                ↩ テレアポ管理に戻す
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-orange-800">
                ↩ テレアポ管理に戻す — 理由を記入してください
              </p>
              <p className="text-xs text-gray-500">
                商談・体験会フェーズで入力した情報やメモはそのまま保持されます。
              </p>
              <textarea
                value={revertReason}
                onChange={(e) => setRevertReason(e.target.value)}
                rows={3}
                placeholder="例：体験会の参加者が集まらず再フォロー必要、日程変更で再調整へ…（任意）"
                className="w-full border border-orange-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowRevertForm(false); setRevertReason('') }}
                  className="flex-1 border border-gray-300 text-gray-700 rounded-md py-2 text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleRevertConfirm}
                  disabled={saving}
                  className="flex-1 bg-orange-600 text-white rounded-md py-2 text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? '処理中…' : '戻す・履歴に記録'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
