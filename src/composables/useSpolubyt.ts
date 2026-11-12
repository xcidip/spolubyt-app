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
  CalculationKey,
  ExpenseCategory,
  CleaningShift,
  CleaningTaskDef,
  ExpensePrefillData,
  ShiftSwapRequest,
  EnergyPrediction
} from '../types/index'
import {
  INITIAL_ROOMMATES,
  INITIAL_SETTINGS,
  INITIAL_SETTLEMENTS,
  INITIAL_EXPENSES,
  INITIAL_METERS,
  INITIAL_CART_ITEMS,
  INITIAL_CLEANING_SHIFTS,
  CLEANING_TASK_DEFS
} from '../data/mockData'

const STORAGE_KEY_PREFIX = 'spolubyt_hifi_v1_'

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(STORAGE_KEY_PREFIX + key)
    return item ? JSON.parse(item) : defaultValue
  } catch (e) {
    console.error('Failed to load from localStorage', e)
    return defaultValue
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value))
  } catch (e) {
    console.error('Failed to save to localStorage', e)
  }
}

// Global reactive state
const currentPage = ref<PageId>('DASH')
const activeModal = ref<string | null>(null)
const selectedExpense = ref<Expense | null>(null)
const selectedSettlement = ref<DebtSettlement | null>(null)
const expensePrefill = ref<ExpensePrefillData | null>(null)
const isSidebarCollapsed = ref<boolean>(loadFromStorage('sidebar_collapsed', false))

function toggleSidebar(): void {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
  saveToStorage('sidebar_collapsed', isSidebarCollapsed.value)
}

// Generic Confirmation Dialog State
interface ConfirmModalState {
  isOpen: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  isDestructive: boolean
  onConfirm: () => void
}

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

// Auto-save watchers
watch(roommates, (val) => saveToStorage('roommates', val), { deep: true })
watch(currentUserId, (val) => saveToStorage('currentUserId', val))
watch(settings, (val) => saveToStorage('settings', val), { deep: true })
watch(settlements, (val) => saveToStorage('settlements', val), { deep: true })
watch(expenses, (val) => saveToStorage('expenses', val), { deep: true })
watch(meters, (val) => saveToStorage('meters', val), { deep: true })
watch(cartItems, (val) => saveToStorage('cartItems', val), { deep: true })
watch(cleaningShifts, (val) => saveToStorage('cleaning_shifts', val), { deep: true })

// Filters for Expenses list
const expenseFilters = ref({
  search: '',
  period: 'ALL', // 'ALL' | '11/2026' | '10/2026' | '09/2026'
  category: 'ALL', // 'ALL' | ExpenseCategory
  payer: 'ALL', // 'ALL' | roommateId
  status: 'ALL', // 'ALL' | 'UNPAID' | 'PAID'
  sortBy: 'date' as 'date' | 'amount' | 'title',
  sortOrder: 'desc' as 'asc' | 'desc',
})

