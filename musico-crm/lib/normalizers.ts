/**
 * Normalize phone number:
 * 1. Convert full-width digits to half-width
 * 2. Remove all non-digit characters
 */
export function normalizePhoneNumber(input: string): string {
  // Convert full-width digits (０-９) to half-width (0-9)
  const halfWidth = input.replace(/[０-９]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0xfee0)
  )
  // Remove everything except digits
  return halfWidth.replace(/[^0-9]/g, '')
}

/**
 * Validate normalized phone number (digits only, 10-11 digits)
 */
export function isValidPhoneNumber(normalized: string): boolean {
  return /^\d{10,11}$/.test(normalized)
}

/**
 * Format phone number for display (add hyphens)
 * e.g. 09012345678 -> 090-1234-5678
 */
export function formatPhoneNumber(normalized: string): string {
  if (normalized.startsWith('0120') || normalized.startsWith('0800')) {
    return normalized.replace(/(\d{4})(\d{3})(\d{4})/, '$1-$2-$3')
  }
  if (normalized.length === 11) {
    return normalized.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
  }
  if (normalized.length === 10) {
    return normalized.replace(/(\d{2,4})(\d{2,4})(\d{4})/, '$1-$2-$3')
  }
  return normalized
}
