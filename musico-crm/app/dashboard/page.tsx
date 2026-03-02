'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { KPISummary } from '@/components/dashboard/KPISummary'
import { LeaderBoard } from '@/components/dashboard/LeaderBoard'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { Activity, Facility } from '@/types'
import { format, startOfMonth, endOfMonth, subMonths, subDays, startOfYear, setMonth } from 'date-fns'

// ─── Types ──────────────────────────────────────────────────────────────────

type PeriodPreset = '今月' | '先月' | '過去30日間' | '今年度（4月〜）' | '全期間' | 'カスタム'

interface LeaderBoardRow {
  sales_person: string
  call_count: number
  apo_count: number
  apo_rate: number
  top_ng_reason: string | null
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getPeriodDates(preset: PeriodPreset, customFrom: string, customTo: string): { from: Date | null; to: Date | null } {
  const now = new Date()

  switch (preset) {
    case '今月':
      return { from: startOfMonth(now), to: now }
    case '先月': {
      const lastMonth = subMonths(now, 1)
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) }
    }
    case '過去30日間':
      return { from: subDays(now, 30), to: now }
    case '今年度（4月〜）': {
      const aprilThisYear = setMonth(startOfYear(now), 3) // April = index 3
      // If current month is before April, fiscal year started in previous year
      const fiscalStart = now.getMonth() >= 3
        ? aprilThisYear
        : setMonth(startOfYear(subMonths(now, 12)), 3)
      return { from: fiscalStart, to: now }
    }
    case '全期間':
      return { from: null, to: null }
    case 'カスタム':
      return {
        from: customFrom ? new Date(customFrom) : null,
        to: customTo ? new Date(customTo) : null,
      }
  }
}

const PIE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4']

