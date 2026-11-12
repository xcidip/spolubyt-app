import { locale, t } from '../i18n'
import type { CleaningShift } from '../types'
import { formatDateCz, isIsoDate } from './format'

export function formatCleaningWeek(shift: Pick<CleaningShift, 'weekNumber' | 'startDate' | 'endDate'>): string {
  return t('cleaning.weekLabel', 'Týden {week} ({start} – {end} {year})', {
    week: shift.weekNumber,
    start: formatDateCz(shift.startDate, 'none'),
    end: formatDateCz(shift.endDate, 'none'),
    year: shift.endDate.slice(0, 4),
  })
}

export function formatStoredTime(value: string): string {
  if (isIsoDate(value)) return formatDateCz(value)
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const timestamp = new Date(value)
    if (Number.isFinite(timestamp.getTime())) return timestamp.toLocaleString(locale.value === 'en' ? 'en-GB' : 'cs-CZ', { dateStyle: 'short', timeStyle: 'short' })
  }
  const relativeKeys: Record<string, string> = {
    'Právě teď': 'common.now',
    'Dnes': 'common.today',
    'Včera': 'common.yesterday',
    'Před 2 dny': 'common.twoDaysAgo',
    'Před 3 dny': 'common.threeDaysAgo',
  }
  return relativeKeys[value] ? t(relativeKeys[value], value) : value
}
