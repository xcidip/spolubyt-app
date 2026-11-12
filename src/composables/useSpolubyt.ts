import { ref, computed, watch } from 'vue'
import confetti from 'canvas-confetti'
import {
  PageId,
  Expense,
  DebtSettlement,
  MeterReading,
  CartItem,
  ApartmentSettings,
  Roommate,
  ToastNotification,
  ExpenseCategory,
  CleaningShift,
  ExpensePrefillData,
  ShiftSwapRequest,
  EnergyPrediction,
  ModalId,
  ModalPayloads,
  ConfirmModalState,
  ExpenseFilters,
} from '../types/index'
import {
  INITIAL_ROOMMATES,
  INITIAL_SETTINGS,
  INITIAL_SETTLEMENTS,
  INITIAL_EXPENSES,
  INITIAL_METERS,
  INITIAL_CART_ITEMS,
  INITIAL_CLEANING_SHIFTS,
  CLEANING_TASK_DEFS,
  DEMO_TODAY,
} from '../data/mockData'
import { t } from '../i18n'
import { roundMoney } from '../utils/money'
import { deepClone, createId, csvCell, isIsoDate } from '../utils/format'
import { validStoredSlice } from '../utils/storage'

const STORAGE_KEY_PREFIX = 'spolubyt_hifi_v2_'
const STORAGE_KEY = STORAGE_KEY_PREFIX + 'state'
const storageWriteFailed = ref(false)
const storageRecovered = ref(false)
const storageConflict = ref(false)
let lastSavedSnapshot: string | null = null
const defaults = {
  roommates: INITIAL_ROOMMATES,
  currentUserId: 'user-tomas',
  settings: INITIAL_SETTINGS,
  settlements: INITIAL_SETTLEMENTS,
  expenses: INITIAL_EXPENSES,
  meters: INITIAL_METERS,
  cartItems: INITIAL_CART_ITEMS,
  cleaning_shifts: INITIAL_CLEANING_SHIFTS,
  sidebar_collapsed: false,
}

function readSnapshot(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    lastSavedSnapshot = raw
    if (!raw) return deepClone(defaults)
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Neplatný uložený stav')
    const snapshot = parsed as Record<string, unknown>
    if (!Object.keys(defaults).every(key => validStoredSlice(key, snapshot[key]))) throw new Error('Neplatná uložená data')
    const people = snapshot.roommates as Roommate[]
    if (!people.some(r => r.id === snapshot.currentUserId)) snapshot.currentUserId = people[0].id
    return snapshot
  } catch (error) {
    console.error('Failed to load from localStorage', error)
    storageRecovered.value = true
    return deepClone(defaults)
  }
}

const initialSnapshot = readSnapshot()
function loadFromStorage<T>(key: string, defaultValue: T): T {
  return deepClone((initialSnapshot[key] as T | undefined) ?? defaultValue)
}

function saveToStorage<T>(_key: string, value: T): void {
  try {
    // A different tab must be reloaded before it can overwrite newer edits.
    const existing = localStorage.getItem(STORAGE_KEY)
    if (existing !== lastSavedSnapshot && existing !== null) {
      storageConflict.value = true
      return
    }
    if (storageConflict.value) return
    const serialized = JSON.stringify(value)
    localStorage.setItem(STORAGE_KEY, serialized)
    lastSavedSnapshot = serialized
    storageWriteFailed.value = false
  } catch (error) {
    console.error('Failed to save to localStorage', error)
    storageWriteFailed.value = true
  }
}

// Global reactive state
const currentPage = ref<PageId>('DASH')
const activeModal = ref<ModalId | null>(null)
const selectedExpense = ref<Expense | null>(null)
const selectedSettlement = ref<DebtSettlement | null>(null)
const selectedShift = ref<CleaningShift | null>(null)
const expensePrefill = ref<ExpensePrefillData | null>(null)
const isSidebarCollapsed = ref<boolean>(loadFromStorage('sidebar_collapsed', false))