export function useSpolubyt() {
  // Current user persona
  const currentUser = computed(() => {
    return roommates.value.find(r => r.id === currentUserId.value) || roommates.value[0]
  })

  const isMasterTenant = computed(() => currentUser.value.role === 'Správce')

  const setCurrentUser = (userId: string) => {
    currentUserId.value = userId
    const found = roommates.value.find(r => r.id === userId)
    if (found) {
      showToast(
        'Změna aktivního uživatele',
        `Nyní prohlížíte aplikaci jako ${found.name} (${found.role}).`,
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
      confirmLabel: options.confirmLabel || 'Potvrdit',
      cancelLabel: options.cancelLabel || 'Zrušit',
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Modal handlers
  const openModal = (modalName: string, payload?: any) => {
    if (modalName === 'EXP_DETAIL') {
      selectedExpense.value = payload as Expense
    } else if (modalName === 'QR_MODAL' || modalName === 'CONFIRM_MODAL') {
      selectedSettlement.value = payload as DebtSettlement
    } else if (modalName === 'EXP_ADD') {
      expensePrefill.value = (payload as ExpensePrefillData) || null
    }
    activeModal.value = modalName
  }

  const closeModal = () => {
    activeModal.value = null
    expensePrefill.value = null
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
        .filter(s => s.roommateId !== currentUserId.value && s.status === 'DLUŽÍ')
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
    showToast('Filtry vyresetovány', 'Zobrazen kompletní chronologický seznam výdajů.', 'info')
  }

  // Add Expense
  const addExpense = (newExpense: Omit<Expense, 'id' | 'code' | 'audit'>) => {
    const today = new Date()
    const code = `VYD-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 900 + 100))}`
    const id = 'exp-' + Date.now()
    
    const expense: Expense = {
      ...newExpense,
      id,
      code,
      audit: {
        createdBy: currentUser.value.name,
        createdAt: `${String(today.getDate()).padStart(2, '0')}. ${String(today.getMonth() + 1).padStart(2, '0')}. ${today.getFullYear()} ${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`
      }
    }

    // Update settlements for other members who owe
    expense.shares.forEach(share => {
      if (share.roommateId !== expense.payerId && share.status !== 'UHRAZENO') {
        const s = settlements.value.find(set => set.roommateId === share.roommateId)
        if (s) {
          s.totalDebt += share.amount
          if (expense.category === 'Bydlení') s.breakdown.rent += share.amount
          else if (expense.category === 'Energie') s.breakdown.energy += share.amount
          else if (expense.category === 'Drogerie') s.breakdown.drogerie = (s.breakdown.drogerie || 0) + share.amount
          else s.breakdown.other = ((s.breakdown as any).other || 0) + share.amount
          s.status = s.daysOverdue > 0 ? 'PO_SPLATNOSTI' : 'PŘED_SPLATNOSTÍ'
        }
      }
    })

    // If the expense originated from a cart conversion, remove the transferred items
    const transferredCartItemIds = expensePrefill.value?.cartItemIds
      ?? (expensePrefill.value?.cartItemId ? [expensePrefill.value.cartItemId] : [])
    if (transferredCartItemIds.length > 0) {
      cartItems.value = cartItems.value.filter(i => !transferredCartItemIds.includes(i.id))
    }

    expenses.value.unshift(expense)
    closeModal()
    showToast(
      'Výdaj úspěšně zaevidován',
      `Položka „${expense.title}“ (${expense.totalAmount.toLocaleString('cs-CZ')} Kč) byla rozpočítána a uložena.`,
      'success'
    )
  }

  // Delete Expense
  const deleteExpense = (expenseId: string) => {
    const exp = expenses.value.find(e => e.id === expenseId)
    if (!exp) return

    requestConfirmation({
      title: 'Smazat výdaj',
      message: `Opravdu si přejete trvale odstranit záznam „${exp.title}“ v částce ${exp.totalAmount.toLocaleString('cs-CZ')} Kč? Tato akce přepočítá bilanci bytu.`,
      confirmLabel: 'Trvale smazat',
      cancelLabel: 'Ponechat',
      isDestructive: true,
      onConfirm: () => {
        // Rollback shares in debts
        exp.shares.forEach(share => {
          if (share.roommateId !== exp.payerId && share.status !== 'UHRAZENO') {
            const s = settlements.value.find(set => set.roommateId === share.roommateId)
            if (s) {
              s.totalDebt = Math.max(0, s.totalDebt - share.amount)
              if (s.totalDebt === 0) s.status = 'VYROVNÁNO'
            }
          }
        })

        expenses.value = expenses.value.filter(e => e.id !== expenseId)
        if (selectedExpense.value?.id === expenseId) {
          closeModal()
        }
        showToast('Výdaj odstraněn', `Záznam „${exp.title}“ byl úspěšně smazán.`, 'info')
      }
    })
  }

  // Settle Debt / Confirm Payment
  const confirmPayment = (roommateId: string, paymentDetails: {
    date: string
    method: string
    note: string
    notifyMember: boolean
  }) => {
    const s = settlements.value.find(set => set.roommateId === roommateId)
    if (!s) return

    const paidAmount = s.totalDebt
    s.totalDebt = 0
    s.status = 'VYROVNÁNO'
    s.daysOverdue = 0
    s.breakdown = { rent: 0, energy: 0, drogerie: 0, wifi: 0 }

    // Update expense shares related to this roommate
    expenses.value.forEach(exp => {
      exp.shares.forEach(share => {
        if (share.roommateId === roommateId && share.status !== 'PLÁTCE') {
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
      'Platba byla spárována a zaúčtována',
      `Úhrada ${paidAmount.toLocaleString('cs-CZ')} Kč od ${s.roommateName} byla potvrzena. Bilance bytu je vyrovnaná.`,
      'success',
      4500
    )
  }

  // Send Reminder (Upomínka)
  const sendReminder = (roommateId: string) => {
    const s = settlements.value.find(set => set.roommateId === roommateId)
    if (!s) return

    const now = new Date()
    const dateStr = `${String(now.getDate()).padStart(2, '0')}. ${String(now.getMonth() + 1).padStart(2, '0')}. v ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} e-mailem a push notifikací`
    s.lastReminderSent = dateStr

    showToast(
      'Upomínka odeslána',
      `Diskrétní notifikace o nedoplatku ${s.totalDebt.toLocaleString('cs-CZ')} Kč byla doručena spolubydlícímu: ${s.roommateName}.`,
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

  const addCartItem = (item: { name: string; category: ExpenseCategory; unitPrice: number; qty: number }) => {
    if (!item.name.trim() || item.unitPrice <= 0 || item.qty <= 0) {
      showToast('Neplatné údaje', 'Vyplňte prosím název položky a kladnou cenu.', 'warning')
      return
    }

    const newItem: CartItem = {
      id: 'cart-' + Date.now(),
      name: item.name.trim(),
      category: item.category,
      unitPrice: Math.round(item.unitPrice),
      qty: Math.max(1, Math.round(item.qty)),
      addedBy: currentUser.value.name,
      addedAt: 'Právě teď'
    }

    cartItems.value.push(newItem)
    showToast(
      'Položka přidána do košíku',
      `„${newItem.name}“ (${newItem.qty}× ${newItem.unitPrice} Kč) byla zařazena do společného nákupního seznamu.`,
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
      title: 'Odebrat položku z košíku',
      message: `Přejete si odstranit položku „${item.name}“ ze společného nákupního košíku?`,
      confirmLabel: 'Odebrat',
      isDestructive: true,
      onConfirm: () => {
        cartItems.value = cartItems.value.filter(i => i.id !== itemId)
        showToast('Položka odebrána', `Položka „${item.name}“ byla smazána.`, 'info')
      }
    })
  }

  const clearCart = () => {
    if (cartItems.value.length === 0) return
    requestConfirmation({
      title: 'Vysypat společný košík',
      message: 'Opravdu si přejete smazat všechny položky ze společného nákupního seznamu?',
      confirmLabel: 'Vysypat košík',
      isDestructive: true,
      onConfirm: () => {
        cartItems.value = []
        showToast('Košík vyprázdněn', 'Nákupní seznam byl vymazán.', 'info')
      }
    })
  }

  const toggleCartItemPurchased = (itemId: string) => {
    const item = cartItems.value.find(i => i.id === itemId)
    if (!item) return

    item.isPurchased = !item.isPurchased
    if (item.isPurchased) {
      item.purchasedBy = currentUser.value.name
      item.purchasedAt = 'Právě teď'
      showToast(
        'Položka označena jako koupená',
        `„${item.name}“ je připravena k převodu do výdajů.`,
        'success'
      )
    } else {
      item.purchasedBy = undefined
      item.purchasedAt = undefined
      showToast(
        'Stav položky změněn',
        `„${item.name}“ byla vrácena mezi nepořízené položky.`,
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
  const convertCartToExpense = () => {
    if (cartItems.value.length === 0) {
      showToast('Košík je prázdný', 'Nejprve přidejte položky k nákupu.', 'warning')
      return
    }

    // Prepare payload and open EXP_ADD modal with prefilled receipt items!
    const total = cartTotalPrice.value
    openModal('EXP_ADD', {
      title: 'Společný nákup ze seznamu (drogerie a úklid)',
      totalAmount: total,
      category: 'Drogerie',
      cartItemIds: cartItems.value.map(i => i.id),
      items: cartItems.value.map(i => ({
        id: i.id,
        name: i.name,
        price: i.unitPrice,
        qty: i.qty
      }))
    })
  }

  // Energy / Meters
  const latestMeters = computed(() => {
    const map: Record<string, MeterReading> = {}
    meters.value.forEach(m => {
      if (!map[m.type] || new Date(m.date) > new Date(map[m.type].date)) {
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
    if (prev && data.value < prev.value) {
      showToast(
        'Neplatná hodnota měřidla',
        `Nový stav (${data.value}) nesmí být nižší než předchozí zaznamenaný stav (${prev.value} ${prev.unit})!`,
        'error'
      )
      return false
    }

    const delta = prev ? data.value - prev.value : 0
    const newReading: MeterReading = {
      id: 'meter-' + Date.now(),
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
    closeModal()
    showToast(
      'Odečet byl uložen',
      `Nový stav měřidla ${data.type} (${data.value} ${newReading.unit}) byl úspěšně zaevidován s přírůstkem +${delta} ${newReading.unit}.`,
      'success'
    )
    return true
  }

  // Energy Prediction
  const annualEnergyPrediction = computed<EnergyPrediction>(() => {
    const annualAdvances = (settings.value.monthlyUtilities || 8600) * 12

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
    const existing = cleaningShifts.value.filter(s => s.weekNumber === targetWeek)
    if (existing.length >= 4) return

    const diff = targetWeek - 45
    // Week 45 starts on Monday 2026-11-02
    const baseStart = new Date(2026, 10, 2)
    const startDateObj = new Date(baseStart.getTime() + diff * 7 * 24 * 60 * 60 * 1000)
    const endDateObj = new Date(startDateObj.getTime() + 6 * 24 * 60 * 60 * 1000)

    const fmtDayMonth = (d: Date) => `${d.getDate()}. ${d.getMonth() + 1}.`
    const fmtIso = (d: Date) => `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
    const weekLabel = `Týden ${targetWeek} (${fmtDayMonth(startDateObj)} – ${fmtDayMonth(endDateObj)} ${endDateObj.getFullYear()})`

    const tasksOrder: { key: import('../types').CleaningTaskKey; title: string }[] = [
      { key: 'KITCHEN', title: 'Uklízení kuchyně a myčky' },
      { key: 'BATHROOM', title: 'Koupelna a toaleta' },
      { key: 'CORRIDOR', title: 'Chodba a vysávání' },
      { key: 'TRASH', title: 'Odpadky a třídění' }
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
        'Přístup odepřen',
        `Tuto směnu může potvrdit pouze ${shift.roommateName} nebo správce bytu.`,
        'warning'
      )
      return false
    }

    if (!shift.isCompleted) {
      shift.isCompleted = true
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
        ? ` (potvrzeno správcem bytu za spolubydlícího ${shift.roommateName})`
        : ''

      showToast(
        'Úklidová směna splněna 🎉',
        `Směna "${shift.taskTitle}" byla úspěšně označena jako splněná${actingNote}.`,
        'success'
      )
    } else {
      shift.isCompleted = false
      shift.completedAt = undefined
      shift.completedBy = undefined
      showToast(
        'Stav směny změněn',
        `Směna "${shift.taskTitle}" byla vrácena do stavu "Čeká na splnění".`,
        'info'
      )
    }
    return true
  }

  const sendCleaningReminder = (shiftId: string) => {
    const shift = cleaningShifts.value.find(s => s.id === shiftId)
    if (!shift) return

    showToast(
      'Připomínka úklidu odeslána',
      `Spolubydlícímu ${shift.roommateName} byla odeslána notifikace k povinnosti "${shift.taskTitle}".`,
      'info'
    )
  }

  // Shift Swaps
  const requestShiftSwap = (shiftId: string, targetRoommateId: string, note?: string): void => {
    const shift = cleaningShifts.value.find(s => s.id === shiftId)
    if (!shift) return

    if (!isMasterTenant.value && shift.roommateId !== currentUserId.value) {
      showToast(
        'Přístup odepřen',
        'O výměnu směny může požádat pouze přiřazený spolubydlící nebo správce bytu.',
        'warning'
      )
      return
    }

    const target = roommates.value.find(r => r.id === targetRoommateId)
    if (!target) {
      showToast('Chyba', 'Cílový spolubydlící nebyl nalezen.', 'error')
      return
    }

    if (target.id === shift.roommateId) {
      showToast('Upozornění', 'Nelze vyměnit směnu sám se sebou.', 'warning')
      return
    }

    const requester = roommates.value.find(r => r.id === shift.roommateId) || currentUser.value
    const now = new Date()
    const d = now.getDate().toString().padStart(2, '0')
    const m = (now.getMonth() + 1).toString().padStart(2, '0')
    const y = now.getFullYear()

    const swapReq: ShiftSwapRequest = {
      id: 'swap-' + Date.now(),
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
      'Žádost o výměnu odeslána',
      `Žádost o převzetí směny „${shift.taskTitle}“ byla doručena spolubydlícímu: ${target.name}.`,
      'info'
    )
  }

  const acceptShiftSwap = (shiftId: string): void => {
    const shift = cleaningShifts.value.find(s => s.id === shiftId)
    if (!shift || !shift.swapRequest || shift.swapRequest.status !== 'PENDING') return

    if (!isMasterTenant.value && currentUserId.value !== shift.swapRequest.targetRoommateId) {
      showToast(
        'Přístup odepřen',
        'Výměnu může schválit pouze oslovený spolubydlící nebo správce bytu.',
        'warning'
      )
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
      'Výměna směny byla potvrzena 🎉',
      `Směna „${shift.taskTitle}“ byla úspěšně převedena na: ${newRoommateName}.`,
      'success'
    )
  }

  const rejectShiftSwap = (shiftId: string): void => {
    const shift = cleaningShifts.value.find(s => s.id === shiftId)
    if (!shift || !shift.swapRequest || shift.swapRequest.status !== 'PENDING') return

    if (!isMasterTenant.value && currentUserId.value !== shift.swapRequest.targetRoommateId) {
      showToast(
        'Přístup odepřen',
        'Výměnu může odmítnout pouze oslovený spolubydlící nebo správce bytu.',
        'warning'
      )
      return
    }

    shift.swapRequest.status = 'REJECTED'
    showToast(
      'Žádost o výměnu byla odmítnuta',
      `Směna „${shift.taskTitle}“ zůstává přiřazena původnímu spolubydlícímu (${shift.roommateName}).`,
      'info'
    )
  }

  const cancelShiftSwap = (shiftId: string): void => {
    const shift = cleaningShifts.value.find(s => s.id === shiftId)
    if (!shift || !shift.swapRequest || shift.swapRequest.status !== 'PENDING') return

    if (!isMasterTenant.value && currentUserId.value !== shift.swapRequest.requestedByRoommateId) {
      showToast(
        'Přístup odepřen',
        'Žádost může zrušit pouze ten, kdo o ni požádal, nebo správce bytu.',
        'warning'
      )
      return
    }

    shift.swapRequest.status = 'CANCELLED'
    showToast(
      'Žádost o výměnu byla zrušena',
      `Žádost o výměnu směny „${shift.taskTitle}“ byla úspěšně odvolána.`,
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
  const saveApartmentSettings = (newSettings: ApartmentSettings) => {
    settings.value = { ...newSettings }
    showToast(
      'Nastavení uloženo',
      'Kmenové údaje bytu, bankovní spojení a zálohy byly úspěšně aktualizovány.',
      'success'
    )
  }

  const updateRoommateArea = (roomId: string, newArea: number) => {
    const target = roommates.value.find(r => r.id === roomId)
    if (!target || newArea <= 0) return

    target.roomAreaM2 = newArea
    // Recalculate percentages
    const totalArea = roommates.value.reduce((sum, r) => sum + r.roomAreaM2, 0)
    roommates.value.forEach(r => {
      r.areaSharePct = Math.round((r.roomAreaM2 / totalArea) * 1000) / 10
    })

    showToast(
      'Výměra pokoje upravena',
      `Pokoj uživatele ${target.name} má nyní ${newArea} m² (${target.areaSharePct} % plochy bytu).`,
      'info'
    )
  }

  // Reset demo data
  const resetDemoData = () => {
    requestConfirmation({
      title: 'Resetovat všechna data',
      message: 'Opravdu chcete obnovit výchozí stav prototypu? Veškeré úpravy, nově zadané výdaje a odečty budou přepsány výchozími daty.',
      confirmLabel: 'Obnovit výchozí data',
      isDestructive: true,
      onConfirm: () => {
        roommates.value = JSON.parse(JSON.stringify(INITIAL_ROOMMATES))
        settings.value = JSON.parse(JSON.stringify(INITIAL_SETTINGS))
        settlements.value = JSON.parse(JSON.stringify(INITIAL_SETTLEMENTS))
        expenses.value = JSON.parse(JSON.stringify(INITIAL_EXPENSES))
        meters.value = JSON.parse(JSON.stringify(INITIAL_METERS))
        cartItems.value = JSON.parse(JSON.stringify(INITIAL_CART_ITEMS))
        cleaningShifts.value = JSON.parse(JSON.stringify(INITIAL_CLEANING_SHIFTS))
        selectedCleaningWeek.value = 45
        currentUserId.value = 'user-tomas'
        currentPage.value = 'DASH'
        expensePrefill.value = null
        closeModal()
        showToast('Výchozí stav obnoven', 'Prototyp je připraven na nové uživatelské testování.', 'success')
      }
    })
  }

  // Export CSV
  const exportExpensesCsv = () => {
    const headers = ['Kód', 'Datum', 'Název', 'Kategorie', 'Plátce', 'Celkem CZK', 'Stav']
    const rows = filteredExpenses.value.map(e => [
      e.code,
      e.date,
      `"${e.title.replace(/"/g, '""')}"`,
      e.category,
      `"${e.payerName}"`,
      e.totalAmount,
      e.status
    ])

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `spolubyt_vypis_vydaju_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()

    showToast('Export dokončen', 'Soubor CSV byl stažen do vašeho zařízení.', 'success')
  }

  return {
    // Nav & Modals
    currentPage,
    isSidebarCollapsed,
    toggleSidebar,
    activeModal,
    selectedExpense,
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
    exportExpensesCsv,

    // Settlements
    settlements,
    confirmPayment,
    sendReminder,

    // Cart
    cartItems,
    cartTotalCount,
    cartTotalPrice,
    addCartItem,
    updateCartItemQty,
    removeCartItem,
    clearCart,
    convertCartToExpense,
    convertCartItemToExpense,
    toggleCartItemPurchased,

    // Energy
    meters,
    latestMeters,
    addMeterReading,
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
    showToast,
    removeToast,
    resetDemoData
  }
}

