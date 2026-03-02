'use client'

import './globals.css'
import { useState, useCallback, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Header } from '@/components/layout/Header'
import { SalesPersonModal } from '@/components/layout/SalesPersonModal'
import { Toaster } from 'sonner'
import { SALES_PERSON_KEY } from '@/lib/constants'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
    },
  },
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [showModal, setShowModal] = useState(false)

  const handleChangePerson = useCallback(() => {
    localStorage.removeItem(SALES_PERSON_KEY)
    setShowModal(true)
    window.dispatchEvent(new Event('musico:person-changed'))
  }, [])

  const handlePersonSet = useCallback((_name: string) => {
    setShowModal(false)
    window.dispatchEvent(new Event('musico:person-changed'))
  }, [])

  return (
    <html lang="ja">
      <body className="bg-gray-50 min-h-screen">
        <QueryClientProvider client={queryClient}>
          <SalesPersonModal onSet={handlePersonSet} />
          {showModal && <SalesPersonModal onSet={handlePersonSet} />}
          <Header onChangePerson={handleChangePerson} />
          <main className="max-w-screen-2xl mx-auto px-4 py-6">
            {children}
          </main>
          <Toaster />
        </QueryClientProvider>
      </body>
    </html>
  )
}
