export type PageId = 'DASH' | 'EXPENSES' | 'SETTLEMENT' | 'ENERGY' | 'SETTINGS' | 'CART' | 'CLEANING'

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
  isPurchased?: boolean
  purchasedBy?: string
  purchasedAt?: string
}

export interface ExpensePrefillData {
  title?: string
  totalAmount?: number
  category?: ExpenseCategory
  cartItemId?: string
  items?: Array<{ id: string; name: string; price: number; qty: number }>
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

export type CleaningTaskKey = 'KITCHEN' | 'BATHROOM' | 'CORRIDOR' | 'TRASH'

export interface CleaningTaskDef {
  key: CleaningTaskKey
  title: string
  shortTitle: string
  description: string
  subtasks: string[]
  icon: string
  color: string
}

export interface ShiftSwapRequest {
  id: string
  targetRoommateId: string
  targetRoommateName: string
  requestedByRoommateId: string
  requestedByRoommateName: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED'
  createdAt: string
  note?: string
}

export interface CleaningShift {
  id: string
  weekNumber: number
  year: number
  weekLabel: string
  startDate: string
  endDate: string
  taskKey: CleaningTaskKey
  taskTitle: string
  roommateId: string
  roommateName: string
  isCompleted: boolean
  completedAt?: string
  completedBy?: string
  notes?: string
  swapRequest?: ShiftSwapRequest
}

export interface EnergyPrediction {
  annualAdvances: number
  projectedAnnualCost: number
  netDelta: number // positive = surplus, negative = deficit
  isSurplus: boolean
  formattedDelta: string // e.g. "+1 450 CZK" or "-850 CZK"
  drawdownPct: number
  riskLevel: 'Nízké riziko' | 'Mírné překročení' | 'Vysoké riziko'
}

