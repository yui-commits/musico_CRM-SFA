'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Facility } from '@/types'
import { OUTREACH_BADGE_COLORS } from '@/lib/constants'
import { cn, formatDate, formatDateTime, isDueOrOverdue } from '@/lib/utils'

interface FacilityCardProps {
  facility: Facility
  onClick: (facility: Facility) => void
  /** When true, render a static ghost version without drag listeners (used in DragOverlay) */
  isOverlay?: boolean
}

export function FacilityCard({ facility, onClick, isOverlay = false }: FacilityCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: facility.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Determine if any deadline is overdue to show alert styling
  const deadlineOverdue =
    isDueOrOverdue(facility.application_deadline) ||
    isDueOrOverdue(facility.trial_date)

  const displayDate = facility.trial_date ?? facility.appointment_date

  // 10-day trial alert: show when in the merged Ph3-4 lane and trial is within 10 days
  const IN_MERGED_LANE =
    facility.deal_status === '【Ph4】告知・募集期間中' ||
    facility.deal_status === '【Ph3】チラシ送付完了'
  const daysUntilTrial = (() => {
    if (!facility.trial_date || !IN_MERGED_LANE) return null
    const diff = Math.floor(
      (new Date(facility.trial_date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) /
        (1000 * 60 * 60 * 24),
    )
    return diff
  })()
  const showTrialAlert = daysUntilTrial !== null && daysUntilTrial <= 10

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={isOverlay ? undefined : style}
      {...(!isOverlay ? attributes : {})}
      {...(!isOverlay ? listeners : {})}
      onClick={() => onClick(facility)}
      className={cn(
        'bg-white rounded-lg border p-3 shadow-sm select-none',
        'cursor-grab active:cursor-grabbing',
        'hover:shadow-md transition-shadow duration-150',
        isDragging && !isOverlay && 'opacity-30',
        isOverlay && 'rotate-1 shadow-xl opacity-95 cursor-grabbing',
        deadlineOverdue
          ? 'border-red-400 bg-red-50'
          : showTrialAlert
          ? 'border-orange-400 bg-orange-50'
          : 'border-gray-200',
      )}
    >
      {/* 10-day trial alert banner */}
      {showTrialAlert && (
        <div className={cn(
          'mb-2 px-2 py-1 rounded text-xs font-bold flex items-center gap-1',
          daysUntilTrial! <= 0
            ? 'bg-red-200 text-red-800'
            : daysUntilTrial! <= 3
            ? 'bg-orange-200 text-orange-900'
            : 'bg-yellow-100 text-yellow-800',
        )}>
          🔔 体験会まであと
          {daysUntilTrial! <= 0 ? '当日・超過！' : `${daysUntilTrial}日 → Ph5に移してください`}
        </div>
      )}

      {/* Facility name */}
      <p className="font-bold text-sm text-gray-900 leading-snug mb-1 line-clamp-2">
        {facility.name}
      </p>

      {/* Municipality */}
      <p className="text-xs text-gray-500 mb-2">{facility.municipality}</p>

      {/* Outreach type badge */}
      {facility.outreach_type && (
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border mb-2',
            OUTREACH_BADGE_COLORS[facility.outreach_type] ?? 'bg-gray-100 text-gray-800 border-gray-300',
          )}
        >
          {facility.outreach_type}
        </span>
      )}

      {/* Instructor info */}
      {facility.assigned_instructor ? (
        <p className="text-xs text-gray-700 mb-1 flex items-center gap-1">
          <span>🎻</span>
          <span className="font-medium">{facility.assigned_instructor}</span>
          {facility.instructor_dispatched && (
            <span className="ml-1 px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700 border border-green-300">
              派遣済
            </span>
          )}
        </p>
      ) : facility.required_instructors ? (
        <p className="text-xs text-orange-600 mb-1">
          🎻 講師未アサイン（{facility.required_instructors}名必要）
        </p>
      ) : null}

      {/* Trial date or appointment date */}
      {displayDate && (
        <p
          className={cn(
            'text-xs mt-1',
            isDueOrOverdue(displayDate) ? 'text-red-600 font-semibold' : 'text-gray-500',
          )}
        >
          {facility.trial_date ? '体験会: ' : '面談: '}
          {facility.trial_date
            ? formatDateTime(facility.trial_date)
            : formatDate(facility.appointment_date)}
        </p>
      )}

      {/* Application deadline warning */}
      {facility.application_deadline && isDueOrOverdue(facility.application_deadline) && (
        <p className="text-xs text-red-600 font-semibold mt-0.5">
          ⚠ 締切: {formatDate(facility.application_deadline)}
        </p>
      )}
    </div>
  )
}
