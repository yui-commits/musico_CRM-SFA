'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Facility, DealStatus } from '@/types'
import type { PHASE_GROUPS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { FacilityCard } from './FacilityCard'

interface KanbanColumnProps {
  status: DealStatus
  label: string
  emoji: string
  facilities: Facility[]
  onCardClick: (facility: Facility) => void
  phaseGroup: typeof PHASE_GROUPS[number]
}

export function KanbanColumn({
  status,
  label,
  emoji,
  facilities,
  onCardClick,
  phaseGroup,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const isEmpty = facilities.length === 0
  const [collapsed, setCollapsed] = useState(false)

  // Empty lanes can be collapsed to save space
  if (isEmpty && collapsed) {
    return (
      <div
        className="flex flex-col flex-shrink-0 w-[48px] items-center cursor-pointer group"
        onClick={() => setCollapsed(false)}
      >
        <div
          ref={setNodeRef}
          className={cn(
            'w-full rounded-lg border-2 border-dashed p-2 min-h-[200px] flex flex-col items-center justify-center gap-2 transition-colors',
            isOver
              ? `${phaseGroup.dropOverBorder} ${phaseGroup.dropOverBg}`
              : 'border-gray-200 bg-gray-50/50 group-hover:border-gray-300',
          )}
        >
          <span className="text-sm">{emoji}</span>
          <span className="text-xs text-gray-400 [writing-mode:vertical-rl]">{label}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-shrink-0 w-[260px]">
      {/* Column header */}
      <div
        className="flex items-center gap-1.5 mb-2 px-2 py-1 min-h-[32px] cursor-pointer"
        onClick={() => isEmpty && setCollapsed(true)}
      >
        <span className="text-sm">{emoji}</span>
        <span className={cn('text-xs font-semibold leading-snug flex-1 min-w-0', phaseGroup.headerText)}>
          {label}
        </span>
        <span className={cn(
          'flex-shrink-0 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-xs font-bold',
          facilities.length > 0 ? phaseGroup.countBg : 'bg-gray-100 text-gray-400',
        )}>
          {facilities.length}
        </span>
      </div>

      {/* Card list (droppable) */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-col gap-2 rounded-lg p-2 min-h-[200px] flex-1 overflow-y-auto',
          isOver
            ? `${phaseGroup.dropOverBg} ${phaseGroup.dropOverBorder} border`
            : `${phaseGroup.dropBg} ${phaseGroup.dropBorder} border`,
          'transition-colors duration-100',
        )}
      >
        <SortableContext
          items={facilities.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          {facilities.map((facility) => (
            <FacilityCard
              key={facility.id}
              facility={facility}
              onClick={onCardClick}
            />
          ))}
        </SortableContext>

        {isEmpty && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-gray-400 select-none">ここにドロップ</p>
          </div>
        )}
      </div>
    </div>
  )
}
