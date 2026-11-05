export type PageId = 'DASH' | 'EXPENSES' | 'SETTLEMENT' | 'ENERGY' | 'SETTINGS' | 'CART'

export type ExpenseCategory = 
  | 'Bydlení'
  | 'Energie'
  | 'Drogerie'
  | 'Služby'
  | 'Údržba'
  | 'Jídlo'

export type CalculationKey = 'EQUAL' | 'BY_AREA' | 'CUSTOM'

export interface Roommate {
  id: string
  name: string
  role: 'Správce' | 'Člen'
  email: string
  phone: string
  roomName: string
  roomAreaM2: number
  areaSharePct: number
  avatarColor: string
  avatarInitial: string
  bankAccount?: string
  iban?: string
}

export interface ExpenseShare {
  roommateId: string
  roommateName: string
  amount: number
  status: 'UHRAZENO' | 'DLUŽÍ' | 'PO_SPLATNOSTI' | 'PLÁTCE'
  settledDate?: string
}

export interface ReceiptItem {
  id: string
  name: string
  price: number
  qty: number
}

export interface Expense {
  id: string
  code: string
  title: string
  category: ExpenseCategory
  payerId: string
  payerName: string
  date: string
  totalAmount: number
  calculationKey: CalculationKey
  shares: ExpenseShare[]
  receiptName?: string
  receiptType?: 'PDF' | 'JPG' | 'PNG'
  receiptUrl?: string
  receiptItems?: ReceiptItem[]
  audit: {
    createdBy: string
    createdAt: string
  }
  status: 'UHRAZENO' | 'ČÁSTEČNĚ' | 'PO_SPLATNOSTI'
}

export interface DebtSettlement {
  roommateId: string
  roommateName: string
  roomName: string
  roomAreaM2: number
  areaSharePct: number
  totalDebt: number
  breakdown: {
    rent: number
    energy: number
    drogerie?: number
    wifi?: number
    other?: number
  }
  dueDate: string
  daysOverdue: number
  status: 'PŘED_SPLATNOSTÍ' | 'PO_SPLATNOSTI' | 'VYROVNÁNO'
  lastReminderSent?: string
}

export type MeterType = 'ELEKTŘINA' | 'PLYN' | 'STUDENÁ_VODA' | 'TEPLÁ_VODA'

export interface MeterReading {
  id: string
  type: MeterType
  date: string
  value: number
  unit: string
  delta: number
  recordedBy: string
  photoUrl?: string
  note?: string
}

export interface CartItem {
  id: string
  name: string
  category: ExpenseCategory
  unitPrice: number
  qty: number
  addedBy: string
  addedAt: string
}

export interface ApartmentSettings {
  name: string
  address: string
  accountNumber: string
  iban: string
  monthlyRent: number
  monthlyUtilities: number
  dueDayOfMonth: number
  rules: {
    rentKey: 'BY_AREA' | 'EQUAL'
    energyKey: 'EQUAL' | 'BY_AREA'
    suppliesKey: 'EQUAL'
  }
}

export interface ToastNotification {
  id: string
  title: string
  message: string
  type: 'success' | 'warning' | 'error' | 'info'
  timestamp: number
  duration?: number
}