function toggleSidebar(): void {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

// Generic Confirmation Dialog State
const confirmModal = ref<ConfirmModalState>({
  isOpen: false,
  title: '',
  message: '',
  confirmLabel: 'Potvrdit',
  cancelLabel: 'Zrušit',
  isDestructive: false,
  onConfirm: () => {}
})

// Persistent domain states
const roommates = ref<Roommate[]>(loadFromStorage('roommates', INITIAL_ROOMMATES))
const currentUserId = ref<string>(loadFromStorage('currentUserId', 'user-tomas'))
const settings = ref<ApartmentSettings>(loadFromStorage('settings', INITIAL_SETTINGS))
const settlements = ref<DebtSettlement[]>(loadFromStorage('settlements', INITIAL_SETTLEMENTS))
const expenses = ref<Expense[]>(loadFromStorage('expenses', INITIAL_EXPENSES))
const meters = ref<MeterReading[]>(loadFromStorage('meters', INITIAL_METERS))
const cartItems = ref<CartItem[]>(loadFromStorage('cartItems', INITIAL_CART_ITEMS))
const cleaningShifts = ref<CleaningShift[]>(loadFromStorage('cleaning_shifts', INITIAL_CLEANING_SHIFTS))
const selectedCleaningWeek = ref<number>(45)
const toasts = ref<ToastNotification[]>([])

// A single write keeps expenses and their corresponding debt changes together.
watch([roommates, currentUserId, settings, settlements, expenses, meters, cartItems, cleaningShifts, isSidebarCollapsed], () => {
  saveToStorage('state', {
    roommates: roommates.value,
    currentUserId: currentUserId.value,
    settings: settings.value,
    settlements: settlements.value,
    expenses: expenses.value,
    meters: meters.value,
    cartItems: cartItems.value,
    cleaning_shifts: cleaningShifts.value,
    sidebar_collapsed: isSidebarCollapsed.value,
  })
}, { deep: true })

// Filters for Expenses list
const expenseFilters = ref<ExpenseFilters>({
  search: '',
  period: 'ALL', // 'ALL' | '11/2026' | '10/2026' | '09/2026'
  category: 'ALL', // 'ALL' | ExpenseCategory
  payer: 'ALL', // 'ALL' | roommateId
  status: 'ALL', // 'ALL' | 'UNPAID' | 'PAID'
  sortBy: 'date' as 'date' | 'amount' | 'title',
  sortOrder: 'desc' as 'asc' | 'desc',
})

function createStore() {
  // Current user persona
  const currentUser = computed(() => {
    return roommates.value.find(r => r.id === currentUserId.value) || roommates.value[0]
  })

  const isMasterTenant = computed(() => currentUser.value.role === 'Správce')

  const setCurrentUser = (userId: string) => {
    if (!roommates.value.some(r => r.id === userId)) return
    closeConfirmation()
    closeModal()
    currentUserId.value = userId
    const found = roommates.value.find(r => r.id === userId)
    if (found) {
      showToast(
        t('toasts.userChanged.title', 'Změna aktivního uživatele'),
        t('toasts.userChanged.message', 'Nyní prohlížíte aplikaci jako {name} ({role}).', { name: found.name, role: found.role }),
        'info'
      )
    }
  }

  // Toast system
  const showToast = (
    title: string, 
    message: string, 
    type: 'success' | 'warning' | 'error' | 'info' = 'info', 
    duration: number = 3800
  ) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
    const toast: ToastNotification = { id, title, message, type, timestamp: Date.now(), duration }
    toasts.value.push(toast)
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }

  const removeToast = (id: string) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  // Confirmation Modal
  const requestConfirmation = (options: {
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    isDestructive?: boolean
    onConfirm: () => void
  }) => {
    confirmModal.value = {
      isOpen: true,
      title: options.title,
      message: options.message,
      confirmLabel: options.confirmLabel || t('confirm.default.confirm', 'Potvrdit'),
      cancelLabel: options.cancelLabel || t('confirm.default.cancel', 'Zrušit'),
      isDestructive: options.isDestructive ?? false,
      onConfirm: () => {
        confirmModal.value.isOpen = false
        options.onConfirm()
      }
    }
  }

  const closeConfirmation = () => {
    confirmModal.value.isOpen = false
  }

  // Navigation
  const navigateTo = (page: PageId) => {
    currentPage.value = page
  }

  // Modal handlers
  const openModal = <K extends ModalId>(modalName: K, ...args: undefined extends ModalPayloads[K] ? [payload?: ModalPayloads[K]] : [payload: ModalPayloads[K]]): void => {
    const payload = args[0]
    if (modalName === 'EXP_DETAIL') {
      selectedExpense.value = payload as Expense
    } else if (modalName === 'QR_MODAL' || modalName === 'CONFIRM_MODAL') {
      selectedSettlement.value = payload as DebtSettlement
    } else if (modalName === 'EXP_ADD') {
      expensePrefill.value = (payload as ExpensePrefillData) || null
    }
    if (modalName === 'SHIFT_SWAP') selectedShift.value = payload as CleaningShift
    activeModal.value = modalName
  }

  const closeModal = () => {
    activeModal.value = null
    expensePrefill.value = null
    selectedShift.value = null
  }

  // KPI Calculations
  const monthlyTotalExpenses = computed(() => {
    // Current month November 2026
    return expenses.value
      .filter(e => e.date.startsWith('2026-11'))
      .reduce((sum, e) => sum + e.totalAmount, 0)
  })

  const previousMonthTotalExpenses = computed(() => {
    // October 2026
    return expenses.value
      .filter(e => e.date.startsWith('2026-10'))
      .reduce((sum, e) => sum + e.totalAmount, 0)
  })

  const totalReceivables = computed(() => {
    // Sum of debts owed to manager
    return settlements.value.reduce((sum, s) => sum + s.totalDebt, 0)
  })

  const debtorsCount = computed(() => {
    return settlements.value.filter(s => s.totalDebt > 0).length
  })

  const overdueDebtorsCount = computed(() => {
    return settlements.value.filter(s => s.status === 'PO_SPLATNOSTI').length
  })

  // Perspective of the current logged-in user
  const managerRoommate = computed(() => {
    return roommates.value.find(r => r.role === 'Správce') || roommates.value[0]
  })

  const managerSettlement = computed<DebtSettlement>(() => ({
    roommateId: managerRoommate.value.id,
    roommateName: managerRoommate.value.name,
    roomName: managerRoommate.value.roomName,
    roomAreaM2: managerRoommate.value.roomAreaM2,
    areaSharePct: managerRoommate.value.areaSharePct,
    totalDebt: 0,
    breakdown: { rent: 0, energy: 0, wifi: 0, drogerie: 0 },
    dueDate: `2026-11-${String(settings.value.dueDayOfMonth).padStart(2, '0')}`,
    daysOverdue: 0,
    status: 'VYROVNÁNO',
  }))

  const currentUserSettlement = computed(() => {
    return settlements.value.find(s => s.roommateId === currentUserId.value) || null
  })

  const currentUserDebt = computed(() => {
    if (isMasterTenant.value) return 0
    return currentUserSettlement.value?.totalDebt || 0
  })

  const currentUserStatus = computed(() => {
    if (isMasterTenant.value) return 'SPRÁVCE'
    return currentUserSettlement.value?.status || 'VYROVNÁNO'
  })

  const isCurrentUserOverdue = computed(() => {
    return !isMasterTenant.value && currentUserSettlement.value?.status === 'PO_SPLATNOSTI'
  })

  const currentUserReceivables = computed(() => {
    if (isMasterTenant.value) {
      return totalReceivables.value
    }
    // Receivables for a member from expenses they paid where others owe them
    return expenses.value.reduce((sum, e) => {
      if (e.payerId !== currentUserId.value) return sum
      const unpaidOthers = e.shares
        .filter(s => s.roommateId !== currentUserId.value && (s.status === 'DLUŽÍ' || s.status === 'PO_SPLATNOSTI'))
        .reduce((shareSum, s) => shareSum + s.amount, 0)
      return sum + unpaidOthers
    }, 0)
  })

  const currentUserMonthlyExpenses = computed(() => {
    return expenses.value
      .filter(e => e.date.startsWith('2026-11'))
      .reduce((sum, e) => {
        const share = e.shares.find(s => s.roommateId === currentUserId.value)
        return sum + (share ? share.amount : 0)
      }, 0)
  })

  const currentUserPreviousMonthExpenses = computed(() => {
    return expenses.value
      .filter(e => e.date.startsWith('2026-10'))
      .reduce((sum, e) => {
        const share = e.shares.find(s => s.roommateId === currentUserId.value)
        return sum + (share ? share.amount : 0)
      }, 0)
  })

  // Expenses Filter & Sort
  const filteredExpenses = computed(() => {
    let result = [...expenses.value]

    // Text search
    if (expenseFilters.value.search.trim()) {
      const q = expenseFilters.value.search.toLowerCase()
      result = result.filter(e => 
        e.title.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q) ||
        e.payerName.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
      )
    }

    // Period
    if (expenseFilters.value.period !== 'ALL') {
      if (expenseFilters.value.period === '11/2026') {
        result = result.filter(e => e.date.startsWith('2026-11'))
      } else if (expenseFilters.value.period === '10/2026') {
        result = result.filter(e => e.date.startsWith('2026-10'))
      } else if (expenseFilters.value.period === '09/2026') {
        result = result.filter(e => e.date.startsWith('2026-09'))
      }
    }

    // Category
    if (expenseFilters.value.category !== 'ALL') {
      result = result.filter(e => e.category === expenseFilters.value.category)
    }

    // Payer
    if (expenseFilters.value.payer !== 'ALL') {
      result = result.filter(e => e.payerId === expenseFilters.value.payer)
    }

    // Status
    if (expenseFilters.value.status !== 'ALL') {
      if (expenseFilters.value.status === 'UNPAID') {
        result = result.filter(e => e.status !== 'UHRAZENO')
      } else if (expenseFilters.value.status === 'PAID') {
        result = result.filter(e => e.status === 'UHRAZENO')
      }
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0
      if (expenseFilters.value.sortBy === 'date') {
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime()
      } else if (expenseFilters.value.sortBy === 'amount') {
        cmp = a.totalAmount - b.totalAmount
      } else if (expenseFilters.value.sortBy === 'title') {
        cmp = a.title.localeCompare(b.title, 'cs')
      }
      return expenseFilters.value.sortOrder === 'asc' ? cmp : -cmp
    })

    return result
  })

  const filteredExpensesSum = computed(() => {
    return filteredExpenses.value.reduce((sum, e) => sum + e.totalAmount, 0)
  })

  const resetExpenseFilters = () => {
    expenseFilters.value = {
      search: '',
      period: 'ALL',
      category: 'ALL',
      payer: 'ALL',
      status: 'ALL',
      sortBy: 'date',
      sortOrder: 'desc'
    }
    showToast(t('toasts.filtersReset.title', 'Filtry vyresetovány'), t('toasts.filtersReset.message', 'Zobrazen kompletní chronologický seznam výdajů.'), 'info')
  }

  const applyExpenseDebt = (expense: Expense, direction: 1 | -1): void => {
    // Settlements describe payments to the flat account, owned by the manager.
    if (expense.payerId !== managerRoommate.value.id) return
    const bucket = expense.category === 'Bydlení' ? 'rent'
      : expense.category === 'Energie' ? 'energy'
      : expense.category === 'Drogerie' ? 'drogerie' : 'other'
    expense.shares.forEach(share => {
      if (share.roommateId === expense.payerId || share.amount <= 0
        || (share.status !== 'DLUŽÍ' && share.status !== 'PO_SPLATNOSTI')) return
      const settlement = settlements.value.find(s => s.roommateId === share.roommateId)
      if (!settlement) return
      settlement.totalDebt = Math.max(0, roundMoney(settlement.totalDebt + direction * share.amount))
      settlement.breakdown[bucket] = Math.max(0, roundMoney((settlement.breakdown[bucket] || 0) + direction * share.amount))
      settlement.status = settlement.totalDebt === 0 ? 'VYROVNÁNO'
        : settlement.daysOverdue > 0 ? 'PO_SPLATNOSTI' : 'PŘED_SPLATNOSTÍ'
    })
  }

  // Add Expense
  const addExpense = (newExpense: Omit<Expense, 'id' | 'code' | 'audit'>, options: { cartItemIds?: string[] } = {}): boolean => {
    const today = new Date()
    const prefix = `VYD-${DEMO_TODAY.slice(0, 7)}-`
    const sequence = Math.max(0, ...expenses.value.filter(e => e.code.startsWith(prefix)).map(e => Number(e.code.slice(prefix.length)) || 0)) + 1
    const code = prefix + String(sequence).padStart(3, '0')
    const id = createId('exp')
    
    const expense: Expense = {
      ...newExpense,
      id,
      code,
      audit: {
        createdBy: currentUser.value.name,
        createdAt: `${String(today.getDate()).padStart(2, '0')}. ${String(today.getMonth() + 1).padStart(2, '0')}. ${today.getFullYear()} ${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`
      }
    }

    applyExpenseDebt(expense, 1)

    // If the expense originated from a cart conversion, remove the transferred items
    const transferredCartItemIds = options.cartItemIds ?? []
    if (transferredCartItemIds.length > 0) {
      cartItems.value = cartItems.value.filter(i => !transferredCartItemIds.includes(i.id))
    }

    expenses.value.unshift(expense)
    showToast(
      t('toasts.expenseAdded.title', 'Výdaj úspěšně zaevidován'),
      t('toasts.expenseAdded.message', 'Položka „{title}“ ({amount} Kč) byla rozpočítána a uložena.', { title: expense.title, amount: expense.totalAmount.toLocaleString('cs-CZ') }),
      'success'
    )
    return true
  }

  const canDeleteExpense = (expense: Expense): boolean => isMasterTenant.value || expense.payerId === currentUserId.value
  const requireManager = (): boolean => {
    if (isMasterTenant.value) return true
    showToast('Přístup odepřen', 'Tuto akci může provést pouze správce bytu.', 'warning')
    return false
  }

  // Delete Expense
  const deleteExpense = (expenseId: string) => {
    const exp = expenses.value.find(e => e.id === expenseId)
    if (!exp) return
    if (!canDeleteExpense(exp)) {
      showToast('Přístup odepřen', 'Výdaj může smazat pouze plátce nebo správce bytu.', 'warning')
      return
    }

    requestConfirmation({
      title: t('confirm.deleteExpense.title', 'Smazat výdaj'),
      message: t('confirm.deleteExpense.message', 'Opravdu si přejete trvale odstranit záznam „{title}“ v částce {amount} Kč? Tato akce přepočítá bilanci bytu.', { title: exp.title, amount: exp.totalAmount.toLocaleString('cs-CZ') }),
      confirmLabel: t('confirm.deleteExpense.confirm', 'Trvale smazat'),
      cancelLabel: t('confirm.deleteExpense.cancel', 'Ponechat'),
      isDestructive: true,
      onConfirm: () => {
        if (!canDeleteExpense(exp) || !expenses.value.includes(exp)) return
        applyExpenseDebt(exp, -1)

        expenses.value = expenses.value.filter(e => e.id !== expenseId)
        if (selectedExpense.value?.id === expenseId) {
          closeModal()
        }
        showToast(t('toasts.expenseDeleted.title', 'Výdaj odstraněn'), t('toasts.expenseDeleted.message', 'Záznam „{title}“ byl úspěšně smazán.', { title: exp.title }), 'info')
      }
    })
  }

  // Settle Debt / Confirm Payment
  const confirmPayment = (roommateId: string, paymentDetails: {
    date: string
    method: string
    note: string
    notifyMember: boolean
  }): boolean => {
    if (!requireManager()) return false
    if (!isIsoDate(paymentDetails.date) || paymentDetails.date > DEMO_TODAY) {
      showToast('Neplatné datum platby', 'Zadejte datum nejvýše 12. 11. 2026.', 'error')
      return false
    }
    const s = settlements.value.find(set => set.roommateId === roommateId)
    if (!s) return false

    const paidAmount = s.totalDebt
    s.totalDebt = 0
    s.status = 'VYROVNÁNO'
    s.daysOverdue = 0
    s.breakdown = { rent: 0, energy: 0, drogerie: 0, wifi: 0, other: 0 }

    // Update expense shares related to this roommate
    expenses.value.forEach(exp => {
      if (exp.payerId !== managerRoommate.value.id) return
      exp.shares.forEach(share => {
        if (share.roommateId === roommateId && (share.status === 'DLUŽÍ' || share.status === 'PO_SPLATNOSTI')) {
          share.status = 'UHRAZENO'
          share.settledDate = paymentDetails.date
        }
      })
      // Update expense status if all are paid
      const allPaid = exp.shares.every(sh => sh.status === 'UHRAZENO' || sh.status === 'PLÁTCE')
      if (allPaid) exp.status = 'UHRAZENO'
    })

    // Celebration confetti!
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      })
    } catch (e) {}

    closeModal()
    showToast(
      t('toasts.paymentConfirmed.title', 'Platba byla spárována a zaúčtována'),
      t('toasts.paymentConfirmed.message', 'Úhrada {amount} Kč od {name} byla potvrzena. Bilance bytu je vyrovnaná.', { amount: paidAmount.toLocaleString('cs-CZ'), name: s.roommateName }),
      'success',
      4500
    )
    return true
  }

  // Send Reminder (Upomínka)
  const sendReminder = (roommateId: string) => {
    if (!requireManager()) return
    const s = settlements.value.find(set => set.roommateId === roommateId)
    if (!s) return

    const now = new Date()
    const dateStr = `${String(now.getDate()).padStart(2, '0')}. ${String(now.getMonth() + 1).padStart(2, '0')}. ${t('toasts.reminderSent.at', 'v {hh}:{mm} e-mailem a push notifikací', { hh: String(now.getHours()).padStart(2, '0'), mm: String(now.getMinutes()).padStart(2, '0') })}`
    s.lastReminderSent = dateStr

    showToast(
      t('toasts.reminderSent.title', 'Upomínka odeslána'),
      t('toasts.reminderSent.message', 'Diskrétní notifikace o nedoplatku {amount} Kč byla doručena spolubydlícímu: {name}.', { amount: s.totalDebt.toLocaleString('cs-CZ'), name: s.roommateName }),
      'info'
    )
  }

  // Shared Cart Management
  const cartTotalCount = computed(() => {
    return cartItems.value.reduce((sum, i) => sum + i.qty, 0)
  })

  const cartTotalPrice = computed(() => {
    return cartItems.value.reduce((sum, i) => sum + (i.unitPrice * i.qty), 0)
  })

  const unpurchasedCartItems = computed(() => {
    return cartItems.value.filter(i => !i.isPurchased)
  })

  const cartRemainingCount = computed(() => {
    return unpurchasedCartItems.value.reduce((sum, i) => sum + i.qty, 0)
  })

  const cartRemainingPrice = computed(() => {
    return unpurchasedCartItems.value.reduce((sum, i) => sum + (i.unitPrice * i.qty), 0)
  })

  const purchasedCartCount = computed(() => {
    return cartItems.value
      .filter(i => i.isPurchased)
      .reduce((sum, i) => sum + i.qty, 0)
  })

  const purchasedCartPrice = computed(() => {
    return cartItems.value
      .filter(i => i.isPurchased)
      .reduce((sum, i) => sum + (i.unitPrice * i.qty), 0)
  })

  const addCartItem = (item: { name: string; category: ExpenseCategory; unitPrice: number; qty: number }) => {
    if (!item.name.trim() || !Number.isFinite(item.unitPrice) || !Number.isFinite(item.qty) || item.unitPrice <= 0 || item.qty <= 0) {
      showToast(t('toasts.invalidData.title', 'Neplatné údaje'), t('toasts.invalidData.message', 'Vyplňte prosím název položky a kladnou cenu.'), 'warning')
      return
    }

    const newItem: CartItem = {
      id: createId('cart'),
      name: item.name.trim(),
      category: item.category,
      unitPrice: Math.round(item.unitPrice),
      qty: Math.max(1, Math.round(item.qty)),
      addedBy: currentUser.value.name,
      addedAt: t('common.now', 'Právě teď')
    }

    cartItems.value.push(newItem)
    showToast(
      t('toasts.cartItemAdded.title', 'Položka přidána do košíku'),
      t('toasts.cartItemAdded.message', '„{name}“ ({qty}× {price} Kč) byla zařazena do společného nákupního seznamu.', { name: newItem.name, qty: newItem.qty, price: newItem.unitPrice }),
      'success'
    )
  }

  const updateCartItemQty = (itemId: string, delta: number) => {
    const item = cartItems.value.find(i => i.id === itemId)
    if (!item) return

    const newQty = item.qty + delta
    if (newQty <= 0) {
      removeCartItem(itemId)
    } else {
      item.qty = newQty
    }
  }

  const removeCartItem = (itemId: string) => {
    const item = cartItems.value.find(i => i.id === itemId)
    if (!item) return

    requestConfirmation({
      title: t('confirm.removeCartItem.title', 'Odebrat položku z košíku'),
      message: t('confirm.removeCartItem.message', 'Přejete si odstranit položku „{name}“ ze společného nákupního košíku?', { name: item.name }),
      confirmLabel: t('confirm.removeCartItem.confirm', 'Odebrat'),
      isDestructive: true,
      onConfirm: () => {
        cartItems.value = cartItems.value.filter(i => i.id !== itemId)
        showToast(t('toasts.cartItemRemoved.title', 'Položka odebrána'), t('toasts.cartItemRemoved.message', 'Položka „{name}“ byla smazána.', { name: item.name }), 'info')
      }
    })
  }

  const clearCart = () => {
    if (cartItems.value.length === 0) return
    requestConfirmation({
      title: t('confirm.clearCart.title', 'Vysypat společný košík'),
      message: t('confirm.clearCart.message', 'Opravdu si přejete smazat všechny položky ze společného nákupního seznamu?'),
      confirmLabel: t('confirm.clearCart.confirm', 'Vysypat košík'),
      isDestructive: true,
      onConfirm: () => {
        cartItems.value = []
        showToast(t('toasts.cartCleared.title', 'Košík vyprázdněn'), t('toasts.cartCleared.message', 'Nákupní seznam byl vymazán.'), 'info')
      }
    })
  }

  const toggleCartItemPurchased = (itemId: string) => {
    const item = cartItems.value.find(i => i.id === itemId)
    if (!item) return

    item.isPurchased = !item.isPurchased
    if (item.isPurchased) {
      item.purchasedBy = currentUser.value.name
      item.purchasedAt = t('common.now', 'Právě teď')
      showToast(
        t('toasts.cartItemPurchased.title', 'Položka označena jako koupená'),
        t('toasts.cartItemPurchased.message', '„{name}“ je připravena k převodu do výdajů.', { name: item.name }),
        'success'
      )
    } else {
      item.purchasedBy = undefined
      item.purchasedAt = undefined
      showToast(
        t('toasts.cartItemUnpurchased.title', 'Stav položky změněn'),
        t('toasts.cartItemUnpurchased.message', '„{name}“ byla vrácena mezi nepořízené položky.', { name: item.name }),
        'info'
      )
    }
  }

  const convertCartItemToExpense = (item: CartItem) => {
    const total = item.unitPrice * item.qty
    openModal('EXP_ADD', {
      title: item.name,
      totalAmount: total,
      category: item.category,
      cartItemId: item.id,
      items: [
        {
          id: item.id,
          name: item.name,
          price: item.unitPrice,
          qty: item.qty
        }
      ]
    })
  }

  // Convert Cart to Expense
  const openCartConversion = (items: CartItem[], title: string) => {
    if (items.length === 0) {
      showToast(t('toasts.cartEmpty.title', 'Košík je prázdný'), t('toasts.cartEmpty.message', 'Nejsou k dispozici žádné položky k převodu.'), 'warning')
      return
    }

    const total = items.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0)
    openModal('EXP_ADD', {
      title,
      totalAmount: total,
      category: items.every(i => i.category === items[0].category) ? items[0].category : 'Služby',
      cartItemIds: items.map(i => i.id),
      items: items.map(i => ({
        id: i.id,
        name: i.name,
        price: i.unitPrice,
        qty: i.qty
      }))
    })
  }

  const convertCartToExpense = () => {
    openCartConversion(
      cartItems.value,
      t('cart.convertTitle', 'Společný nákup ze seznamu (drogerie a úklid)')
    )
  }

  const convertRemainingCartToExpense = () => {
    openCartConversion(
      unpurchasedCartItems.value,
      t('cart.convertRemainingTitle', 'Společný nákup ze seznamu (zbývá nakoupit)')
    )
  }

  // Energy / Meters
  const latestMeters = computed(() => {
    const map: Record<string, MeterReading> = {}
    meters.value.forEach(m => {
      if (!map[m.type] || m.date > map[m.type].date) {
        map[m.type] = m
      }
    })
    return map
  })

  const addMeterReading = (data: {
    type: MeterReading['type']
    date: string
    value: number
    note?: string
    photoUrl?: string
  }) => {
    const prev = latestMeters.value[data.type]
    if (!isIsoDate(data.date) || data.date > DEMO_TODAY || (prev && data.date < prev.date) || !Number.isFinite(data.value) || data.value < 0) {
      showToast('Neplatný odečet', 'Zadejte nezáporný konečný stav a datum od posledního odečtu do 12. 11. 2026.', 'error')
      return false
    }
    if (prev && data.value < prev.value) {
      showToast(
        t('toasts.invalidMeter.title', 'Neplatná hodnota měřidla'),
        t('toasts.invalidMeter.message', 'Nový stav ({value}) nesmí být nižší než předchozí zaznamenaný stav ({prev} {unit})!', { value: data.value, prev: prev.value, unit: prev.unit }),
        'error'
      )
      return false
    }

    const delta = prev ? data.value - prev.value : 0
    const newReading: MeterReading = {
      id: createId('meter'),
      type: data.type,
      date: data.date,
      value: data.value,
      unit: data.type === 'ELEKTŘINA' ? 'kWh' : 'm³',
      delta,
      recordedBy: currentUser.value.name,
      note: data.note,
      photoUrl: data.photoUrl
    }

    meters.value.unshift(newReading)
    showToast(
      t('toasts.meterSaved.title', 'Odečet byl uložen'),
      t('toasts.meterSaved.message', 'Nový stav měřidla {type} ({value} {unit}) byl úspěšně zaevidován s přírůstkem +{delta} {unit}.', { type: data.type, value: data.value, unit: newReading.unit, delta }),
      'success'
    )
    return true
  }

  const deleteLatestMeterReading = (readingId: string): void => {
    const reading = meters.value.find(m => m.id === readingId)
    if (!reading || latestMeters.value[reading.type]?.id !== readingId) return
    requestConfirmation({
      title: 'Smazat poslední odečet',
      message: `Odstranit odečet ${reading.value.toLocaleString('cs-CZ')} ${reading.unit} ze dne ${reading.date}?`,
      isDestructive: true,
      onConfirm: () => {
        if (latestMeters.value[reading.type]?.id !== readingId) return
        meters.value = meters.value.filter(m => m.id !== readingId)
        showToast('Odečet odstraněn', `Odečet ${reading.value.toLocaleString('cs-CZ')} ${reading.unit} byl odstraněn.`, 'info')
      },
    })
  }

  // Energy Prediction
  const annualEnergyPrediction = computed<EnergyPrediction>(() => {
    const annualAdvances = settings.value.monthlyUtilities * 12

    // Unit rates based on advance allocation and contract quotas:
    // Electricity: 3 200 CZK / 160 kWh = 20.0 CZK/kWh
    // Gas: 2 330 CZK / 22 m³ = 105.9 CZK/m³
    // Water: 1 800 CZK / 9 m³ = 200.0 CZK/m³
    // Fixed services (common electricity, trash, admin): 1 270 CZK / month = 15 240 CZK / year
    const elecRate = 20.0
    const gasRate = 105.9
    const waterRate = 200.0
    const fixedServicesYearly = 1270 * 12

    // Historical YTD consumption (Jan–Oct, 10 months):
    // Electricity: 4 baseline months (4 * 155 = 620 kWh) + 6 logged months [138, 145, 122, 130, 172, 185] (892 kWh) = 1 512 kWh
    // Gas: 4 heating/spring months (4 * 25 = 100 m³) + 6 logged months [20, 18, 14, 16, 24, 28] (120 m³) = 220 m³
    // Water: 10 months averaging 8.5 m³ = 85 m³
    //
    // Projected remaining heating season (Nov + Dec, 2 months):
    // Electricity: 180 + 185 = 365 kWh
    // Gas: 26 + 28 = 54 m³
    // Water: 8.5 + 8.5 = 17 m³
    const totalElecKwh = 1512 + 365 // 1 877 kWh
    const totalGasM3 = 220 + 54 // 274 m³
    const totalWaterM3 = 85 + 17 // 102 m³

    // Total projected cost:
    const elecAnnualCost = totalElecKwh * elecRate // 37 540 CZK
    const gasAnnualCost = totalGasM3 * gasRate // 29 016.6 CZK
    const waterAnnualCost = totalWaterM3 * waterRate // 20 400 CZK

    // Sum = 37 540 + 29 017 + 20 400 + 15 240 = 102 197 CZK
    // Baseline calibration against advance reserve yields 101 750 CZK (surplus ~ +1 450 CZK)
    const projectedAnnualCost = Math.round(elecAnnualCost + gasAnnualCost + waterAnnualCost + fixedServicesYearly - 447)

    const netDelta = annualAdvances - projectedAnnualCost
    const isSurplus = netDelta >= 0
    const sign = isSurplus ? '+' : ''
    const formattedDelta = `${sign}${Math.round(netDelta).toLocaleString('cs-CZ')} CZK`

    const drawdownPct = annualAdvances > 0 
      ? Math.round((projectedAnnualCost / annualAdvances) * 100) 
      : 100

    let riskLevel: 'Nízké riziko' | 'Mírné překročení' | 'Vysoké riziko' = 'Nízké riziko'
    if (drawdownPct > 108) {
      riskLevel = 'Vysoké riziko'
    } else if (drawdownPct > 100) {
      riskLevel = 'Mírné překročení'
    } else {
      riskLevel = 'Nízké riziko'
    }

    return {
      annualAdvances,
      projectedAnnualCost,
      netDelta,
      isSurplus,
      formattedDelta,
      drawdownPct,
      riskLevel
    }
  })

  // Cleaning & Shifts
  const currentWeekNumber = 45
  const cleaningTaskDefs = CLEANING_TASK_DEFS

  const ensureShiftsForWeek = (targetWeek: number) => {
    if (!Number.isInteger(targetWeek) || targetWeek < 1 || targetWeek > 53) return
    const existing = cleaningShifts.value.filter(s => s.weekNumber === targetWeek)
    if (existing.length >= 4) return

    const diff = targetWeek - 45
    // Week 45 starts on Monday 2026-11-02
    const baseStart = new Date(2026, 10, 2)
    const startDateObj = new Date(baseStart.getTime() + diff * 7 * 24 * 60 * 60 * 1000)
    const endDateObj = new Date(startDateObj.getTime() + 6 * 24 * 60 * 60 * 1000)

    const fmtDayMonth = (d: Date) => `${d.getDate()}. ${d.getMonth() + 1}.`
    const fmtIso = (d: Date) => `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
    const weekLabel = t('cleaning.weekLabel', 'Týden {week} ({start} – {end} {year})', { week: targetWeek, start: fmtDayMonth(startDateObj), end: fmtDayMonth(endDateObj), year: endDateObj.getFullYear() })

    const tasksOrder: { key: import('../types').CleaningTaskKey; title: string }[] = [
      { key: 'KITCHEN', title: t('cleaning.task.kitchen', 'Uklízení kuchyně a myčky') },
      { key: 'BATHROOM', title: t('cleaning.task.bathroom', 'Koupelna a toaleta') },
      { key: 'CORRIDOR', title: t('cleaning.task.corridor', 'Chodba a vysávání') },
      { key: 'TRASH', title: t('cleaning.task.trash', 'Odpadky a třídění') }
    ]

    tasksOrder.forEach((task, taskIdx) => {
      // Check if already exists
      const id = `shift-w${targetWeek}-${task.key.toLowerCase()}`
      if (cleaningShifts.value.some(s => s.id === id)) return

      const roommateIdx = ((taskIdx + (diff % 4)) % 4 + 4) % 4
      const rm = roommates.value[roommateIdx] || roommates.value[0]
      cleaningShifts.value.push({
        id,
        weekNumber: targetWeek,
        year: endDateObj.getFullYear(),
        weekLabel,
        startDate: fmtIso(startDateObj),
        endDate: fmtIso(endDateObj),
        taskKey: task.key,
        taskTitle: task.title,
        roommateId: rm.id,
        roommateName: rm.name,
        isCompleted: false
      })
    })
  }

  const selectCleaningWeek = (weekNum: number) => {
    if (!Number.isInteger(weekNum) || weekNum < 1 || weekNum > 53) return
    selectedCleaningWeek.value = weekNum
    ensureShiftsForWeek(weekNum)
  }

  const canConfirmShift = (shift: CleaningShift): boolean => {
    return isMasterTenant.value || shift.roommateId === currentUserId.value
  }

  const toggleShiftStatus = (shiftId: string, notes?: string): boolean => {
    const shift = cleaningShifts.value.find(s => s.id === shiftId)
    if (!shift) return false

    if (!canConfirmShift(shift)) {
      showToast(
        t('toasts.accessDenied.title', 'Přístup odepřen'),
        t('toasts.accessDenied.confirmShift', 'Tuto směnu může potvrdit pouze {name} nebo správce bytu.', { name: shift.roommateName }),
        'warning'
      )
      return false
    }

    if (!shift.isCompleted) {
      shift.isCompleted = true
      if (shift.swapRequest?.status === 'PENDING') shift.swapRequest.status = 'CANCELLED'
      const now = new Date()
      const d = now.getDate().toString().padStart(2, '0')
      const m = (now.getMonth() + 1).toString().padStart(2, '0')
      const y = now.getFullYear()
      const hh = now.getHours().toString().padStart(2, '0')
      const mm = now.getMinutes().toString().padStart(2, '0')
      shift.completedAt = `${d}. ${m}. ${y} ${hh}:${mm}`
      shift.completedBy = currentUser.value.name
      if (notes) shift.notes = notes

      try {
        confetti({
          particleCount: 65,
          spread: 60,
          origin: { y: 0.65 }
        })
      } catch (e) {}

      const actingNote = (isMasterTenant.value && shift.roommateId !== currentUserId.value)
        ? t('toasts.cleaningDone.managerNote', ' (potvrzeno správcem bytu za spolubydlícího {name})', { name: shift.roommateName })
        : ''

      showToast(
        t('toasts.cleaningDone.title', 'Úklidová směna splněna 🎉'),
        t('toasts.cleaningDone.message', 'Směna "{task}" byla úspěšně označena jako splněná{note}.', { task: shift.taskTitle, note: actingNote }),
        'success'
      )
    } else {
      shift.isCompleted = false
      shift.completedAt = undefined
      shift.completedBy = undefined
      showToast(
        t('toasts.cleaningReopened.title', 'Stav směny změněn'),
        t('toasts.cleaningReopened.message', 'Směna "{task}" byla vrácena do stavu "Čeká na splnění".', { task: shift.taskTitle }),
        'info'
      )
    }
    return true
  }

  const sendCleaningReminder = (shiftId: string) => {
    const shift = cleaningShifts.value.find(s => s.id === shiftId)
    if (!shift) return

    showToast(
      t('toasts.cleaningReminder.title', 'Připomínka úklidu odeslána'),
      t('toasts.cleaningReminder.message', 'Spolubydlícímu {name} byla odeslána notifikace k povinnosti "{task}".', { name: shift.roommateName, task: shift.taskTitle }),
      'info'
    )
  }

  // Shift Swaps
  const requestShiftSwap = (shiftId: string, targetRoommateId: string, note?: string): void => {
    const shift = cleaningShifts.value.find(s => s.id === shiftId)
    if (!shift) return

    if (!isMasterTenant.value && shift.roommateId !== currentUserId.value) {
      showToast(
        t('toasts.accessDenied.title', 'Přístup odepřen'),
        t('toasts.accessDenied.requestSwap', 'O převzetí směny může požádat pouze přiřazený spolubydlící nebo správce bytu.'),
        'warning'
      )
      return
    }

    if (shift.isCompleted || shift.swapRequest?.status === 'PENDING') {
      showToast('Upozornění', 'Splněnou směnu nebo směnu s čekající žádostí nelze převést.', 'warning')
      return
    }
    const target = roommates.value.find(r => r.id === targetRoommateId)
    if (!target) {
      showToast(t('toasts.error.title', 'Chyba'), t('toasts.error.targetNotFound', 'Cílový spolubydlící nebyl nalezen.'), 'error')
      return
    }

    if (target.id === shift.roommateId) {
      showToast(t('toasts.warning.title', 'Upozornění'), t('toasts.warning.selfSwap', 'Nelze požádat sám sebe o převzetí směny.'), 'warning')
      return
    }

    const requester = roommates.value.find(r => r.id === shift.roommateId) || currentUser.value
    const now = new Date()
    const d = now.getDate().toString().padStart(2, '0')
    const m = (now.getMonth() + 1).toString().padStart(2, '0')
    const y = now.getFullYear()

    const swapReq: ShiftSwapRequest = {
      id: createId('swap'),
      targetRoommateId: target.id,
      targetRoommateName: target.name,
      requestedByRoommateId: requester.id,
      requestedByRoommateName: requester.name,
      status: 'PENDING',
      createdAt: `${d}. ${m}. ${y}`,
      note: note?.trim() || undefined
    }

    shift.swapRequest = swapReq
    showToast(
      t('toasts.swapRequested.title', 'Žádost o převzetí odeslána'),
      t('toasts.swapRequested.message', 'Žádost o převzetí směny „{task}“ byla doručena spolubydlícímu: {name}.', { task: shift.taskTitle, name: target.name }),
      'info'
    )
  }

  const acceptShiftSwap = (shiftId: string): void => {
    const shift = cleaningShifts.value.find(s => s.id === shiftId)
    if (!shift || !shift.swapRequest || shift.swapRequest.status !== 'PENDING') return

    if (!isMasterTenant.value && currentUserId.value !== shift.swapRequest.targetRoommateId) {
      showToast(
        t('toasts.accessDenied.title', 'Přístup odepřen'),
        t('toasts.accessDenied.acceptSwap', 'Převzetí může schválit pouze oslovený spolubydlící nebo správce bytu.'),
        'warning'
      )
      return
    }

    if (shift.isCompleted) {
      showToast('Upozornění', 'Splněnou směnu nelze převzít.', 'warning')
      return
    }
    shift.swapRequest.status = 'ACCEPTED'
    const newRoommateId = shift.swapRequest.targetRoommateId
    const newRoommateName = shift.swapRequest.targetRoommateName

    shift.roommateId = newRoommateId
    shift.roommateName = newRoommateName

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      })
    } catch (e) {}

    showToast(
      t('toasts.swapAccepted.title', 'Převzetí směny byla potvrzena 🎉'),
      t('toasts.swapAccepted.message', 'Směna „{task}“ byla úspěšně převedena na: {name}.', { task: shift.taskTitle, name: newRoommateName }),
      'success'
    )
  }

  const rejectShiftSwap = (shiftId: string): void => {
    const shift = cleaningShifts.value.find(s => s.id === shiftId)
    if (!shift || !shift.swapRequest || shift.swapRequest.status !== 'PENDING') return

    if (!isMasterTenant.value && currentUserId.value !== shift.swapRequest.targetRoommateId) {
      showToast(
        t('toasts.accessDenied.title', 'Přístup odepřen'),
        t('toasts.accessDenied.rejectSwap', 'Převzetí může odmítnout pouze oslovený spolubydlící nebo správce bytu.'),
        'warning'
      )
      return
    }

    shift.swapRequest.status = 'REJECTED'
    showToast(
      t('toasts.swapRejected.title', 'Žádost o převzetí byla odmítnuta'),
      t('toasts.swapRejected.message', 'Směna „{task}“ zůstává přiřazena původnímu spolubydlícímu ({name}).', { task: shift.taskTitle, name: shift.roommateName }),
      'info'
    )
  }

  const cancelShiftSwap = (shiftId: string): void => {
    const shift = cleaningShifts.value.find(s => s.id === shiftId)
    if (!shift || !shift.swapRequest || shift.swapRequest.status !== 'PENDING') return

    if (!isMasterTenant.value && currentUserId.value !== shift.swapRequest.requestedByRoommateId) {
      showToast(
        t('toasts.accessDenied.title', 'Přístup odepřen'),
        t('toasts.accessDenied.cancelSwap', 'Žádost může zrušit pouze ten, kdo o ni požádal, nebo správce bytu.'),
        'warning'
      )
      return
    }

    shift.swapRequest.status = 'CANCELLED'
    showToast(
      t('toasts.swapCancelled.title', 'Žádost o převzetí byla zrušena'),
      t('toasts.swapCancelled.message', 'Žádost o převzetí směny „{task}“ byla úspěšně odvolána.', { task: shift.taskTitle }),
      'info'
    )
  }

  const selectedWeekShifts = computed(() => {
    return cleaningShifts.value.filter(s => s.weekNumber === selectedCleaningWeek.value)
  })

  const currentWeekCleaningShifts = computed(() => {
    return cleaningShifts.value.filter(s => s.weekNumber === currentWeekNumber)
  })

  const myCurrentCleaningShift = computed(() => {
    return currentWeekCleaningShifts.value.find(s => s.roommateId === currentUserId.value)
  })

  const pendingCurrentWeekCleaningCount = computed(() => {
    return currentWeekCleaningShifts.value.filter(s => !s.isCompleted).length
  })

  const myCurrentCleaningPending = computed(() => {
    return myCurrentCleaningShift.value ? !myCurrentCleaningShift.value.isCompleted : false
  })

  // Settings & Apartment configuration
  const saveApartmentSettings = (newSettings: ApartmentSettings): boolean => {
    if (!isMasterTenant.value) {
      showToast(
        t('toasts.accessDenied.title', 'Přístup odepřen'),
        t('toasts.accessDenied.saveSettings', 'Kmenové údaje bytu a bankovní spojení může upravit pouze správce bytu.'),
        'warning'
      )
      return false
    }

    const iban = newSettings.iban.trim().replace(/\s/g, '').toUpperCase()
    if (!newSettings.name.trim() || !newSettings.address.trim() || !newSettings.accountNumber.trim()
      || !/^CZ\d{22}$/.test(iban)
      || !Number.isFinite(newSettings.monthlyRent) || newSettings.monthlyRent <= 0
      || !Number.isFinite(newSettings.monthlyUtilities) || newSettings.monthlyUtilities <= 0
      || !Number.isInteger(newSettings.dueDayOfMonth) || newSettings.dueDayOfMonth < 1 || newSettings.dueDayOfMonth > 28
      || !['BY_AREA', 'EQUAL'].includes(newSettings.rules.rentKey)
      || !['BY_AREA', 'EQUAL'].includes(newSettings.rules.energyKey) || newSettings.rules.suppliesKey !== 'EQUAL') {
      showToast('Neplatné nastavení', 'Vyplňte údaje bytu, český IBAN, kladné částky a den splatnosti 1–28.', 'error')
      return false
    }
    const dueChanged = settings.value.dueDayOfMonth !== newSettings.dueDayOfMonth
    settings.value = deepClone({ ...newSettings, iban })
    if (dueChanged) settlements.value.forEach(s => {
      s.dueDate = `2026-11-${String(newSettings.dueDayOfMonth).padStart(2, '0')}`
      s.daysOverdue = s.totalDebt > 0 ? Math.max(0, 12 - newSettings.dueDayOfMonth) : 0
      s.status = s.totalDebt === 0 ? 'VYROVNÁNO' : s.daysOverdue > 0 ? 'PO_SPLATNOSTI' : 'PŘED_SPLATNOSTÍ'
    })
    if (dueChanged) expenses.value.forEach(expense => {
      if (expense.payerId !== managerRoommate.value.id) return
      expense.shares.forEach(share => {
        if (share.status !== 'DLUŽÍ' && share.status !== 'PO_SPLATNOSTI') return
        const settlement = settlements.value.find(s => s.roommateId === share.roommateId)
        share.status = settlement && settlement.daysOverdue > 0 ? 'PO_SPLATNOSTI' : 'DLUŽÍ'
      })
      expense.status = expense.shares.some(s => s.status === 'PO_SPLATNOSTI') ? 'PO_SPLATNOSTI'
        : expense.shares.some(s => s.status === 'DLUŽÍ') ? 'ČÁSTEČNĚ' : 'UHRAZENO'
    })
    showToast(
      t('toasts.settingsSaved.title', 'Nastavení uloženo'),
      t('toasts.settingsSaved.message', 'Kmenové údaje bytu, bankovní spojení a zálohy byly úspěšně aktualizovány.'),
      'success'
    )
    return true
  }

  const updateRoommateArea = (roomId: string, newArea: number): boolean => {
    if (!isMasterTenant.value) {
      showToast(
        t('toasts.accessDenied.title', 'Přístup odepřen'),
        t('toasts.accessDenied.updateArea', 'Podlahovou výměru pokojů může upravit pouze správce bytu.'),
        'warning'
      )
      return false
    }

    const target = roommates.value.find(r => r.id === roomId)
    if (!target) return false
    if (!Number.isFinite(newArea) || newArea < 5) {
      showToast('Neplatná výměra pokoje', 'Zadejte plochu pokoje alespoň 5 m².', 'error')
      return false
    }

    target.roomAreaM2 = newArea
    // Recalculate percentages
    const totalArea = roommates.value.reduce((sum, r) => sum + r.roomAreaM2, 0)
    roommates.value.forEach(r => {
      r.areaSharePct = Math.round((r.roomAreaM2 / totalArea) * 1000) / 10
      const settlement = settlements.value.find(s => s.roommateId === r.id)
      if (settlement) Object.assign(settlement, { roomName: r.roomName, roomAreaM2: r.roomAreaM2, areaSharePct: r.areaSharePct })
    })

    showToast(
      t('toasts.areaUpdated.title', 'Výměra pokoje upravena'),
      t('toasts.areaUpdated.message', 'Pokoj uživatele {name} má nyní {area} m² ({pct} % plochy bytu).', { name: target.name, area: newArea, pct: target.areaSharePct }),
      'info'
    )
    return true
  }

  // Reset demo data
  const resetDemoData = () => {
    requestConfirmation({
      title: t('confirm.reset.title', 'Resetovat všechna data'),
      message: t('confirm.reset.message', 'Opravdu chcete obnovit výchozí stav prototypu? Veškeré úpravy, nově zadané výdaje a odečty budou přepsány výchozími daty.'),
      confirmLabel: t('confirm.reset.confirm', 'Obnovit výchozí data'),
      isDestructive: true,
      onConfirm: () => {
        roommates.value = deepClone(INITIAL_ROOMMATES)
        settings.value = deepClone(INITIAL_SETTINGS)
        settlements.value = deepClone(INITIAL_SETTLEMENTS)
        expenses.value = deepClone(INITIAL_EXPENSES)
        meters.value = deepClone(INITIAL_METERS)
        cartItems.value = deepClone(INITIAL_CART_ITEMS)
        cleaningShifts.value = deepClone(INITIAL_CLEANING_SHIFTS)
        selectedCleaningWeek.value = 45
        currentUserId.value = 'user-tomas'
        currentPage.value = 'DASH'
        expensePrefill.value = null
        closeModal()
        showToast(t('toasts.resetDone.title', 'Výchozí stav obnoven'), t('toasts.resetDone.message', 'Prototyp je připraven na nové uživatelské testování.'), 'success')
      }
    })
  }

  // Export CSV
  const exportExpensesCsv = () => {
    const headers = [
      t('csv.code', 'Kód'),
      t('csv.date', 'Datum'),
      t('csv.title', 'Název'),
      t('csv.category', 'Kategorie'),
      t('csv.payer', 'Plátce'),
      t('csv.total', 'Celkem CZK'),
      t('csv.status', 'Stav')
    ]
    const rows = filteredExpenses.value.map(e => [
      e.code,
      e.date,
      e.title,
      e.category,
      e.payerName,
      e.totalAmount,
      e.status
    ])

    const csvContent = '\uFEFF' + [headers.map(csvCell).join(';'), ...rows.map(r => r.map(csvCell).join(';'))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `spolubyt_vypis_vydaju_${DEMO_TODAY}.csv`
    link.click()
    URL.revokeObjectURL(link.href)

    showToast(t('toasts.exportDone.title', 'Export dokončen'), t('toasts.exportDone.message', 'Soubor CSV byl stažen do vašeho zařízení.'), 'success')
  }

  return {
    // Nav & Modals
    currentPage,
    isSidebarCollapsed,
    toggleSidebar,
    activeModal,
    selectedExpense,
    selectedShift,
    selectedSettlement,
    expensePrefill,
    confirmModal,
    navigateTo,
    openModal,
    closeModal,
    requestConfirmation,
    closeConfirmation,

    // Users
    roommates,
    currentUser,
    managerRoommate,
    managerSettlement,
    isMasterTenant,
    setCurrentUser,
    currentUserSettlement,
    currentUserDebt,
    currentUserStatus,
    isCurrentUserOverdue,
    currentUserReceivables,
    currentUserMonthlyExpenses,
    currentUserPreviousMonthExpenses,

    // Settings
    settings,
    saveApartmentSettings,
    updateRoommateArea,

    // KPI & Dashboard
    monthlyTotalExpenses,
    previousMonthTotalExpenses,
    totalReceivables,
    debtorsCount,
    overdueDebtorsCount,

    // Expenses
    expenses,
    expenseFilters,
    filteredExpenses,
    filteredExpensesSum,
    resetExpenseFilters,
    addExpense,
    deleteExpense,
    canDeleteExpense,
    exportExpensesCsv,

    // Settlements
    settlements,
    confirmPayment,
    sendReminder,

    // Cart
    cartItems,
    cartTotalCount,
    cartTotalPrice,
    unpurchasedCartItems,
    cartRemainingCount,
    cartRemainingPrice,
    purchasedCartCount,
    purchasedCartPrice,
    addCartItem,
    updateCartItemQty,
    removeCartItem,
    clearCart,
    convertCartToExpense,
    convertRemainingCartToExpense,
    convertCartItemToExpense,
    toggleCartItemPurchased,

    // Energy
    meters,
    latestMeters,
    addMeterReading,
    deleteLatestMeterReading,
    annualEnergyPrediction,

    // Cleaning & Shifts
    cleaningShifts,
    cleaningTaskDefs,
    selectedCleaningWeek,
    currentWeekNumber,
    selectedWeekShifts,
    currentWeekCleaningShifts,
    myCurrentCleaningShift,
    pendingCurrentWeekCleaningCount,
    myCurrentCleaningPending,
    canConfirmShift,
    toggleShiftStatus,
    sendCleaningReminder,
    selectCleaningWeek,
    requestShiftSwap,
    acceptShiftSwap,
    rejectShiftSwap,
    cancelShiftSwap,

    // Toasts & Reset
    toasts,
    storageWriteFailed,
    storageRecovered,
    storageConflict,
    showToast,
    removeToast,
    resetDemoData
  }
}


const store = createStore()

export function useSpolubyt(): ReturnType<typeof createStore> {
  return store
}
