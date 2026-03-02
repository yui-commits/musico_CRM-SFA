import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isToday, isPast, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string | null, fmt = 'yyyy/MM/dd'): string {
  if (!dateString) return '-'
  try {
    return format(parseISO(dateString), fmt, { locale: ja })
  } catch {
    return '-'
  }
}

export function formatDateTime(dateString: string | null): string {
  return formatDate(dateString, 'yyyy/MM/dd HH:mm')
}

export function isOverdue(dateString: string | null): boolean {
  if (!dateString) return false
  try {
    const date = parseISO(dateString)
    return isPast(date) && !isToday(date)
  } catch {
    return false
  }
}

export function isDueToday(dateString: string | null): boolean {
  if (!dateString) return false
  try {
    return isToday(parseISO(dateString))
  } catch {
    return false
  }
}

export function isDueOrOverdue(dateString: string | null): boolean {
  return isOverdue(dateString) || isDueToday(dateString)
}
