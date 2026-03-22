'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  rectIntersection,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { Facility, DealStatus } from '@/types'
import { KANBAN_LANES, PHASE_GROUPS } from '@/lib/constants'

import { KanbanColumn } from './KanbanColumn'
import { FacilityCard } from './FacilityCard'
import { FacilityDetailPanel } from './FacilityDetailPanel'

interface KanbanBoardProps {
  initialFacilities: Facility[]
}

async function fetchPostApoFacilities(): Promise<Facility[]> {
  const res = await fetch('/api/facilities?post_apo=true&page_size=200')
  if (!res.ok) throw new Error('施設データの取得に失敗しました')
  const json = await res.json()
  return Array.isArray(json) ? json : (json.data ?? [])
}

// 統合レーンのマッピング（旧ステータス → 新レーン）
const MERGED_LANE: Partial<Record<DealStatus, DealStatus>> = {
  '【Ph1】面談実施済・合意': '【Ph2】体験会・講師調整中',
  '【Ph3】チラシ送付完了': '【Ph4】告知・募集期間中',
}

// status → phaseGroup のルックアップ
const STATUS_TO_GROUP = new Map<string, typeof PHASE_GROUPS[number]>()
for (const group of PHASE_GROUPS) {
  for (const status of group.statuses) {
    STATUS_TO_GROUP.set(status, group)
  }
}

export function KanbanBoard({ initialFacilities }: KanbanBoardProps) {
  const queryClient = useQueryClient()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const { data: serverFacilities } = useQuery<Facility[]>({
    queryKey: ['facilities', 'post-apo'],
    queryFn: fetchPostApoFacilities,
    initialData: initialFacilities,
    staleTime: 30_000,
  })

  const [optimisticFacilities, setOptimisticFacilities] = useState<Facility[] | null>(null)
  const facilities = optimisticFacilities ?? serverFacilities ?? []

  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const activeFacility = activeDragId
    ? facilities.find((f) => f.id === activeDragId) ?? null
    : null

  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null)

  // ── Group facilities into lanes ──
  const laneMap = useMemo(() => {
    const firstLaneStatus = KANBAN_LANES[0].status
    const map = new Map<DealStatus, Facility[]>()
    for (const lane of KANBAN_LANES) map.set(lane.status, [])
    for (const facility of facilities) {
      const raw = facility.deal_status
      const status = raw
        ? (MERGED_LANE[raw] ?? (map.has(raw) ? raw : firstLaneStatus))
        : firstLaneStatus
      map.get(status)!.push(facility)
    }
    return map
  }, [facilities])

  // ── Summary counts per phase group ──
  const groupCounts = useMemo(() => {
    return PHASE_GROUPS.map((group) => {
      const count = group.statuses.reduce(
        (sum, status) => sum + (laneMap.get(status)?.length ?? 0),
        0,
      )
      return { ...group, count }
    })
  }, [laneMap])

  const totalCount = facilities.length

  // ── Handlers ──
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id))
  }, [])

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveDragId(null)
      const { active, over } = event
      if (!over) return

      const draggedId = String(active.id)
      const targetStatus = String(over.id) as DealStatus

      const isLane = KANBAN_LANES.some((l) => l.status === targetStatus)
      if (!isLane) return

      const dragged = facilities.find((f) => f.id === draggedId)
      if (!dragged || dragged.deal_status === targetStatus) return

      const snapshot = optimisticFacilities ?? serverFacilities ?? []
      const updated = snapshot.map((f) =>
        f.id === draggedId ? { ...f, deal_status: targetStatus } : f,
      )
      setOptimisticFacilities(updated)

      try {
        const res = await fetch(`/api/facilities/${draggedId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deal_status: targetStatus }),
        })
        if (!res.ok) throw new Error('移動の保存に失敗しました')
        queryClient.setQueryData<Facility[]>(['facilities', 'post-apo'], updated)
        setOptimisticFacilities(null)
      } catch (err) {
        setOptimisticFacilities(snapshot)
        toast.error(err instanceof Error ? err.message : '移動の保存に失敗しました')
      }
    },
    [facilities, optimisticFacilities, serverFacilities, queryClient],
  )

  const handleCardClick = useCallback((facility: Facility) => {
    setSelectedFacility(facility)
  }, [])

  const handlePanelClose = useCallback(() => {
    setSelectedFacility(null)
  }, [])

  const handleFacilityUpdate = useCallback(
    (updated: Facility) => {
      const base = optimisticFacilities ?? serverFacilities ?? []
      const isReverted = updated.lead_status !== 'アポ獲得'
      const next = isReverted
        ? base.filter((f) => f.id !== updated.id)
        : base.map((f) => (f.id === updated.id ? updated : f))
      queryClient.setQueryData<Facility[]>(['facilities', 'post-apo'], next)
      setOptimisticFacilities(null)
      setSelectedFacility(isReverted ? null : updated)
    },
    [optimisticFacilities, serverFacilities, queryClient],
  )

  return (
    <>
      {/* Pipeline summary bar */}
      <div className="mb-4 bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-700">パイプライン</h2>
          <span className="text-xs text-gray-500">{totalCount}件</span>
        </div>
        {/* Segmented progress bar */}
        {totalCount > 0 && (
          <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100 mb-3">
            {groupCounts.map((g) =>
              g.count > 0 ? (
                <div
                  key={g.label}
                  className={`${g.barColor} transition-all duration-300`}
                  style={{ width: `${(g.count / totalCount) * 100}%` }}
                />
              ) : null,
            )}
          </div>
        )}
        {/* Phase chips */}
        <div className="flex flex-wrap gap-2">
          {groupCounts.map((g) => (
            <div
              key={g.label}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${g.headerBg} ${g.headerText} ${g.headerBorder} border`}
            >
              <span>{g.label}</span>
              <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-xs font-bold ${g.countBg}`}>
                {g.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Kanban with phase groups */}
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-220px)] items-start">
          {PHASE_GROUPS.map((group) => (
            <div key={group.label} className="flex flex-col flex-shrink-0">
              {/* Phase group header */}
              <div className={`flex items-center gap-2 px-2 py-1.5 mb-2 rounded-md ${group.headerBg} ${group.headerBorder} border`}>
                <span className={`text-xs font-bold ${group.headerText}`}>{group.label}</span>
                <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-xs font-bold ${group.countBg}`}>
                  {group.statuses.reduce((sum, s) => sum + (laneMap.get(s)?.length ?? 0), 0)}
                </span>
              </div>
              {/* Lanes within this group */}
              <div className="flex gap-2">
                {group.statuses.map((status) => {
                  const lane = KANBAN_LANES.find((l) => l.status === status)!
                  return (
                    <KanbanColumn
                      key={status}
                      status={status}
                      label={lane.label}
                      facilities={laneMap.get(status) ?? []}
                      onCardClick={handleCardClick}
                      phaseGroup={group}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeFacility ? (
            <FacilityCard
              facility={activeFacility}
              onClick={() => {}}
              isOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <FacilityDetailPanel
        facility={selectedFacility}
        onClose={handlePanelClose}
        onUpdate={handleFacilityUpdate}
      />
    </>
  )
}
