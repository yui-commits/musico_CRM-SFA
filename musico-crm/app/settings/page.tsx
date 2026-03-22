'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

interface NgReason {
  id: string
  name: string
  sort_order: number
}

export default function SettingsPage() {
  const [reasons, setReasons] = useState<NgReason[]>([])
  const [newName, setNewName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)

  const fetchReasons = useCallback(async () => {
    try {
      const res = await fetch('/api/ng-reasons')
      if (!res.ok) throw new Error()
      const json = await res.json()
      setReasons(json.data ?? [])
    } catch {
      toast.error('NG理由の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReasons()
  }, [fetchReasons])

  async function handleAdd() {
    if (!newName.trim()) return
    setIsAdding(true)
    try {
      const res = await fetch('/api/ng-reasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? '追加に失敗しました')
      }
      toast.success(`「${newName.trim()}」を追加しました`)
      setNewName('')
      fetchReasons()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '追加に失敗しました')
    } finally {
      setIsAdding(false)
    }
  }

  async function handleDelete(reason: NgReason) {
    if (!confirm(`「${reason.name}」を削除しますか？\n既存の活動記録に保存されたNG理由は影響を受けません。`)) return
    try {
      const res = await fetch('/api/ng-reasons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reason.id }),
      })
      if (!res.ok) throw new Error()
      toast.success(`「${reason.name}」を削除しました`)
      fetchReasons()
    } catch {
      toast.error('削除に失敗しました')
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">設定</h1>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">NG理由の管理</h2>
        <p className="text-sm text-gray-500 mb-4">
          架電時に選択できるNG理由の追加・削除ができます。削除しても、既存の活動記録には影響しません。
        </p>

        {/* 追加フォーム */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="新しいNG理由を入力..."
            className="flex-1 h-9 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
          />
          <button
            onClick={handleAdd}
            disabled={isAdding || !newName.trim()}
            className="h-9 px-4 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAdding ? '追加中...' : '追加'}
          </button>
        </div>

        {/* 一覧 */}
        {isLoading ? (
          <p className="text-sm text-gray-400">読み込み中...</p>
        ) : reasons.length === 0 ? (
          <p className="text-sm text-gray-400">NG理由が登録されていません</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {reasons.map((reason) => (
              <li key={reason.id} className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-800">{reason.name}</span>
                <button
                  onClick={() => handleDelete(reason)}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
