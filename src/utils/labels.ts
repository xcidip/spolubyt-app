import type {
  DebtSettlement,
  Expense,
  ExpenseShare,
  PageId,
  ExpenseCategory,
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

export const NAV_ITEMS = [
  { id: 'DASH', labelKey: 'nav.dashboard', label: 'Nástěnka' },
  { id: 'EXPENSES', labelKey: 'nav.expenses', label: 'Výdaje' },
  { id: 'SETTLEMENT', labelKey: 'nav.settlement', label: 'Vyrovnání' },
  { id: 'ENERGY', labelKey: 'nav.energy', label: 'Energie' },
  { id: 'CART', labelKey: 'nav.cart', label: 'Košík' },
  { id: 'CLEANING', labelKey: 'nav.cleaning', label: 'Úklid' },
  { id: 'SETTINGS', labelKey: 'nav.settings', label: 'Nastavení' },
] as const satisfies readonly { id: PageId; labelKey: string; label: string }[]


export const EXPENSE_BADGE_CLASSES: Record<Expense['status'], string> = {
  UHRAZENO: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  ČÁSTEČNĚ: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  PO_SPLATNOSTI: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
}

export const SETTLEMENT_BADGE_CLASSES: Record<DebtSettlement['status'], string> = {
  VYROVNÁNO: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  PŘED_SPLATNOSTÍ: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  PO_SPLATNOSTI: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
}

export const EXPENSE_SHARE_BADGE_CLASSES: Record<ExpenseShare['status'], string> = {
  PLÁTCE: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  UHRAZENO: EXPENSE_BADGE_CLASSES.UHRAZENO,
  DLUŽÍ: EXPENSE_BADGE_CLASSES.ČÁSTEČNĚ,
  PO_SPLATNOSTI: EXPENSE_BADGE_CLASSES.PO_SPLATNOSTI,
}

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  Bydlení: 'Bydlení', Energie: 'Energie', Drogerie: 'Drogerie',
  Služby: 'Služby', Údržba: 'Údržba', Jídlo: 'Jídlo',
}
