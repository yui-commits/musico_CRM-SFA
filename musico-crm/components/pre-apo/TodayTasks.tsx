'use client'

import { useMemo } from 'react'
import { Facility, LeadStatus } from '@/types'
import { isDueOrOverdue, isOverdue, isDueToday, formatDate } from '@/lib/utils'

interface TodayTasksProps {
  facilities: Facility[]
  onSelect: (id: string) => void
}

type FacilityWithMeta = Facility & {
  next_action_date?: string | null
  next_action?: string | null
}

const STATUS_BADGE: Record<LeadStatus, string> = {
  '未着手': 'bg-gray-100 text-gray-700',
  '不在・掛け直し': 'bg-blue-100 text-blue-700',
  '資料送付（メール/郵送）': 'bg-indigo-100 text-indigo-700',
  '検討中・連絡待ち': 'bg-yellow-100 text-yellow-700',
  'アポ獲得': 'bg-green-100 text-green-700',
  'NG（失注）': 'bg-red-100 text-red-700',
}

export default function TodayTasks({ facilities, onSelect }: TodayTasksProps) {
  const dueFacilities = useMemo(() => {
    return (facilities as FacilityWithMeta[]).filter(
      (f) => isDueOrOverdue(f.next_action_date ?? null)
    )
  }, [facilities])

  if (dueFacilities.length === 0) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base font-bold text-amber-800">今日のタスク</span>
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-amber-500 text-white text-xs font-bold">
          {dueFacilities.length}件
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {dueFacilities.map((facility) => {
          const f = facility as FacilityWithMeta
          const overdue = isOverdue(f.next_action_date ?? null)
          const today = isDueToday(f.next_action_date ?? null)

          return (
            <div
              key={facility.id}
              className="flex items-center gap-3 bg-white rounded-md border border-amber-100 px-3 py-2 cursor-pointer hover:bg-amber-50 transition-colors"
              onClick={() => onSelect(facility.id)}
            >
              {/* Overdue indicator */}
              <span className="text-base flex-shrink-0">
                {overdue ? '🔴' : today ? '🟡' : '⚪'}
              </span>

              {/* Facility name */}
              <span className="font-medium text-gray-900 text-sm flex-1 truncate">
                {facility.name}
              </span>

              {/* Status badge */}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[facility.lead_status]}`}
              >
                {facility.lead_status}
              </span>

              {/* Next action */}
              <span className="text-xs text-gray-500 whitespace-nowrap hidden sm:block">
                {f.next_action ?? '-'}
              </span>

              {/* Date */}
              <span
                className={`text-xs font-medium whitespace-nowrap ${overdue ? 'text-red-600' : 'text-amber-700'}`}
              >
                {f.next_action_date ? formatDate(f.next_action_date) : '-'}
                {overdue && <span className="ml-1 text-red-500">(期限超過)</span>}
              </span>

              <button
                className="ml-auto flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(facility.id)
                }}
              >
                架電する
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
