'use client'

import { useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import Papa from 'papaparse'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FileText, AlertCircle, CheckCircle2, Download } from 'lucide-react'

interface ImportResult {
  success_count: number
  error_count: number
  errors: Array<{
    row: number
    phone_number: string
    reason: string
  }>
}

interface UploadSectionProps {
  endpoint: string
  showDuplicateOption?: boolean
  sampleColumns: Array<{ name: string; description: string; required: boolean }>
  sampleRows?: string[][]
}

function UploadSection({ endpoint, showDuplicateOption = false, sampleColumns, sampleRows }: UploadSectionProps) {
  const [file, setFile] = useState<File | null>(null)
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'overwrite'>('skip')
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.name.endsWith('.csv')) {
      setFile(dropped)
      setResult(null)
    } else {
      toast.error('CSVファイルのみアップロード可能です')
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (showDuplicateOption) {
        formData.append('duplicate_action', duplicateAction)
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'インポートに失敗しました')
        return
      }

      setResult(data)

      if (data.error_count === 0) {
        toast.success(`${data.success_count}件のインポートが完了しました`)
      } else {
        toast.warning(`${data.success_count}件成功、${data.error_count}件エラーがありました`)
      }
    } catch {
      toast.error('通信エラーが発生しました')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownloadErrors = () => {
    if (!result?.errors?.length) return

    const csvData = result.errors.map((e) => ({
      行番号: e.row,
      電話番号: e.phone_number,
      エラー理由: e.reason,
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'import_errors.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    setFile(null)
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed
          cursor-pointer transition-colors py-12 px-6
          ${isDragging
            ? 'border-blue-500 bg-blue-50'
            : file
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
        {file ? (
          <>
            <FileText className="h-10 w-10 text-green-600" />
            <div className="text-center">
              <p className="font-medium text-green-700">{file.name}</p>
              <p className="text-sm text-green-600">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          </>
        ) : (
          <>
            <Upload className="h-10 w-10 text-gray-400" />
            <div className="text-center">
              <p className="font-medium text-gray-700">CSVファイルをここにドラッグ＆ドロップ</p>
              <p className="text-sm text-gray-500">またはクリックしてファイルを選択</p>
            </div>
          </>
        )}
      </div>

      {/* Duplicate action option */}
      {showDuplicateOption && (
        <div className="rounded-lg border bg-white p-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">重複時の処理</p>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`duplicate-${endpoint}`}
                value="skip"
                checked={duplicateAction === 'skip'}
                onChange={() => setDuplicateAction('skip')}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">スキップ（既存データを保持）</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`duplicate-${endpoint}`}
                value="overwrite"
                checked={duplicateAction === 'overwrite'}
                onChange={() => setDuplicateAction('overwrite')}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">上書き更新</span>
            </label>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {isUploading ? 'インポート中...' : 'インポート開始'}
        </Button>
        {file && (
          <Button variant="outline" onClick={handleReset}>
            リセット
          </Button>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-green-800 font-medium">成功: {result.success_count}件登録</span>
            </div>
            {result.error_count > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <span className="text-red-800 font-medium">エラー: {result.error_count}件</span>
              </div>
            )}
          </div>

          {/* Error table */}
          {result.errors && result.errors.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">エラー詳細</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadErrors}
                  className="flex items-center gap-2 text-sm"
                >
                  <Download className="h-4 w-4" />
                  エラーCSVをダウンロード
                </Button>
              </div>
              <div className="overflow-hidden rounded-lg border border-red-200">
                <table className="w-full text-sm">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-red-800">行番号</th>
                      <th className="px-4 py-2 text-left font-medium text-red-800">電話番号</th>
                      <th className="px-4 py-2 text-left font-medium text-red-800">エラー理由</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100 bg-white">
                    {result.errors.map((err, i) => (
                      <tr key={i} className="hover:bg-red-50">
                        <td className="px-4 py-2 text-gray-700">{err.row}</td>
                        <td className="px-4 py-2 font-mono text-gray-700">{err.phone_number || '-'}</td>
                        <td className="px-4 py-2 text-red-700">{err.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sample CSV format */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">CSVフォーマット（サンプル）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="text-xs w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  {sampleColumns.map((col) => (
                    <th
                      key={col.name}
                      className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-700"
                    >
                      {col.name}
                      {col.required && <span className="ml-1 text-red-500">*</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sampleRows && sampleRows.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {row.map((cell, j) => (
                      <td key={j} className="border border-gray-300 px-3 py-2 text-gray-600">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 space-y-1">
            {sampleColumns.map((col) => (
              <p key={col.name} className="text-xs text-gray-500">
                <span className="font-medium text-gray-700">{col.name}</span>
                {col.required && <span className="text-red-500 ml-0.5">*</span>}
                : {col.description}
              </p>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-400">* 必須項目</p>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Column definitions ─────────────────────────────────────────────────────

const FACILITIES_COLUMNS = [
  { name: '施設名', description: '施設の正式名称', required: true },
  { name: '電話番号', description: 'ハイフンあり・なし・全角すべて自動正規化', required: true },
  { name: '都道府県', description: '例: 東京都（47都道府県と完全一致）', required: true },
  { name: '市区町村', description: '例: 渋谷区', required: true },
  { name: '住所', description: '番地・建物名など（「以降の住所」も可）', required: false },
  { name: '種別', description: '幼稚園 / 保育園 / 認定こども園 / 学童 / その他', required: false },
  { name: 'メール', description: 'メールアドレス', required: false },
  { name: 'Webサイト', description: 'URL', required: false },
  { name: '担当者名', description: '園長・主任等のキーパーソン名', required: false },
  { name: '定員数', description: '数値のみ', required: false },
  { name: '既存習い事', description: '既に実施している習い事（自由テキスト）', required: false },
  { name: '園の特色', description: 'AIトーク自動生成のインプットになります', required: false },
]

const FACILITIES_SAMPLE_ROWS = [
  ['ひまわり保育園', '03-1234-5678', '東京都', '渋谷区', '神南1-1-1', '保育園', '', '', '山田 太郎', '80', 'ピアノ', '自然教育・英語教育に力を入れている'],
  ['さくら幼稚園', '0422-56-7890', '東京都', '三鷹市', '下連雀2-2-2', '幼稚園', 'info@sakura.jp', '', '', '150', '', ''],
]

const ACTIVITIES_COLUMNS = [
  { name: '架電日時', description: 'YYYY-MM-DD HH:MM 形式', required: true },
  { name: '電話番号', description: '施設マスタの電話番号（マッチングキー・正規化済みでなくてもOK）', required: true },
  { name: '担当者', description: '架電した営業担当者名', required: true },
  { name: 'ステータス', description: '未着手 / 不在・掛け直し / 資料送付（メール/郵送）/ 検討中・連絡待ち / アポ獲得 / NG（失注）', required: true },
  { name: 'NG理由', description: '物理的要因 / 競合・既存あり / 特色・ターゲット不一致 / 募集停止中 / その他', required: false },
  { name: '対応者名', description: '電話に出た方の名前・役職', required: false },
  { name: '詳細メモ', description: '通話内容のメモ', required: false },
  { name: '次回アクション', description: '設定なし / 再架電（フォローコール）/ メール送付 / 資料郵送 / 先方からの連絡待ち / MTG・体験会実施', required: false },
  { name: '次回予定日', description: 'YYYY-MM-DD 形式', required: false },
]

const ACTIVITIES_SAMPLE_ROWS = [
  ['2025-04-01 10:30', '03-1234-5678', 'ユイ', 'アポ獲得', '', '田中先生', '前向きな反応あり', '先方からの連絡待ち', ''],
  ['2025-04-01 14:00', '0422-56-7890', 'ユイ', 'NG（失注）', '競合・既存あり', '', '既存ピアノ教室と独占契約中', '設定なし', ''],
]

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ImportPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">CSVインポート / エクスポート</h1>
        <p className="text-sm text-gray-500 mt-1">
          施設情報・活動履歴をCSVファイルから一括登録、またはエクスポートできます
        </p>
      </div>

      {/* Export section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">施設データをエクスポート</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                現在登録されているすべての施設情報をCSV形式でダウンロードします。
                インポートと同じ列形式なので、編集後に「上書き更新」で再インポートできます。
              </p>
            </div>
            <a href="/api/export/facilities" className="shrink-0">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                施設CSVをダウンロード
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="facilities">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="facilities">施設情報インポート</TabsTrigger>
          <TabsTrigger value="activities">活動履歴インポート</TabsTrigger>
        </TabsList>

        <TabsContent value="facilities" className="mt-6">
          <UploadSection
            endpoint="/api/import/facilities"
            showDuplicateOption
            sampleColumns={FACILITIES_COLUMNS}
            sampleRows={FACILITIES_SAMPLE_ROWS}
          />
        </TabsContent>

        <TabsContent value="activities" className="mt-6">
          <div className="space-y-6">
            {/* Activities export */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-800">活動履歴をエクスポート</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      実架電の活動履歴をCSV形式でダウンロードします。インポートと同じ列形式です。
                    </p>
                  </div>
                  <a href="/api/export/activities" className="shrink-0">
                    <Button variant="outline" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      活動履歴CSVをダウンロード
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>

            <UploadSection
              endpoint="/api/import/activities"
              showDuplicateOption={false}
              sampleColumns={ACTIVITIES_COLUMNS}
              sampleRows={ACTIVITIES_SAMPLE_ROWS}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
