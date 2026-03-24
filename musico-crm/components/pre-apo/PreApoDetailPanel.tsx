'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { FacilityWithActivities } from '@/types'
import { cn } from '@/lib/utils'
import FacilityDetail from './FacilityDetail'
import AIScriptPanel from './AIScriptPanel'
import CallForm from './CallForm'

interface PreApoDetailPanelProps {
  facilityId: string | null
  onClose: () => void
  onSaved: (wasApo: boolean) => void
  /** ID of the next facility in the filtered list */
  nextFacilityId?: string | null
  onNavigate?: (id: string) => void
}

type Tab = 'info' | 'script' | 'call'

const TABS: { key: Tab; label: string }[] = [
  { key: 'info', label: '施設情報' },
  { key: 'script', label: 'AIトーク' },
  { key: 'call', label: '架電記録' },
]

export default function PreApoDetailPanel({
  facilityId,
  onClose,
  onSaved,
  nextFacilityId,
  onNavigate,
}: PreApoDetailPanelProps) {
  const [facility, setFacility] = useState<FacilityWithActivities | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('info')

  const isVisible = facilityId !== null

  const loadFacility = useCallback(async (id: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/facilities/${id}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setFacility(json.data)
    } catch {
      toast.error('施設の取得に失敗しました')
      setFacility(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (facilityId) {
      loadFacility(facilityId)
      setActiveTab('info')
    } else {
      setFacility(null)
    }
  }, [facilityId, loadFacility])

  function handleCallSaved(wasApo: boolean) {
    onSaved(wasApo)
  }

  function handleCallSavedAndNext(wasApo: boolean) {
    if (wasApo) {
      onSaved(wasApo)
      return
    }
    if (nextFacilityId && onNavigate) {
      onNavigate(nextFacilityId)
    } else {
      onSaved(wasApo)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/30 z-40 transition-opacity duration-200',
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-full max-w-[720px] bg-gray-50 shadow-2xl z-50',
          'flex flex-col transition-transform duration-300 ease-in-out',
          isVisible ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-4 border-b border-gray-200 bg-white">
          <div className="flex-1 min-w-0">
            {facility && (
              <>
                <h2 className="text-lg font-bold text-gray-900 leading-snug truncate">
                  {facility.name}
                </h2>
                {facility.operating_company && (
                  <p className="text-xs text-gray-400 mt-0.5">{facility.operating_company}</p>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <a
                    href={`tel:${facility.phone_number}`}
                    className="text-sm text-blue-600 hover:underline font-mono"
                  >
                    {facility.phone_number.replace(/(\d{2,4})(\d{4})(\d{4})/, '$1-$2-$3')}
                  </a>
                  <span className="text-xs text-gray-400">
                    {facility.prefecture}{facility.municipality}
                  </span>
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="閉じる"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-white px-5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-gray-400">読み込み中...</p>
            </div>
          )}

          {!isLoading && facility && (
            <>
              {/* 施設情報タブ */}
              <div className={cn('p-5', activeTab !== 'info' && 'hidden')}>
                <FacilityDetail facility={facility} />
              </div>

              {/* AIトークタブ */}
              <div className={cn('p-5 h-[calc(100vh-180px)]', activeTab !== 'script' && 'hidden')}>
                <AIScriptPanel facilityId={facility.id} initialScript={facility.ai_sales_script} />
              </div>

              {/* 架電記録タブ */}
              <div className={cn('p-5', activeTab !== 'call' && 'hidden')}>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">架電記録を入力</h3>
                <CallForm
                  facilityId={facility.id}
                  onSaved={(wasApo) => handleCallSaved(wasApo)}
                  onSavedNext={(wasApo) => handleCallSavedAndNext(wasApo)}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
