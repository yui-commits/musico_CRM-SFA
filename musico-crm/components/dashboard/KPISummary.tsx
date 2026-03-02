import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, TrendingUp, Star, Users } from 'lucide-react'

interface KPISummaryProps {
  totalCalls: number
  apoCount: number
  apoRate: number
  enrollmentCount: number
  totalEnrollment: number
}

export function KPISummary({
  totalCalls,
  apoCount,
  apoRate,
  enrollmentCount,
  totalEnrollment,
}: KPISummaryProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 総架電数 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">総架電数</CardTitle>
          <Phone className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-gray-900">
            {totalCalls.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">件</p>
        </CardContent>
      </Card>

      {/* アポ獲得数 & アポ率 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">アポ獲得数</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-gray-900">
            {apoCount.toLocaleString()}
          </p>
          <p className="text-xs mt-1">
            <span className="font-medium text-green-600">
              {apoRate.toFixed(1)}%
            </span>
            <span className="text-gray-400 ml-1">アポ率</span>
          </p>
        </CardContent>
      </Card>

      {/* 開講決定数 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">開講決定数</CardTitle>
          <Star className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-gray-900">
            {enrollmentCount.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">施設</p>
        </CardContent>
      </Card>

      {/* 入会見込み累計 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">入会見込み累計</CardTitle>
          <Users className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-gray-900">
            {totalEnrollment.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">名</p>
        </CardContent>
      </Card>
    </div>
  )
}
