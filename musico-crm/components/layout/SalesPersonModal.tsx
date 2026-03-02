'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SALES_PERSON_KEY } from '@/lib/constants'

interface SalesPersonModalProps {
  onSet: (name: string) => void
}

const PRESET_NAMES = ['ユイ', '三上のどか']

export function SalesPersonModal({ onSet }: SalesPersonModalProps) {
  const [name, setName] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(SALES_PERSON_KEY)
    if (!stored) {
      setOpen(true)
    }
  }, [])

  function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) return
    localStorage.setItem(SALES_PERSON_KEY, trimmed)
    onSet(trimmed)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">担当者を選択してください</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>よく使う担当者</Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_NAMES.map((preset) => (
                <Button
                  key={preset}
                  variant={name === preset ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setName(preset)}
                >
                  {preset}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="person-name">または直接入力</Label>
            <Input
              id="person-name"
              placeholder="担当者名を入力"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            保存してシステムを開始
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
