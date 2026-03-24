'use client'

import { useMemo, useState } from 'react'
import { Facility, LeadStatus } from '@/types'
import { formatDate } from '@/lib/utils'
import { formatPhoneNumber } from '@/lib/normalizers'

interface FacilityListProps {
  facilities: Facility[]
  onSelect: (id: string) => void
}

const STATUS_BADGE: Record<LeadStatus, string> = {
  '未着手': 'bg-gray-100 text-gray-700 border-gray-300',
  '不在・掛け直し': 'bg-blue-100 text-blue-700 border-blue-300',
  '資料送付（メール/郵送）': 'bg-indigo-100 text-indigo-700 border-indigo-300',
  '検討中・連絡待ち': 'bg-yellow-100 text-yellow-700 border-yellow-300',
  'アポ獲得': 'bg-green-100 text-green-700 border-green-300',
  'NG（失注）': 'bg-red-100 text-red-700 border-red-300',
}

type SortDir = 'asc' | 'desc'
type SortKey = 'next_action_date' | 'capacity'

function sortFacilities(facilities: Facility[], key: SortKey, dir: SortDir): Facility[] {
  return [...facilities].sort((a, b) => {
    if (key === 'capacity') {
      const aVal = a.capacity
      const bVal = b.capacity
      if (aVal == null && bVal == null) return a.created_at.localeCompare(b.created_at)
      if (aVal == null) return 1
      if (bVal == null) return -1
      const cmp = aVal - bVal
      return dir === 'asc' ? cmp : -cmp
    }
    // next_action_date
    const aDate = (a as Facility & { next_action_date?: string | null }).next_action_date
    const bDate = (b as Facility & { next_action_date?: string | null }).next_action_date
    if (dir === 'asc') {
      if (aDate && bDate) return aDate.localeCompare(bDate)
      if (aDate) return -1
      if (bDate) return 1
    } else {
      if (aDate && bDate) return bDate.localeCompare(aDate)
      if (aDate) return 1
      if (bDate) return -1
    }
    return a.created_at.localeCompare(b.created_at)
  })
}

export default function FacilityList({ facilities, onSelect }: FacilityListProps) {
  const [sortKey, setSortKey] = useState<SortKey>('next_action_date')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const sorted = useMemo(
    () => sortFacilities(facilities, sortKey, sortDir),
    [facilities, sortKey, sortDir]
  )

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <span className="text-sm font-medium text-gray-700">
          {sorted.length}<span className="ml-1 font-normal text-gray-500">件</span>
        </span>
      </div>

      {sorted.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-sm">
          該当する施設がありません
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">施設名</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">エリア</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">電話番号</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">ステータス</th>
                <th
                  className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap cursor-pointer select-none hover:text-blue-600"
                  onClick={() => handleSort('capacity')}
                >
                  定員数
                  {sortKey === 'capacity' && (
                    <span className="ml-1 inline-block">
                      {sortDir === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
                <th
                  className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap cursor-pointer select-none hover:text-blue-600"
                  onClick={() => handleSort('next_action_date')}
                >
                  次回予定日
                  {sortKey === 'next_action_date' && (
                    <span className="ml-1 inline-block">
                      {sortDir === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">次回アクション</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((facility) => {
                const f = facility as Facility & {
                  next_action_date?: string | null
                  next_action?: string | null
                }
                return (
                  <tr
                    key={facility.id}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => onSelect(facility.id)}
                  >
                    <td className="px-4 py-3 max-w-[240px]">
                      <p className="font-medium text-gray-900 truncate">{facility.name}</p>
                      {facility.operating_company && (
                        <p className="text-xs text-gray-400 truncate">{facility.operating_company}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {facility.prefecture}{facility.municipality}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap font-mono text-xs">
                      {formatPhoneNumber(facility.phone_number)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE[facility.lead_status]}`}
                      >
                        {facility.lead_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                      {facility.capacity != null ? `${facility.capacity}名` : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                      {f.next_action_date ? formatDate(f.next_action_date) : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                      {f.next_action ?? '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelect(facility.id)
                        }}
                      >
                        詳細・架電する
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
