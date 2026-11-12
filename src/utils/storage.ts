import { isIsoDate } from './format'
import { bankAccountsMatch } from './bank'
import type { CartItem, CleaningShift, DebtSettlement, Expense, MeterReading, Roommate } from '../types'
import { DEMO_TODAY } from '../data/mockData'

const categories = ['Bydlení', 'Energie', 'Drogerie', 'Služby', 'Údržba', 'Jídlo']
const meterTypes = ['ELEKTŘINA', 'PLYN', 'STUDENÁ_VODA', 'TEPLÁ_VODA']
const taskKeys = ['KITCHEN', 'BATHROOM', 'CORRIDOR', 'TRASH']
const shareStatuses = ['UHRAZENO', 'DLUŽÍ', 'PO_SPLATNOSTI', 'PLÁTCE']
const expenseStatuses = ['UHRAZENO', 'ČÁSTEČNĚ', 'PO_SPLATNOSTI']
const settlementStatuses = ['PŘED_SPLATNOSTÍ', 'PO_SPLATNOSTI', 'VYROVNÁNO']
const swapStatuses = ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED']

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function text(value: unknown): value is string {
  return typeof value === 'string'
}

function nonempty(value: unknown): value is string {
  return text(value) && value.trim().length > 0
}

function nonnegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function integer(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value)
}

function money(value: unknown): value is number {
  return nonnegative(value) && Number.isSafeInteger(Math.round(value * 100))
    && Math.abs(value * 100 - Math.round(value * 100)) < 0.00001
}

function memberOf(value: unknown, values: string[]): value is string {
  return text(value) && values.includes(value)
}

function isoDate(value: unknown): value is string {
  return text(value) && isIsoDate(value)
}

function settledDate(value: unknown): boolean {
  if (!text(value)) return false
  if (isIsoDate(value)) return value <= DEMO_TODAY
  const legacy = value.match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})$/)
  if (!legacy) return false
  const normalized = `${legacy[3]}-${legacy[2].padStart(2, '0')}-${legacy[1].padStart(2, '0')}`
  return isIsoDate(normalized) && normalized <= DEMO_TODAY
}

function optional(value: unknown, validate: (entry: unknown) => boolean): boolean {
  return value === undefined || validate(value)
}

function optionalTexts(value: Record<string, unknown>, fields: string[]): boolean {
  return fields.every(field => optional(value[field], text))
}

function unique<T>(values: T[], key: (value: T) => string): boolean {
  return new Set(values.map(key)).size === values.length
}

function payment(value: unknown): boolean {
  return record(value) && memberOf(value.method, ['BANK', 'CASH']) && text(value.note)
    && nonempty(value.recordedBy) && typeof value.notifyMember === 'boolean'
}

function validRoommate(value: unknown): boolean {
  return record(value) && ['id', 'name', 'email', 'phone', 'roomName', 'avatarColor', 'avatarInitial'].every(key => nonempty(value[key]))
    && memberOf(value.role, ['Správce', 'Člen']) && nonnegative(value.roomAreaM2) && value.roomAreaM2 >= 5
    && nonnegative(value.areaSharePct) && value.areaSharePct <= 100 && optionalTexts(value, ['bankAccount', 'iban'])
}

function validSettings(value: unknown): boolean {
  return record(value) && ['name', 'address', 'accountNumber', 'iban'].every(key => nonempty(value[key]))
    && money(value.monthlyRent) && value.monthlyRent > 0 && money(value.monthlyUtilities) && value.monthlyUtilities > 0
    && integer(value.dueDayOfMonth) && value.dueDayOfMonth >= 1 && value.dueDayOfMonth <= 28
    && record(value.rules) && memberOf(value.rules.rentKey, ['EQUAL', 'BY_AREA'])
    && memberOf(value.rules.energyKey, ['EQUAL', 'BY_AREA']) && value.rules.suppliesKey === 'EQUAL'
    && bankAccountsMatch(value.accountNumber as string, value.iban as string)
}

function validSettlement(value: unknown): boolean {
  if (!record(value) || !['roommateId', 'roommateName', 'roomName'].every(key => nonempty(value[key]))
    || !nonnegative(value.roomAreaM2) || value.roomAreaM2 < 5 || !nonnegative(value.areaSharePct) || value.areaSharePct > 100
    || !money(value.totalDebt) || !isoDate(value.dueDate) || !integer(value.daysOverdue) || value.daysOverdue < 0
    || !memberOf(value.status, settlementStatuses) || !record(value.breakdown)
    || !money(value.breakdown.rent) || !money(value.breakdown.energy)
    || !['wifi', 'drogerie', 'other'].every(key => optional(value.breakdown && (value.breakdown as Record<string, unknown>)[key], money))
    || !optionalTexts(value, ['lastReminderSent'])) return false

  const breakdown = value.breakdown
  if (Object.keys(breakdown).some(key => !['rent', 'energy', 'wifi', 'drogerie', 'other'].includes(key))) return false
  const totalCents = Object.values(breakdown).reduce<number>((sum, amount) => sum + Math.round((amount as number) * 100), 0)
  return totalCents === Math.round(value.totalDebt * 100)
    && value.status === (value.totalDebt === 0 ? 'VYROVNÁNO' : value.daysOverdue > 0 ? 'PO_SPLATNOSTI' : 'PŘED_SPLATNOSTÍ')
    && (value.totalDebt !== 0 || value.daysOverdue === 0)
}

