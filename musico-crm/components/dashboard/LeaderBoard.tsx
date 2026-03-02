interface LeaderBoardRow {
  sales_person: string
  call_count: number
  apo_count: number
  apo_rate: number
  top_ng_reason: string | null
}

interface LeaderBoardProps {
  rows: LeaderBoardRow[]
}

const RANK_STYLES: Record<number, { badge: string; row: string }> = {
  1: { badge: 'bg-yellow-400 text-yellow-900', row: 'bg-yellow-50' },
  2: { badge: 'bg-gray-300 text-gray-800', row: 'bg-gray-50' },
  3: { badge: 'bg-orange-300 text-orange-900', row: 'bg-orange-50' },
}

const RANK_LABELS: Record<number, string> = {
  1: '1st',
  2: '2nd',
  3: '3rd',
}

export function LeaderBoard({ rows }: LeaderBoardProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-gray-400 text-sm">
        データがありません
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left font-medium text-gray-600 w-12">順位</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">担当者</th>
            <th className="px-4 py-3 text-right font-medium text-gray-600">架電数</th>
            <th className="px-4 py-3 text-right font-medium text-gray-600">アポ獲得数</th>
            <th className="px-4 py-3 text-right font-medium text-gray-600">アポ率</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">NG理由 TOP1</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, index) => {
            const rank = index + 1
            const styles = RANK_STYLES[rank]
            return (
              <tr
                key={row.sales_person}
                className={`transition-colors hover:bg-blue-50 ${styles?.row ?? ''}`}
              >
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center justify-center rounded-full text-xs font-bold px-2 py-0.5 min-w-[2.5rem]
                      ${styles
                        ? styles.badge
                        : 'bg-gray-100 text-gray-600'
                      }
                    `}
                  >
                    {RANK_LABELS[rank] ?? `${rank}th`}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {row.sales_person}
                </td>
                <td className="px-4 py-3 text-right text-gray-700 tabular-nums">
                  {row.call_count.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-gray-700 tabular-nums">
                  {row.apo_count.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  <span
                    className={`font-medium ${
                      row.apo_rate >= 20
                        ? 'text-green-600'
                        : row.apo_rate >= 10
                          ? 'text-blue-600'
                          : 'text-gray-600'
                    }`}
                  >
                    {row.apo_rate.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {row.top_ng_reason ? (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                      {row.top_ng_reason}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-xs">-</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
