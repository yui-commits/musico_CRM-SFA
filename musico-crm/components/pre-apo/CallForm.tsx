'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { LEAD_STATUSES, NG_REASONS_FALLBACK, NEXT_ACTIONS, APPOINTMENT_METHODS, SALES_PERSON_KEY } from '@/lib/constants'
import { LeadStatus } from '@/types'

interface CallFormProps {
  facilityId: string
  onSaved: (wasApo: boolean, nextFacilityId?: string) => void
  onSavedNext?: (wasApo: boolean) => void
}

interface FormState {
  salesPerson: string
  callStatus: LeadStatus | ''
  ngReason: string
  note: string
  nextAction: string
  nextActionDate: string
  appointmentDate: string
  appointmentMethod: string
  recipientName: string
}

const INITIAL_STATE: FormState = {
  salesPerson: '',
  callStatus: '',
  ngReason: '',
  note: '',
  nextAction: '',
  nextActionDate: '',
  appointmentDate: '',
  appointmentMethod: '',
  recipientName: '',
}

export default function CallForm({ facilityId, onSaved, onSavedNext }: CallFormProps) {
  const [form, setForm] = useState<FormState>(INITIAL_STATE)
  const [isDirty, setIsDirty] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ngReasons, setNgReasons] = useState<string[]>(NG_REASONS_FALLBACK)

  // Load sales person from localStorage on mount
  useEffect(() => {
    const person = localStorage.getItem(SALES_PERSON_KEY) ?? ''
    setForm((prev) => ({ ...prev, salesPerson: person }))
  }, [])

  // Fetch NG reasons from DB
  useEffect(() => {
    fetch('/api/ng-reasons')
      .then((res) => res.json())
      .then((json) => {
        if (json.data?.length) {
          setNgReasons(json.data.map((r: { name: string }) => r.name))
        }
      })
      .catch(() => { /* フォールバック値を使用 */ })
  }, [])

  // Warn before unload when dirty
  const handleBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    },
    [isDirty]
  )

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [handleBeforeUnload])

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setIsDirty(true)
  }

  const isApo = form.callStatus === 'アポ獲得'
  const isNG = form.callStatus === 'NG（失注）'

  async function submit(action: 'back' | 'next') {
    if (!form.callStatus) {
      toast.error('架電ステータスを選択してください')
      return
    }
    if (isNG && !form.ngReason) {
      toast.error('NG理由を選択してください')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        facility_id: facilityId,
        sales_person: form.salesPerson,
        called_at: new Date().toISOString(),
        recipient_name: form.recipientName || null,
        call_status: form.callStatus,
        ng_reason: isNG ? form.ngReason || null : null,
        note: form.note || null,
        next_action: !isApo ? form.nextAction || null : null,
        next_action_date: !isApo ? form.nextActionDate || null : null,
        appointment_date: isApo ? form.appointmentDate || null : null,
        appointment_method: isApo ? form.appointmentMethod || null : null,
      }

      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'サーバーエラーが発生しました')
      }

      const data = await res.json()
      toast.success('架電記録を保存しました')
      setIsDirty(false)

      const wasApo = form.callStatus === 'アポ獲得'
      if (action === 'next' && onSavedNext) {
        onSavedNext(wasApo)
      } else {
        onSaved(wasApo, action === 'next' ? data.nextFacilityId : undefined)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => e.preventDefault()}
    >
      {/* 担当者 (readonly) */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">担当者</label>
        <input
          type="text"
          readOnly
          value={form.salesPerson || '未設定'}
          className="h-9 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-600 cursor-not-allowed"
        />
      </div>

      {/* 対応者名 */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">対応者名</label>
        <input
          type="text"
          placeholder="電話に出た方のお名前"
          className="h-9 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.recipientName}
          onChange={(e) => setField('recipientName', e.target.value)}
        />
      </div>

      {/* 架電ステータス */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">
          架電ステータス <span className="text-red-500">*</span>
        </label>
        <select
          required
          className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.callStatus}
          onChange={(e) => setField('callStatus', e.target.value as LeadStatus)}
        >
          <option value="">選択してください</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* NG理由 (conditional) */}
      {isNG && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">
            NG理由 <span className="text-red-500">*</span>
          </label>
          <select
            required
            className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.ngReason}
            onChange={(e) => setField('ngReason', e.target.value)}
          >
            <option value="">選択してください</option>
            {ngReasons.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 詳細メモ */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">詳細メモ</label>
        <textarea
          rows={3}
          placeholder="通話内容のメモを入力..."
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          value={form.note}
          onChange={(e) => setField('note', e.target.value)}
        />
      </div>

      {/* Non-APO fields */}
      {form.callStatus && !isApo && (
        <div className="flex flex-col gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">次回フォロー</p>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">次回アクション</label>
            <select
              className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.nextAction}
              onChange={(e) => setField('nextAction', e.target.value)}
            >
              <option value="">選択してください</option>
              {NEXT_ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">次回予定日</label>
            <input
              type="date"
              className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.nextActionDate}
              onChange={(e) => setField('nextActionDate', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* APO fields */}
      {isApo && (
        <div className="flex flex-col gap-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-xs font-medium text-green-700 uppercase tracking-wide">アポ獲得 - 面談情報</p>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">面談予定日時（任意）</label>
            <input
              type="datetime-local"
              className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={form.appointmentDate}
              onChange={(e) => setField('appointmentDate', e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">面談実施形式</label>
            <select
              className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={form.appointmentMethod}
              onChange={(e) => setField('appointmentMethod', e.target.value)}
            >
              <option value="">選択してください</option>
              {APPOINTMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Submit buttons */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => submit('back')}
          className="flex-1 h-10 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? '保存中...' : '保存して一覧へ戻る'}
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => submit('next')}
          className="flex-1 h-10 rounded-md bg-gray-800 text-white text-sm font-medium hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? '保存中...' : '保存して次のリストへ'}
        </button>
      </div>
    </form>
  )
}
