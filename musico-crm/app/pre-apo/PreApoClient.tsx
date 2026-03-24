'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Facility } from '@/types'
import { isDueOrOverdue } from '@/lib/utils'
import TodayTasks from '@/components/pre-apo/TodayTasks'
import FacilityFilters from '@/components/pre-apo/FacilityFilters'
import FacilityList from '@/components/pre-apo/FacilityList'
import PreApoDetailPanel from '@/components/pre-apo/PreApoDetailPanel'

interface Filters {
  prefecture?: string
  municipality?: string
  leadStatus?: string
  search?: string
}

type FacilityWithMeta = Facility & {
  next_action_date?: string | null
  next_action?: string | null
}

interface ActivityMeta {
  next_action: string | null
  next_action_date: string | null
  called_at: string
}

async function fetchFacilities(): Promise<FacilityWithMeta[]> {
  const res = await fetch('/api/facilities?lead_status=pre-apo&page_size=200')
  if (!res.ok) throw new Error('施設の取得に失敗しました')
  const json = await res.json()
  const raw = json.data ?? []
  return raw.map((f: FacilityWithMeta & { activities?: ActivityMeta[] }) => {
    const latest = f.activities
      ?.sort((a, b) => b.called_at.localeCompare(a.called_at))
      ?.[0]
    return {
      ...f,
      next_action: latest?.next_action ?? null,
      next_action_date: latest?.next_action_date ?? null,
      activities: undefined,
    }
  })
}

function applyFilters(facilities: FacilityWithMeta[], filters: Filters): FacilityWithMeta[] {
  return facilities.filter((f) => {
    if (filters.prefecture && f.prefecture !== filters.prefecture) return false
    if (filters.municipality && f.municipality !== filters.municipality) return false
    if (filters.leadStatus && f.lead_status !== filters.leadStatus) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      const matchName = f.name.toLowerCase().includes(q)
      const matchPhone = f.phone_number.includes(q.replace(/[-\s]/g, ''))
      const matchCompany = f.operating_company?.toLowerCase().includes(q) ?? false
      if (!matchName && !matchPhone && !matchCompany) return false
    }
    return true
  })
}

export default function PreApoClient() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<Filters>({})
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null)

  const { data: facilities = [], isLoading, isError } = useQuery<FacilityWithMeta[]>({
    queryKey: ['facilities', 'pre-apo'],
    queryFn: fetchFacilities,
    staleTime: 30_000,
  })

  const filteredFacilities = useMemo(
    () => applyFilters(facilities, filters),
    [facilities, filters]
  )

  const todayFacilities = useMemo(
    () => facilities.filter((f) => isDueOrOverdue(f.next_action_date ?? null)),
    [facilities]
  )

  // Compute next facility ID in the filtered list
  const nextFacilityId = useMemo(() => {
    if (!selectedFacilityId) return null
    const idx = filteredFacilities.findIndex((f) => f.id === selectedFacilityId)
    if (idx < 0 || idx >= filteredFacilities.length - 1) return null
    return filteredFacilities[idx + 1].id
  }, [selectedFacilityId, filteredFacilities])

  const handleSelect = useCallback((id: string) => {
    setSelectedFacilityId(id)
  }, [])

  const handlePanelClose = useCallback(() => {
    setSelectedFacilityId(null)
  }, [])

  const handleSaved = useCallback((wasApo: boolean) => {
    setSelectedFacilityId(null)
    queryClient.invalidateQueries({ queryKey: ['facilities', 'pre-apo'] })
    if (wasApo) {
      toast.success('アポ獲得！商談管理へ移動します')
      router.push('/post-apo')
    }
  }, [queryClient, router])

  const handleNavigate = useCallback((id: string) => {
    queryClient.invalidateQueries({ queryKey: ['facilities', 'pre-apo'] })
    setSelectedFacilityId(id)
  }, [queryClient])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm">施設データを読み込んでいます...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600">
          <p className="font-medium">データの取得に失敗しました</p>
          <p className="text-sm mt-1">ページを再読み込みしてください</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <TodayTasks facilities={todayFacilities} onSelect={handleSelect} />
      <FacilityFilters onFilter={setFilters} facilities={facilities} />
      <FacilityList facilities={filteredFacilities} onSelect={handleSelect} />

      <PreApoDetailPanel
        facilityId={selectedFacilityId}
        onClose={handlePanelClose}
        onSaved={handleSaved}
        nextFacilityId={nextFacilityId}
        onNavigate={handleNavigate}
      />
    </div>
  )
}