// ─── Page ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const supabase = createClient()

  // Filter state
  const [preset, setPreset] = useState<PeriodPreset>('今月')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [selectedPerson, setSelectedPerson] = useState<string>('全体')

  // Data state
  const [activities, setActivities] = useState<Activity[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [salesPersons, setSalesPersons] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // ── Fetch activities for selected period ──────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)

    const { from, to } = getPeriodDates(preset, customFrom, customTo)

    // Build activities query — 実架電のみ（status_change は集計対象外）
    let actQuery = supabase
      .from('activities')
      .select('*')
      .eq('activity_type', 'call')
      .order('called_at', { ascending: true })
    if (from) actQuery = actQuery.gte('called_at', from.toISOString())
    if (to) actQuery = actQuery.lte('called_at', to.toISOString())

    // Fetch facilities (all, for enrollment_count aggregation)
    const [actResult, facResult] = await Promise.all([
      actQuery,
      supabase.from('facilities').select('*'),
    ])

    const acts: Activity[] = actResult.data ?? []
    const facs: Facility[] = facResult.data ?? []

    setActivities(acts)
    setFacilities(facs)

    // Derive unique sales persons from all-time call activities for the dropdown
    const { data: allActs } = await supabase
      .from('activities')
      .select('sales_person')
      .eq('activity_type', 'call')
    const persons = Array.from(new Set((allActs ?? []).map((a: { sales_person: string }) => a.sales_person))).filter(Boolean).sort()
    setSalesPersons(persons as string[])

    setLoading(false)
  }, [preset, customFrom, customTo]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Filter activities by sales person ────────────────────────────────────
  const filteredActivities = selectedPerson === '全体'
    ? activities
    : activities.filter((a) => a.sales_person === selectedPerson)

  // ── KPI calculations ─────────────────────────────────────────────────────
  const totalCalls = filteredActivities.length
  const apoCount = filteredActivities.filter((a) => a.call_status === 'アポ獲得').length
  const apoRate = totalCalls > 0 ? (apoCount / totalCalls) * 100 : 0

  // enrollment count: facilities with deal_status = '【Ph6】開講決定・準備中'
  const enrollmentFacilities = facilities.filter((f) => f.deal_status === '【Ph6】開講決定・準備中')
  const enrollmentCount = enrollmentFacilities.length
  const totalEnrollment = enrollmentFacilities.reduce((sum, f) => sum + (f.enrollment_count ?? 0), 0)

  // ── Leaderboard ──────────────────────────────────────────────────────────
  const leaderboardRows: LeaderBoardRow[] = (() => {
    const map = new Map<string, { calls: number; apos: number; ngReasons: string[] }>()

    for (const act of activities) {
      const person = act.sales_person
      if (!person) continue
      const entry = map.get(person) ?? { calls: 0, apos: 0, ngReasons: [] }
      entry.calls++
      if (act.call_status === 'アポ獲得') entry.apos++
      if (act.ng_reason) entry.ngReasons.push(act.ng_reason)
      map.set(person, entry)
    }

    return Array.from(map.entries())
      .map(([person, data]) => {
        // Find most frequent NG reason
        const ngCounts: Record<string, number> = {}
        for (const r of data.ngReasons) ngCounts[r] = (ngCounts[r] ?? 0) + 1
        const topNg = Object.entries(ngCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

        return {
          sales_person: person,
          call_count: data.calls,
          apo_count: data.apos,
          apo_rate: data.calls > 0 ? (data.apos / data.calls) * 100 : 0,
          top_ng_reason: topNg,
        }
      })
      .sort((a, b) => b.apo_count - a.apo_count)
  })()

  // ── Funnel chart data ─────────────────────────────────────────────────────
  const funnelData = [
    { name: '架電', value: totalCalls },
    { name: 'アポ', value: apoCount },
    {
      name: '面談',
      value: facilities.filter((f) =>
        f.deal_status && !['面談日程調整中', '面談設定済'].includes(f.deal_status)
      ).length,
    },
    {
      name: '体験会',
      value: facilities.filter((f) =>
        f.deal_status && f.deal_status.startsWith('【Ph4】') || f.deal_status?.startsWith('【Ph5】')
      ).length,
    },
    { name: '開講決定', value: enrollmentCount },
  ]

  // ── NG reason pie chart data ──────────────────────────────────────────────
  const ngCounts: Record<string, number> = {}
  for (const act of filteredActivities) {
    if (act.ng_reason) ngCounts[act.ng_reason] = (ngCounts[act.ng_reason] ?? 0) + 1
  }
  const ngPieData = Object.entries(ngCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // ── Daily trend chart data ────────────────────────────────────────────────
  const dailyMap = new Map<string, { calls: number; apos: number }>()
  for (const act of filteredActivities) {
    const day = act.called_at.slice(0, 10) // YYYY-MM-DD
    const entry = dailyMap.get(day) ?? { calls: 0, apos: 0 }
    entry.calls++
    if (act.call_status === 'アポ獲得') entry.apos++
    dailyMap.set(day, entry)
  }
  const dailyData = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }))

  // ── Render ────────────────────────────────────────────────────────────────

  const PRESET_BUTTONS: PeriodPreset[] = ['今月', '先月', '過去30日間', '今年度（4月〜）', '全期間']

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">データ分析ダッシュボード</h1>
        <p className="text-sm text-gray-500 mt-1">営業活動のKPIをリアルタイムで確認できます</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          {/* Period presets */}
          <div className="flex flex-wrap gap-2">
            {PRESET_BUTTONS.map((p) => (
              <Button
                key={p}
                variant={preset === p ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreset(p)}
              >
                {p}
              </Button>
            ))}
            <Button
              variant={preset === 'カスタム' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreset('カスタム')}
            >
              カスタム
            </Button>
          </div>

          {/* Custom date range */}
          {preset === 'カスタム' && (
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-400 text-sm">〜</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Sales person filter */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">担当者</span>
            <Select value={selectedPerson} onValueChange={setSelectedPerson}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="全体">全体</SelectItem>
                {salesPersons.map((person) => (
                  <SelectItem key={person} value={person}>{person}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <KPISummary
          totalCalls={totalCalls}
          apoCount={apoCount}
          apoRate={apoRate}
          enrollmentCount={enrollmentCount}
          totalEnrollment={totalEnrollment}
        />
      )}

      {/* Leaderboard (only when 全体 selected) */}
      {selectedPerson === '全体' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-800">担当者別リーダーボード</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <LeaderBoard rows={leaderboardRows} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-800">営業ファネル</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={funnelData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(value) => [`${value}件`, '件数']}
                  />
                  <Bar dataKey="value" name="件数" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* NG reason pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-800">NG理由の内訳</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : ngPieData.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
                NG記録なし
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={ngPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {ngPieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(value) => [`${value}件`, '件数']}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily trend line chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">日別架電推移</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-72 w-full" />
          ) : dailyData.length === 0 ? (
            <div className="flex items-center justify-center h-72 text-gray-400 text-sm">
              データなし
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={288}>
              <LineChart data={dailyData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickFormatter={(val: string) => val.slice(5)} // MM-DD
                />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(value, name) => [
                    `${value}件`,
                    name === 'calls' ? '架電数' : 'アポ数',
                  ]}
                  labelFormatter={(label) => `${label}`}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value: string) => value === 'calls' ? '架電数' : 'アポ数'}
                />
                <Line
                  type="monotone"
                  dataKey="calls"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="apos"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
