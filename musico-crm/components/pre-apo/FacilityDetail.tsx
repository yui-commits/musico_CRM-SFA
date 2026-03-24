'use client'

import { FacilityWithActivities, LeadStatus } from '@/types'
import { formatDate, formatDateTime } from '@/lib/utils'
import { formatPhoneNumber } from '@/lib/normalizers'

interface FacilityDetailProps {
  facility: FacilityWithActivities
}

const STATUS_BADGE: Record<LeadStatus, string> = {
  '未着手': 'bg-gray-100 text-gray-700 border-gray-300',
  '不在・掛け直し': 'bg-blue-100 text-blue-700 border-blue-300',
  '資料送付（メール/郵送）': 'bg-indigo-100 text-indigo-700 border-indigo-300',
  '検討中・連絡待ち': 'bg-yellow-100 text-yellow-700 border-yellow-300',
  'アポ獲得': 'bg-green-100 text-green-700 border-green-300',
  'NG（失注）': 'bg-red-100 text-red-700 border-red-300',
}

const TYPE_BADGE: Record<string, string> = {
  '幼稚園': 'bg-orange-100 text-orange-700',
  '保育園': 'bg-pink-100 text-pink-700',
  '認定こども園': 'bg-purple-100 text-purple-700',
  '学童': 'bg-teal-100 text-teal-700',
  'その他': 'bg-gray-100 text-gray-700',
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-28 flex-shrink-0 text-gray-500 text-xs pt-0.5">{label}</span>
      <span className="text-gray-900 flex-1 break-all">{children}</span>
    </div>
  )
}

export default function FacilityDetail({ facility }: FacilityDetailProps) {
  const sortedActivities = [...facility.activities].sort(
    (a, b) => new Date(b.called_at).getTime() - new Date(a.called_at).getTime()
  )

  return (
    <div className="flex flex-col gap-5 overflow-y-auto">
      {/* Header */}
      <div>
        <div className="flex items-start gap-2 mb-1">
          <h2 className="text-xl font-bold text-gray-900 leading-tight">{facility.name}</h2>
          {facility.type && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${TYPE_BADGE[facility.type] ?? 'bg-gray-100 text-gray-700'}`}
            >
              {facility.type}
            </span>
          )}
        </div>
        {facility.operating_company && (
          <p className="text-xs text-gray-500 mt-0.5">{facility.operating_company}</p>
        )}
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border mt-1 ${STATUS_BADGE[facility.lead_status]}`}
        >
          {facility.lead_status}
        </span>
      </div>

      {/* Basic Info */}
      <div className="flex flex-col gap-2.5 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <InfoRow label="電話番号">
          <a
            href={`tel:${facility.phone_number}`}
            className="text-blue-600 hover:underline font-mono"
          >
            {formatPhoneNumber(facility.phone_number)}
          </a>
        </InfoRow>
        <InfoRow label="エリア">
          {facility.prefecture}
          {facility.municipality}
          {facility.address && ` ${facility.address}`}
        </InfoRow>
        {facility.key_person_name && (
          <InfoRow label="園長名">{facility.key_person_name}</InfoRow>
        )}
        {facility.email && (
          <InfoRow label="代表メール">
            <a href={`mailto:${facility.email}`} className="text-blue-600 hover:underline break-all">
              {facility.email}
            </a>
          </InfoRow>
        )}
        {facility.website_url && (
          <InfoRow label="HP">
            <a
              href={facility.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              {facility.website_url}
            </a>
          </InfoRow>
        )}
        {facility.capacity && (
          <InfoRow label="定員">{facility.capacity}名</InfoRow>
        )}
      </div>

      {/* Features */}
      {(facility.existing_classes || facility.features) && (
        <div className="flex flex-col gap-2.5 p-3 bg-gray-50 rounded-lg border border-gray-100">
          {facility.existing_classes && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">既存の課外教室</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{facility.existing_classes}</p>
            </div>
          )}
          {facility.features && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">園の特色・方針</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{facility.features}</p>
            </div>
          )}
        </div>
      )}

      {/* Activities Timeline */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          活動履歴
          <span className="ml-2 text-xs font-normal text-gray-400">({sortedActivities.length}件)</span>
        </h3>

        {sortedActivities.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">架電記録がありません</p>
        ) : (
          <div className="flex flex-col gap-2">
            {sortedActivities.map((activity, index) => (
              <div
                key={activity.id}
                className={`relative pl-5 pb-3 ${index < sortedActivities.length - 1 ? 'border-l-2 border-gray-200 ml-2' : 'ml-2'}`}
              >
                {/* Timeline dot */}
                <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-gray-300" />

                <div className="bg-white rounded-md border border-gray-200 p-3">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-xs text-gray-500">{formatDateTime(activity.called_at)}</span>
                    <span className="text-xs text-gray-600 font-medium">{activity.sales_person}</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE[activity.call_status]}`}
                    >
                      {activity.call_status}
                    </span>
                  </div>
                  {activity.ng_reason && (
                    <p className="text-xs text-red-600 mb-1">NG理由: {activity.ng_reason}</p>
                  )}
                  {activity.note && (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{activity.note}</p>
                  )}
                  {activity.next_action && (
                    <p className="text-xs text-gray-500 mt-1.5">
                      次回: {activity.next_action}
                      {activity.next_action_date && (
                        <span className="ml-1 font-medium text-gray-600">
                          ({formatDate(activity.next_action_date)})
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
