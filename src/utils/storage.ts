import { isIsoDate } from './format'
import { INITIAL_ROOMMATES, INITIAL_SETTINGS, INITIAL_SETTLEMENTS, INITIAL_EXPENSES, INITIAL_METERS, INITIAL_CART_ITEMS, INITIAL_CLEANING_SHIFTS } from '../data/mockData'

function matches(value: unknown, sample: unknown): boolean {
  if (typeof sample === 'number') return typeof value === 'number' && Number.isFinite(value)
  if (sample === null) return value === null
  if (Array.isArray(sample)) return Array.isArray(value) && value.every(v => matches(v, sample[0]))
  if (typeof sample === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false
    const record = value as Record<string, unknown>
    return Object.entries(sample).every(([key, field]) => key in record && matches(record[key], field))
  }
  return typeof value === typeof sample
}

export function validStoredSlice(key: string, value: unknown): boolean {
  const samples: Record<string, unknown> = {
    settings: INITIAL_SETTINGS,
    roommates: INITIAL_ROOMMATES,
    settlements: INITIAL_SETTLEMENTS,
    expenses: INITIAL_EXPENSES,
    meters: INITIAL_METERS,
    cartItems: INITIAL_CART_ITEMS,
    cleaning_shifts: INITIAL_CLEANING_SHIFTS,
    currentUserId: '',
    sidebar_collapsed: false,
  }
  // Seed records have different optional fields; validate them separately when present.
  const optional = new Set(['receiptName', 'receiptType', 'receiptItems', 'receiptUrl', 'settledDate', 'lastReminderSent', 'wifi', 'drogerie', 'other', 'bankAccount', 'iban', 'photoUrl', 'note', 'notes', 'completedAt', 'completedBy', 'isPurchased', 'purchasedBy', 'purchasedAt', 'swapRequest'])
  function requiredShape(sample: unknown): unknown {
    if (Array.isArray(sample)) return [requiredShape(sample[0])]
    if (sample && typeof sample === 'object') return Object.fromEntries(Object.entries(sample).filter(([k]) => !optional.has(k)).map(([k, v]) => [k, requiredShape(v)]))
    return sample
  }
  const optionalSamples: Record<string, unknown> = {
    receiptName: '', receiptType: '', receiptUrl: '', receiptItems: [{ id: '', name: '', price: 0, qty: 0 }],
    settledDate: '', lastReminderSent: '', wifi: 0, drogerie: 0, other: 0,
    bankAccount: '', iban: '', photoUrl: '', note: '', notes: '', completedAt: '', completedBy: '',
    isPurchased: false, purchasedBy: '', purchasedAt: '',
    swapRequest: { id: '', targetRoommateId: '', targetRoommateName: '', requestedByRoommateId: '', requestedByRoommateName: '', status: '', createdAt: '' },
  }
  function validOptionalFields(record: unknown): boolean {
    if (Array.isArray(record)) return record.every(validOptionalFields)
    if (!record || typeof record !== 'object') return true
    return Object.entries(record).every(([field, entry]) => {
      if (entry !== undefined && field in optionalSamples && !matches(entry, optionalSamples[field])) return false
      if (field === 'receiptType' && !['PDF', 'JPG', 'PNG'].includes(String(entry))) return false
      if (['price', 'amount', 'totalAmount', 'totalDebt', 'unitPrice', 'value', 'delta', 'rent', 'energy', 'wifi', 'drogerie', 'other'].includes(field) && (typeof entry !== 'number' || !Number.isFinite(entry) || entry < 0)) return false
      if (field === 'qty' && (typeof entry !== 'number' || !Number.isInteger(entry) || entry <= 0)) return false
      return validOptionalFields(entry)
    })
  }
  if (!(key in samples) || !matches(value, requiredShape(samples[key])) || !validOptionalFields(value)) return false
  if (key === 'roommates') {
    const rows = value as typeof INITIAL_ROOMMATES
    return rows.length > 0 && rows.some(r => r.role === 'Správce')
      && rows.every(r => ['Správce', 'Člen'].includes(r.role) && r.roomAreaM2 >= 5)
      && new Set(rows.map(r => r.id)).size === rows.length
  }
  if (key === 'settings') {
    const settings = value as typeof INITIAL_SETTINGS
    return typeof settings.iban === 'string' && /^CZ\d{22}$/.test(settings.iban)
      && settings.monthlyRent > 0 && settings.monthlyUtilities > 0
      && Number.isInteger(settings.dueDayOfMonth) && settings.dueDayOfMonth >= 1 && settings.dueDayOfMonth <= 28
      && ['EQUAL', 'BY_AREA'].includes(settings.rules.rentKey)
      && ['EQUAL', 'BY_AREA'].includes(settings.rules.energyKey) && settings.rules.suppliesKey === 'EQUAL'
  }
  if (key === 'meters') return (value as typeof INITIAL_METERS).every(m => isIsoDate(m.date) && ['ELEKTŘINA', 'PLYN', 'STUDENÁ_VODA', 'TEPLÁ_VODA'].includes(m.type))
  if (key === 'expenses') return (value as typeof INITIAL_EXPENSES).every(e => isIsoDate(e.date)
    && ['UHRAZENO', 'ČÁSTEČNĚ', 'PO_SPLATNOSTI'].includes(e.status)
    && ['EQUAL', 'BY_AREA', 'CUSTOM'].includes(e.calculationKey)
    && ['Bydlení', 'Energie', 'Drogerie', 'Služby', 'Údržba', 'Jídlo'].includes(e.category)
    && e.shares.every(share => ['UHRAZENO', 'DLUŽÍ', 'PO_SPLATNOSTI', 'PLÁTCE'].includes(share.status)))
  if (key === 'cleaning_shifts') return (value as typeof INITIAL_CLEANING_SHIFTS).every(shift =>
    Number.isInteger(shift.weekNumber) && shift.weekNumber >= 1 && shift.weekNumber <= 53
    && ['KITCHEN', 'BATHROOM', 'CORRIDOR', 'TRASH'].includes(shift.taskKey)
    && (!shift.swapRequest || ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'].includes(shift.swapRequest.status)))
  return true
}