function validShare(value: unknown): boolean {
  return record(value) && nonempty(value.roommateId) && nonempty(value.roommateName) && money(value.amount)
    && memberOf(value.status, shareStatuses) && optional(value.settledDate, settledDate) && optional(value.payment, payment)
    && (value.payment === undefined || (value.status === 'UHRAZENO' && isoDate(value.settledDate)))
}

function validReceiptItem(value: unknown): boolean {
  return record(value) && nonempty(value.id) && nonempty(value.name) && money(value.price)
    && integer(value.qty) && value.qty > 0 && Number.isSafeInteger(Math.round(value.price * 100) * value.qty)
}

function validExpense(value: unknown): boolean {
  if (!record(value) || !['id', 'code', 'title', 'payerId', 'payerName'].every(key => nonempty(value[key]))
    || !memberOf(value.category, categories) || !memberOf(value.calculationKey, ['EQUAL', 'BY_AREA', 'CUSTOM'])
    || !isoDate(value.date) || value.date > DEMO_TODAY || !money(value.totalAmount) || value.totalAmount <= 0
    || !Array.isArray(value.shares) || value.shares.length === 0 || !value.shares.every(validShare)
    || !memberOf(value.status, expenseStatuses) || !record(value.audit) || !nonempty(value.audit.createdBy) || !nonempty(value.audit.createdAt)
    || !optionalTexts(value, ['receiptName', 'receiptUrl']) || !optional(value.receiptType, entry => memberOf(entry, ['PDF', 'JPG', 'PNG']))
    || !optional(value.receiptItems, entry => Array.isArray(entry) && entry.every(validReceiptItem))) return false

  const expense = value as unknown as Expense
  if (!unique(expense.shares, share => share.roommateId)
    || expense.shares.reduce((sum, share) => sum + Math.round(share.amount * 100), 0) !== Math.round(expense.totalAmount * 100)
    || !expense.shares.every(share => share.roommateId === expense.payerId ? share.status === 'PLÁTCE' : share.status !== 'PLÁTCE')) return false
  const status = expense.shares.some(share => share.status === 'PO_SPLATNOSTI') ? 'PO_SPLATNOSTI'
    : expense.shares.some(share => share.status === 'DLUŽÍ') ? 'ČÁSTEČNĚ' : 'UHRAZENO'
  if (expense.status !== status) return false
  return !expense.receiptItems?.length || (unique(expense.receiptItems, item => item.id)
    && expense.receiptItems.reduce((sum, item) => sum + Math.round(item.price * 100) * item.qty, 0) === Math.round(expense.totalAmount * 100))
}

function validMeter(value: unknown): boolean {
  return record(value) && nonempty(value.id) && memberOf(value.type, meterTypes) && isoDate(value.date) && value.date <= DEMO_TODAY
    && nonnegative(value.value) && nonnegative(value.delta) && nonempty(value.recordedBy)
    && value.unit === (value.type === 'ELEKTŘINA' ? 'kWh' : 'm³') && optionalTexts(value, ['photoUrl', 'note'])
}

function validCartItem(value: unknown): boolean {
  return record(value) && nonempty(value.id) && nonempty(value.name) && memberOf(value.category, categories)
    && money(value.unitPrice) && value.unitPrice > 0 && integer(value.qty) && value.qty > 0
    && Number.isSafeInteger(Math.round(value.unitPrice * 100) * value.qty) && nonempty(value.addedBy) && nonempty(value.addedAt)
    && optional(value.isPurchased, entry => typeof entry === 'boolean')
    && optionalTexts(value, ['purchasedBy', 'purchasedByRoommateId', 'purchasedAt'])
}

function validSwap(value: unknown): boolean {
  return record(value) && ['id', 'targetRoommateId', 'targetRoommateName', 'requestedByRoommateId', 'requestedByRoommateName', 'createdAt'].every(key => nonempty(value[key]))
    && memberOf(value.status, swapStatuses) && optionalTexts(value, ['note'])
}

function validShift(value: unknown): boolean {
  return record(value) && ['id', 'weekLabel', 'taskTitle', 'roommateId', 'roommateName'].every(key => nonempty(value[key]))
    && integer(value.weekNumber) && value.weekNumber >= 1 && value.weekNumber <= 53 && integer(value.year)
    && isoDate(value.startDate) && isoDate(value.endDate) && value.startDate <= value.endDate && memberOf(value.taskKey, taskKeys)
    && typeof value.isCompleted === 'boolean' && optionalTexts(value, ['completedAt', 'completedBy', 'notes'])
    && optional(value.swapRequest, validSwap)
}

