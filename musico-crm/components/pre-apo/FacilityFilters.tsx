'use client'

import { useState, useMemo } from 'react'
import { PREFECTURES, LEAD_STATUSES } from '@/lib/constants'
import { LeadStatus, Facility } from '@/types'

interface FilterState {
  prefecture: string
  municipality: string
  leadStatus: string
  search: string
}

interface FacilityFiltersProps {
  onFilter: (filters: { prefecture?: string; municipality?: string; leadStatus?: string; search?: string }) => void
  facilities?: Facility[]
}

const PRE_APO_STATUSES = LEAD_STATUSES.filter((s): s is LeadStatus => s !== 'アポ獲得')

function countActiveFilters(filters: FilterState): number {
  let count = 0
  if (filters.prefecture) count++
  if (filters.municipality) count++
  if (filters.leadStatus) count++
  if (filters.search.trim()) count++
  return count
}

export default function FacilityFilters({ onFilter, facilities = [] }: FacilityFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    prefecture: '',
    municipality: '',
    leadStatus: '',
    search: '',
  })

  const municipalityOptions = useMemo(() => {
    if (!filters.prefecture) return []
    const municipalities = facilities
      .filter((f) => f.prefecture === filters.prefecture)
      .map((f) => f.municipality)
    return [...new Set(municipalities)].sort()
  }, [facilities, filters.prefecture])

  const activeCount = countActiveFilters(filters)

  function handleApply() {
    onFilter({
      prefecture: filters.prefecture || undefined,
      municipality: filters.municipality || undefined,
      leadStatus: filters.leadStatus || undefined,
      search: filters.search.trim() || undefined,
    })
  }

  function handleReset() {
    const reset: FilterState = { prefecture: '', municipality: '', leadStatus: '', search: '' }
    setFilters(reset)
    onFilter({})
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleApply()
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex flex-wrap gap-3 items-end">
        {/* Prefecture */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">都道府県</label>
          <select
            className="h-9 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.prefecture}
            onChange={(e) => setFilters((f) => ({ ...f, prefecture: e.target.value, municipality: '' }))}
          >
            <option value="">すべて</option>
            {PREFECTURES.map((pref) => (
              <option key={pref} value={pref}>
                {pref}
              </option>
            ))}
          </select>
        </div>

        {/* Municipality */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">市区町村</label>
          <select
            className="h-9 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
            value={filters.municipality}
            onChange={(e) => setFilters((f) => ({ ...f, municipality: e.target.value }))}
            disabled={!filters.prefecture}
          >
            <option value="">すべて</option>
            {municipalityOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Lead Status */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">ステータス</label>
          <select
            className="h-9 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.leadStatus}
            onChange={(e) => setFilters((f) => ({ ...f, leadStatus: e.target.value }))}
          >
            <option value="">すべて</option>
            {PRE_APO_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Free text search */}
        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-gray-600">施設名・電話番号</label>
          <input
            type="text"
            placeholder="施設名または電話番号で検索..."
            className="h-9 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* Buttons */}
        <div className="flex items-end gap-2">
          <button
            onClick={handleApply}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            絞り込み
            {activeCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white text-blue-600 text-xs font-bold">
                {activeCount}
              </span>
            )}
          </button>
          <button
            onClick={handleReset}
            className="inline-flex items-center h-9 px-4 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            リセット
          </button>
        </div>
      </div>
    </div>
  )
}
