import { createClient } from '@/lib/supabase/server'
import { Facility } from '@/types'
import PreApoClient from './PreApoClient'

export const dynamic = 'force-dynamic'

export default async function PreApoPage() {
  const supabase = await createClient()

  const { data: facilities } = await supabase
    .from('facilities')
    .select('*')
    .neq('lead_status', 'アポ獲得')
    .order('updated_at', { ascending: false })
    .limit(200)

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">テレアポ管理（Pre-APO）</h1>
        <p className="text-sm text-gray-500 mt-1">架電リスト・活動記録の管理</p>
      </div>

      <PreApoClient />
    </div>
  )
}
