'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface AIScriptPanelProps {
  facilityId: string
  initialScript: string | null
}

export default function AIScriptPanel({ facilityId, initialScript }: AIScriptPanelProps) {
  const [script, setScript] = useState<string | null>(initialScript)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  async function handleRegenerate() {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/ai-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facility_id: facilityId }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'AIトーク生成に失敗しました')
      }
      const data = await res.json()
      setScript(data.data ?? null)
      toast.success('AIトークを再生成しました')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'AIトーク生成に失敗しました')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/facilities/${facilityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_sales_script: script }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? '保存に失敗しました')
      }
      toast.success('AIトークを保存しました')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleCopy() {
    if (!script) return
    try {
      await navigator.clipboard.writeText(script)
      toast.success('クリップボードにコピーしました')
    } catch {
      toast.error('コピーに失敗しました')
    }
  }

  const isLoading = isGenerating || isSaving

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">AIトーク</h3>
        <div className="flex gap-2">
          {script && (
            <button
              onClick={handleCopy}
              disabled={isLoading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              📋 コピー
            </button>
          )}
          <button
            onClick={handleRegenerate}
            disabled={isLoading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {isGenerating ? (
              <>
                <Spinner />
                生成中...
              </>
            ) : (
              '✨ AIトークを再生成'
            )}
          </button>
          {script && (
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? (
                <>
                  <Spinner />
                  保存中...
                </>
              ) : (
                '保存'
              )}
            </button>
          )}
        </div>
      </div>

      {script === null ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-500">AIトークが未生成です</p>
          <p className="text-xs text-gray-400">「AIトークを再生成」ボタンで生成できます</p>
        </div>
      ) : (
        <textarea
          className="flex-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="AIトークがここに表示されます"
        />
      )}
    </div>
  )
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-3 w-3"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
