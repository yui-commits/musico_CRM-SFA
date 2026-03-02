'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { FacilityWithActivities } from '@/types'
import FacilityDetail from '@/components/pre-apo/FacilityDetail'
import AIScriptPanel from '@/components/pre-apo/AIScriptPanel'
import CallForm from '@/components/pre-apo/CallForm'

export default function PreApoDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [facility, setFacility] = useState<FacilityWithActivities | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadFacility() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/facilities/${id}`)
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error ?? '施設の取得に失敗しました')
        }
        const json = await res.json()
        setFacility(json.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '施設の取得に失敗しました')
      } finally {
        setIsLoading(false)
      }
    }

    loadFacility()
  }, [id])

  function handleSaved(wasApo: boolean, nextFacilityId?: string) {
    if (wasApo) {
      toast.success('アポ獲得! Post-APOカンバンへ移動します')
      router.push('/post-apo')
      return
    }
    if (nextFacilityId) {
      router.push(`/pre-apo/${nextFacilityId}`)
      return
    }
    router.push('/pre-apo')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <svg
            className="animate-spin h-8 w-8 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm">施設データを読み込んでいます...</p>
        </div>
      </div>
    )
  }

  if (error || !facility) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-600 font-medium">{error ?? '施設が見つかりませんでした'}</p>
        <button
          onClick={() => router.push('/pre-apo')}
          className="inline-flex items-center gap-1 px-4 py-2 rounded-md bg-gray-800 text-white text-sm hover:bg-gray-900 transition-colors"
        >
          ← 一覧へ戻る
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0">
        <button
          onClick={() => router.push('/pre-apo')}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          ← 一覧へ戻る
        </button>
        <span className="text-gray-400">/</span>
        <h1 className="text-base font-semibold text-gray-900 truncate">{facility.name}</h1>
      </div>

      {/* 2-pane layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left pane: Facility detail (40%) */}
        <div className="w-[40%] border-r border-gray-200 overflow-y-auto p-4 bg-white">
          <FacilityDetail facility={facility} />
        </div>

        {/* Right pane (60%) */}
        <div className="w-[60%] flex flex-col overflow-hidden bg-gray-50">
          {/* Top 40%: AI Script Panel */}
          <div className="h-[40%] border-b border-gray-200 p-4 overflow-hidden flex flex-col bg-white">
            <AIScriptPanel
              facilityId={facility.id}
              initialScript={facility.ai_sales_script}
            />
          </div>

          {/* Bottom 60%: Call Form */}
          <div className="h-[60%] overflow-y-auto p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">架電記録を入力</h3>
            <CallForm facilityId={facility.id} onSaved={handleSaved} />
          </div>
        </div>
      </div>
    </div>
  )
}
