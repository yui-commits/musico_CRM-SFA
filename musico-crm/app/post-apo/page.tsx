import { KanbanBoard } from '@/components/post-apo/KanbanBoard'

export const metadata = {
  title: '商談・体験会管理 | ムジコ CRM',
}

export default function PostApoPage() {
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">商談・体験会管理</h1>
      <KanbanBoard initialFacilities={[]} />
    </div>
  )
}