export function validStoredSlice(key: string, value: unknown): boolean {
  if (key === 'currentUserId') return text(value)
  if (key === 'sidebar_collapsed') return typeof value === 'boolean'
  if (key === 'settings') return validSettings(value)
  if (!Array.isArray(value)) return false
  switch (key) {
    case 'roommates':
      return value.length > 0 && value.every(validRoommate) && unique(value as Roommate[], row => row.id)
        && (value as Roommate[]).filter(row => row.role === 'Správce').length === 1
    case 'settlements': return value.every(validSettlement) && unique(value as DebtSettlement[], row => row.roommateId)
    case 'expenses': return value.every(validExpense) && unique(value as Expense[], row => row.id) && unique(value as Expense[], row => row.code)
    case 'meters': return value.every(validMeter) && unique(value as MeterReading[], row => row.id)
    case 'cartItems': return value.every(validCartItem) && unique(value as CartItem[], row => row.id)
    case 'cleaning_shifts': return value.every(validShift) && unique(value as CleaningShift[], row => row.id)
      && unique(value as CleaningShift[], row => `${row.weekNumber}-${row.taskKey}`)
    default: return false
  }
}

export function validStoredSnapshot(value: unknown): boolean {
  const keys = ['roommates', 'currentUserId', 'settings', 'settlements', 'expenses', 'meters', 'cartItems', 'cleaning_shifts', 'sidebar_collapsed']
  if (!record(value) || !keys.every(key => validStoredSlice(key, value[key]))) return false
  const people = value.roommates as Roommate[]
  const expenses = value.expenses as Expense[]
  const settlements = value.settlements as DebtSettlement[]
  const shifts = value.cleaning_shifts as CleaningShift[]
  const manager = people.find(person => person.role === 'Správce')!
  const personMatches = (id: string, name: string): boolean => people.some(person => person.id === id && person.name === name)
  const validPersonName = (name: string): boolean => people.some(person => person.name === name)

  if (settlements.length !== people.length - 1
    || !settlements.every(row => row.roommateId !== manager.id && personMatches(row.roommateId, row.roommateName))
    || !expenses.every(expense => personMatches(expense.payerId, expense.payerName)
      && validPersonName(expense.audit.createdBy) && expense.shares.every(share => personMatches(share.roommateId, share.roommateName)
        && (!share.payment || people.some(person => person.id === share.payment?.recordedBy))))) return false

  for (const settlement of settlements) {
    const buckets = { rent: 0, energy: 0, drogerie: 0, other: 0 }
    for (const expense of expenses) {
      if (expense.payerId !== manager.id) continue
      const share = expense.shares.find(row => row.roommateId === settlement.roommateId)
      if (!share || (share.status !== 'DLUŽÍ' && share.status !== 'PO_SPLATNOSTI')) continue
      const bucket = expense.category === 'Bydlení' ? 'rent' : expense.category === 'Energie' ? 'energy'
        : expense.category === 'Drogerie' ? 'drogerie' : 'other'
      buckets[bucket] += Math.round(share.amount * 100)
    }
    if (!Object.entries(buckets).every(([key, cents]) => cents === Math.round((settlement.breakdown[key as keyof typeof settlement.breakdown] ?? 0) * 100))
      || (settlement.breakdown.wifi ?? 0) !== 0) return false
  }

  if (!(value.cartItems as CartItem[]).every(item => validPersonName(item.addedBy)
    && (!item.purchasedBy || validPersonName(item.purchasedBy))
    && (!item.purchasedByRoommateId || personMatches(item.purchasedByRoommateId, item.purchasedBy ?? '')))) return false

  if (!shifts.every(shift => personMatches(shift.roommateId, shift.roommateName)
    && (!shift.completedBy || validPersonName(shift.completedBy))
    && (!shift.swapRequest || (personMatches(shift.swapRequest.targetRoommateId, shift.swapRequest.targetRoommateName)
      && personMatches(shift.swapRequest.requestedByRoommateId, shift.swapRequest.requestedByRoommateName)
      && shift.swapRequest.targetRoommateId !== shift.swapRequest.requestedByRoommateId
      && (shift.swapRequest.status !== 'PENDING' || (!shift.isCompleted && shift.roommateId !== shift.swapRequest.targetRoommateId))
      && (shift.swapRequest.status !== 'ACCEPTED' || shift.roommateId === shift.swapRequest.targetRoommateId))))) return false

  const meters = value.meters as MeterReading[]
  if (!meters.every(meter => validPersonName(meter.recordedBy))) return false
  for (const type of meterTypes) {
    // An unchanged same-day counter can be recorded again; its zero delta follows
    // the first reading at that value, regardless of newest-first storage order.
    const readings = meters.filter(meter => meter.type === type).sort((a, b) => a.date.localeCompare(b.date) || a.value - b.value || b.delta - a.delta)
    for (let i = 1; i < readings.length; i++) {
      const previous = readings[i - 1]
      const current = readings[i]
      if (current.value < previous.value || Math.abs(current.delta - (current.value - previous.value)) > 0.000001) return false
    }
  }
  return true
}
