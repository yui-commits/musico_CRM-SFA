'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Facility, DealStatus } from '@/types'
import { cn } from '@/lib/utils'
import { FacilityCard } from './FacilityCard'

interface KanbanColumnProps {
  status: DealStatus
  label: string
  emoji: string
  facilities: Facility[]
  onCardClick: (facility: Facility) => void
}

export function KanbanColumn({
  status,
  label,
  emoji,
  facilities,
  onCardClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="flex flex-col flex-shrink-0 w-[280px]">
      {/* Column header — fixed height so all drop zones align */}
      <div className="flex items-center gap-1.5 mb-2 px-1 min-h-[40px]">
        <span className="text-base">{emoji}</span>
        <span className="text-xs font-semibold text-gray-700 leading-snug flex-1 min-w-0">
          {label}
        </span>
        <span className="flex-shrink-0 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-xs font-bold bg-gray-200 text-gray-700">
          {facilities.length}
        </span>
      </div>

      {/* Card list (droppable) */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-col gap-2 rounded-lg p-2 min-h-[200px] flex-1 overflow-y-auto',
          'bg-gray-50 border border-gray-200',
          isOver && 'bg-blue-50 border-blue-300',
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

        {facilities.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-gray-400 select-none">ここにドロップ</p>
          </div>
        )}
      </div>
    </div>
  )
}
