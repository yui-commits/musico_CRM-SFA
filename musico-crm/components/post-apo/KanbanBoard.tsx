'use client'

import { useState, useCallback } from 'react'
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
import { KANBAN_LANES } from '@/lib/constants'

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
  // Support both { data: Facility[] } and Facility[]
  return Array.isArray(json) ? json : (json.data ?? [])
}

export function KanbanBoard({ initialFacilities }: KanbanBoardProps) {
  const queryClient = useQueryClient()

  // Require 8px movement before drag starts — allows normal clicks to fire
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  // ── Server data ──────────────────────────────────────────
  const { data: serverFacilities } = useQuery<Facility[]>({
    queryKey: ['facilities', 'post-apo'],
    queryFn: fetchPostApoFacilities,
    initialData: initialFacilities,
    staleTime: 30_000,
  })

  // Local optimistic copy that we mutate on drag
  const [optimisticFacilities, setOptimisticFacilities] = useState<Facility[] | null>(null)
  const facilities = optimisticFacilities ?? serverFacilities ?? []

  // ── Drag state ───────────────────────────────────────────
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const activeFacility = activeDragId
    ? facilities.find((f) => f.id === activeDragId) ?? null
    : null

  // ── Detail panel ─────────────────────────────────────────
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null)

  // ── Handlers ─────────────────────────────────────────────
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

      // Validate target is a known lane status
      const isLane = KANBAN_LANES.some((l) => l.status === targetStatus)
      if (!isLane) return

      const dragged = facilities.find((f) => f.id === draggedId)
      if (!dragged || dragged.deal_status === targetStatus) return

      // Snapshot for potential rollback
      const snapshot = optimisticFacilities ?? serverFacilities ?? []

      // Optimistic update
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

        // Sync with server cache
        queryClient.setQueryData<Facility[]>(['facilities', 'post-apo'], updated)
        setOptimisticFacilities(null)
      } catch (err) {
        // Rollback
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
      // queryClient を正として optimistic 状態はリセット（空配列が ?? をブロックするのを防ぐ）
      queryClient.setQueryData<Facility[]>(['facilities', 'post-apo'], next)
      setOptimisticFacilities(null)
      setSelectedFacility(isReverted ? null : updated)
    },
    [optimisticFacilities, serverFacilities, queryClient],
  )

  // ── Group facilities into lanes ───────────────────────────
  // 統合レーンのマッピング（旧ステータス → 新レーン）
  const MERGED_LANE: Partial<Record<DealStatus, DealStatus>> = {
    '【Ph1】面談実施済・合意': '【Ph2】体験会・講師調整中',
    '【Ph3】チラシ送付完了': '【Ph4】告知・募集期間中',
  }
  const firstLaneStatus = KANBAN_LANES[0].status
  const laneMap = new Map<DealStatus, Facility[]>()
  for (const lane of KANBAN_LANES) {
    laneMap.set(lane.status, [])
  }
  for (const facility of facilities) {
    const raw = facility.deal_status
    const status = raw
      ? (MERGED_LANE[raw] ?? (laneMap.has(raw) ? raw : firstLaneStatus))
      : firstLaneStatus
    laneMap.get(status)!.push(facility)
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Horizontal scroll container */}
        <div className="flex gap-3 overflow-x-auto pb-4 min-h-[calc(100vh-160px)] items-start">
          {KANBAN_LANES.map((lane) => (
            <KanbanColumn
              key={lane.status}
              status={lane.status}
              label={lane.label}
              emoji={lane.emoji}
              facilities={laneMap.get(lane.status) ?? []}
              onCardClick={handleCardClick}
            />
          ))}
        </div>

        {/* Ghost card shown while dragging */}
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

      {/* Detail slide-in panel */}
      <FacilityDetailPanel
        facility={selectedFacility}
        onClose={handlePanelClose}
        onUpdate={handleFacilityUpdate}
      />
    </>
  )
}
