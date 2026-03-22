'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Facility } from '@/types'
import { OUTREACH_BADGE_COLORS } from '@/lib/constants'
import { cn, formatDate, formatDateTime, isDueOrOverdue } from '@/lib/utils'

interface FacilityCardProps {
  facility: Facility
  onClick: (facility: Facility) => void
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

  const deadlineOverdue =
    isDueOrOverdue(facility.application_deadline) ||
    isDueOrOverdue(facility.trial_date)

  const displayDate = facility.trial_date ?? facility.appointment_date

  // 10-day trial alert
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
        'bg-white rounded-lg border p-3 select-none',
        'cursor-grab active:cursor-grabbing',
        'hover:shadow-md transition-all duration-150',
        isDragging && !isOverlay && 'opacity-30',
        isOverlay && 'rotate-1 shadow-xl opacity-95 cursor-grabbing',
        deadlineOverdue
          ? 'border-red-300 ring-1 ring-red-200 bg-red-50/60'
          : showTrialAlert
          ? 'border-orange-300 ring-1 ring-orange-200 bg-orange-50/60'
          : 'border-gray-200 shadow-sm',
      )}
    >
      {/* Alert banner */}
      {showTrialAlert && (
        <div className={cn(
          'mb-2 px-2 py-1 rounded text-xs font-bold flex items-center gap-1',
          daysUntilTrial! <= 0
            ? 'bg-red-200 text-red-800'
            : daysUntilTrial! <= 3
            ? 'bg-orange-200 text-orange-900'
            : 'bg-yellow-100 text-yellow-800',
        )}>
          体験会まで
          {daysUntilTrial! <= 0 ? '当日・超過' : `あと${daysUntilTrial}日`}
        </div>
      )}

      {/* Facility name — primary info */}
      <p className="font-semibold text-sm text-gray-900 leading-snug line-clamp-2">
        {facility.name}
      </p>

      {/* Location */}
      <p className="text-xs text-gray-400 mt-0.5 mb-2">{facility.prefecture}{facility.municipality}</p>

      {/* Metadata row — badges & chips */}
      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
        {/* Outreach type */}
        {facility.outreach_type && (
          <span
            className={cn(
              'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border',
              OUTREACH_BADGE_COLORS[facility.outreach_type] ?? 'bg-gray-100 text-gray-700 border-gray-200',
            )}
          >
            {facility.outreach_type}
          </span>
        )}

        {/* Instructor chip */}
        {facility.assigned_instructor ? (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
            {facility.assigned_instructor}
            {facility.instructor_dispatched && (
              <span className="text-green-600 font-bold">&#10003;</span>
            )}
          </span>
        ) : facility.required_instructors ? (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-50 text-orange-600 border border-orange-200">
            講師未定
          </span>
        ) : null}
      </div>

      {/* Date row — secondary info */}
      {displayDate && (
        <div className={cn(
          'flex items-center gap-1 text-xs mt-1 pt-1.5 border-t border-gray-100',
          isDueOrOverdue(displayDate) ? 'text-red-600 font-semibold' : 'text-gray-500',
        )}>
          <span className="text-gray-400">{facility.trial_date ? '体験会' : '面談'}</span>
          <span>
            {facility.trial_date
              ? formatDateTime(facility.trial_date)
              : formatDate(facility.appointment_date)}
          </span>
        </div>
      )}

      {/* Deadline warning */}
      {facility.application_deadline && isDueOrOverdue(facility.application_deadline) && (
        <p className="text-xs text-red-600 font-semibold mt-1">
          締切: {formatDate(facility.application_deadline)}
        </p>
      )}
    </div>
  )
}
