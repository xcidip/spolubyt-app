import type {
  DebtSettlement,
  Expense,
  ExpenseShare,
  MeterType
} from '../types'

export const EXPENSE_STATUS_LABELS: Record<Expense['status'], string> = {
  UHRAZENO: 'Uhrazeno',
  ČÁSTEČNĚ: 'Částečně',
  PO_SPLATNOSTI: 'Po splatnosti'
}

export const EXPENSE_SHARE_STATUS_LABELS: Record<ExpenseShare['status'], string> = {
  UHRAZENO: 'Uhrazeno',
  DLUŽÍ: 'Dluh',
  PO_SPLATNOSTI: 'Po splatnosti',
  PLÁTCE: 'Plátce'
}

export const SETTLEMENT_STATUS_LABELS: Record<DebtSettlement['status'], string> = {
  PŘED_SPLATNOSTÍ: 'Před splatností',
  PO_SPLATNOSTI: 'Po splatnosti',
  VYROVNÁNO: 'Vyrovnáno'
}

export const METER_TYPE_LABELS: Record<MeterType, string> = {
  ELEKTŘINA: 'Elektřina',
  PLYN: 'Plyn',
  STUDENÁ_VODA: 'Studená voda',
  TEPLÁ_VODA: 'Teplá voda'
}