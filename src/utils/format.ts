export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

export function csvCell(value: string | number): string {
  const text = String(value)
  const safe = /^\s*[=+\-@]/.test(text) ? "'" + text : text
  return '"' + safe.replace(/"/g, '""') + '"'
}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString().slice(0, 10) === value
}

export function formatDateCz(value: string, yearMode: 'full' | 'short' | 'none' = 'full', empty: string = '—'): string {
  if (!isIsoDate(value)) return value || empty
  const [year, month, day] = value.split('-')
  const suffix = yearMode === 'none' ? '' : ' ' + (yearMode === 'short' ? year.slice(2) : year)
  return `${day}. ${month}.${suffix}`
}

export function formatCzk(value: number): string {
  return `${value.toLocaleString('cs-CZ')} Kč`
}

export function pluralCz(value: number, one: string, few: string, other: string): string {
  return value === 1 ? one : value >= 2 && value <= 4 ? few : other
}
