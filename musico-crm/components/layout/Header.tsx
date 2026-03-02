'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SALES_PERSON_KEY } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface HeaderProps {
  onChangePerson: () => void
}

const NAV_ITEMS = [
  { href: '/pre-apo', label: 'テレアポ管理' },
  { href: '/post-apo', label: '商談・体験会管理' },
  { href: '/dashboard', label: 'ダッシュボード' },
  { href: '/report', label: '週次レポート' },
  { href: '/import', label: 'CSVインポート' },
]

export function Header({ onChangePerson }: HeaderProps) {
  const pathname = usePathname()
  const [salesPerson, setSalesPerson] = useState<string>('')

  useEffect(() => {
    const stored = localStorage.getItem(SALES_PERSON_KEY) || ''
    setSalesPerson(stored)
  }, [])

  // Listen for storage changes
  useEffect(() => {
    const handler = () => {
      setSalesPerson(localStorage.getItem(SALES_PERSON_KEY) || '')
    }
    window.addEventListener('storage', handler)
    window.addEventListener('musico:person-changed', handler)
    return () => {
      window.removeEventListener('storage', handler)
      window.removeEventListener('musico:person-changed', handler)
    }
  }, [])

  return (
    <header className="border-b bg-white sticky top-0 z-40">
      <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/pre-apo" className="font-bold text-lg text-purple-700">
            🎻 MUSICO CRM
          </Link>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  pathname.startsWith(item.href)
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>現在：{salesPerson}さん</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onChangePerson}
            className="text-xs"
          >
            [変更]
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-gray-500"
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' })
              window.location.href = '/login'
            }}
          >
            ログアウト
          </Button>
        </div>
      </div>
    </header>
  )
}
