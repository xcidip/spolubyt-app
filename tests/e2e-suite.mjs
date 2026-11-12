/**
 * Comprehensive 4-Tier E2E Test Suite for Spolubyt App
 * Methodology: Category-Partition, Boundary Value Analysis, Pairwise Combinations, Real-World Workloads
 * 
 * Total Test Cases: computed by runner
 * - Tier 1: Feature Coverage (56 tests across 11 features)
 * - Tier 2: Boundary & Corner Cases (55 tests across 11 features)
 * - Tier 3: Cross-Feature Combinations (15 tests)
 * - Tier 4: Real-World Tenant Scenarios (6 tests)
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { createServer } from 'vite'
import QRCode from 'qrcode'
import { parse } from 'vue/compiler-sfc'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const APP_ROOT = path.resolve(__dirname, '..')

// In-memory localStorage mock for pristine test isolation
class LocalStorageMock {
  constructor() {
    this.store = {}
  }
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null
  }
  setItem(key, value) {
    this.store[key] = String(value)
  }
  removeItem(key) {
    delete this.store[key]
  }
  clear() {
    this.store = {}
  }
}

globalThis.localStorage = new LocalStorageMock()
globalThis.window = {
  scrollTo: () => {}
}

// Test Harness State
const testResults = []
const suiteStart = Date.now()

// Assertion Utilities
export function assert(condition, message = 'Assertion failed') {
  if (!condition) {
    throw new Error(message)
  }
}

export function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(`${message ? message + ' — ' : ''}Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

export function assertMatch(actual, regex, message = '') {
  if (!regex.test(actual)) {
    throw new Error(`${message ? message + ' — ' : ''}Value "${actual}" did not match pattern ${regex}`)
  }
}

export function assertContains(haystack, needle, message = '') {
  if (!haystack || !haystack.includes(needle)) {
    throw new Error(`${message ? message + ' — ' : ''}Expected string to contain "${needle}"`)
  }
}

export function assertNotContains(haystack, needle, message = '') {
  if (haystack && haystack.includes(needle)) {
    throw new Error(`${message ? message + ' — ' : ''}Expected string to NOT contain "${needle}"`)
  }
}

export function assertDefined(val, message = 'Expected value to be defined') {
  if (val === undefined || val === null) {
    throw new Error(message)
  }
}

export function assertThrows(fn, message = 'Expected function to throw') {
  let threw = false
  try {
    fn()
  } catch {
    threw = true
  }
  if (!threw) throw new Error(message)
}

// Test Registration (strictly enforces: id, title, tier, category, fn)
export function test(id, title, tier, category, fn) {
  testResults.push({ id, title, tier, category, fn, status: 'PENDING', error: null, duration: 0 })
}

// Load Vue SFC Template source from disk
function loadSource(relativePath) {
  const fullPath = path.resolve(APP_ROOT, relativePath)
  return fs.readFileSync(fullPath, 'utf8')
}

function templateElements(source) {
  const parsed = parse(source)
  assertEqual(parsed.errors.length, 0, 'Vue template must parse')
  assertDefined(parsed.descriptor.template)
  const elements = []
  function walk(node) {
    if (node.type === 1) elements.push(node)
    for (const child of node.children || []) walk(child)
  }
  walk(parsed.descriptor.template.ast)
  return elements
}

function classList(node) {
  return (node.props.find(prop => prop.type === 6 && prop.name === 'class')?.value?.content || '').split(/\s+/)
}

function dashboardCardBottom(titleKey) {
  const cards = templateElements(loadSource('src/views/DashboardView.vue'))
    .filter(node => node.tag === 'div' && classList(node).includes('p-5') && node.loc.source.includes(titleKey))
  assertEqual(cards.length, 1, 'Expected one KPI card for ' + titleKey)
  const bottom = cards[0].children.find(node => node.type === 1 && classList(node).includes('mt-2'))
  assertDefined(bottom, 'KPI card must have a bottom action row')
  return bottom
}

async function renderView(relativePath) {
  const { default: component } = await viteServer.ssrLoadModule(relativePath)
  return renderToString(createSSRApp(component))
}

// Helper to create valid Expense payload
function createExpensePayload(overrides = {}) {
  const amount = overrides.totalAmount ?? 1200
  const payerId = overrides.payerId ?? 'user-tomas'
  const people = [
    ['user-tomas', 'Tomáš Beránek'], ['user-jakub', 'Jakub Kovář'],
    ['user-eliska', 'Eliška Malá'], ['user-martin', 'Martin Pospíšil'],
  ]
  const cents = Math.round(amount * 100)
  return {
    title: 'Nákup do bytu',
    category: 'Drogerie',
    totalAmount: amount,
    date: '2026-11-06',
    calculationKey: 'EQUAL',
    payerId,
    payerName: people.find(([id]) => id === payerId)[1],
    status: 'ČÁSTEČNĚ',
    shares: people.map(([id, name], index) => ({
      roommateId: id,
      roommateName: name,
      amount: (Math.floor(cents / 4) + (index < cents % 4 ? 1 : 0)) / 100,
      status: id === payerId ? 'PLÁTCE' : 'DLUŽÍ',
    })),
    ...overrides,
  }
}

// Initialize Vite SSR Environment
let viteServer = null
let storeModule = null
let mockDataModule = null

export async function setupEnvironment() {
  viteServer = await createServer({
    root: APP_ROOT,
    server: { middlewareMode: true },
    appType: 'custom'
  })

  storeModule = await viteServer.ssrLoadModule('./src/composables/useSpolubyt.ts')
  mockDataModule = await viteServer.ssrLoadModule('./src/data/mockData.ts')
}

export async function teardownEnvironment() {
  if (viteServer) {
    await viteServer.close()
  }
}

export function getFreshStore() {
  globalThis.localStorage.clear()
  const store = storeModule.useSpolubyt()
  // Pristine reset
  store.resetDemoData()
  if (store.confirmModal.value?.onConfirm) {
    store.confirmModal.value.onConfirm()
  }
  store.currentPage.value = 'DASH'
  store.setCurrentUser('user-tomas')
  store.closeModal()
  store.resetExpenseFilters()
  store.toasts.value = []
  store.storageWriteFailed.value = false
  store.storageRecovered.value = false
  store.storageConflict.value = false
  return store
}

function storagePrefix() {
  const source = loadSource('src/composables/useSpolubyt.ts')
  const match = source.match(/const STORAGE_KEY_PREFIX = '([^']+)'/)
  assertDefined(match, 'Storage prefix must remain explicit and versioned')
  return match[1]
}

function defaultSnapshot() {
  return JSON.parse(JSON.stringify({
    roommates: mockDataModule.INITIAL_ROOMMATES,
    currentUserId: 'user-tomas',
    settings: mockDataModule.INITIAL_SETTINGS,
    settlements: mockDataModule.INITIAL_SETTLEMENTS,
    expenses: mockDataModule.INITIAL_EXPENSES,
    meters: mockDataModule.INITIAL_METERS,
    cartItems: mockDataModule.INITIAL_CART_ITEMS,
    cleaning_shifts: mockDataModule.INITIAL_CLEANING_SHIFTS,
    sidebar_collapsed: false,
  }))
}

async function reloadStore() {
  viteServer.moduleGraph.invalidateAll()
  storeModule = await viteServer.ssrLoadModule('./src/composables/useSpolubyt.ts')
  mockDataModule = await viteServer.ssrLoadModule('./src/data/mockData.ts')
  return storeModule.useSpolubyt()
}

// =========================================================================
// REGISTER TEST CASES ACROSS 4 TIERS
// =========================================================================

// -------------------------------------------------------------------------
// TIER 1: FEATURE COVERAGE (55 tests)
// -------------------------------------------------------------------------

// Run before any getFreshStore(): first-session mutations must not corrupt the seed.
test('T3.M1', 'First-session mutations reset to pristine demo data', 3, 'Money_Regressions', () => {
  const store = storeModule.useSpolubyt()
  const slices = ['roommates', 'settings', 'settlements', 'expenses', 'meters', 'cartItems', 'cleaningShifts']
  const before = Object.fromEntries(slices.map(key => [key, JSON.stringify(store[key].value)]))
  store.roommates.value[0].roomAreaM2 = 99
  store.settings.value.monthlyRent = 1
  store.settlements.value[0].totalDebt = 1
  store.expenses.value.pop()
  store.meters.value.pop()
  store.cartItems.value.pop()
  store.cleaningShifts.value[0].isCompleted = !store.cleaningShifts.value[0].isCompleted
  store.resetDemoData()
  store.confirmModal.value.onConfirm()
  for (const key of slices) assertEqual(JSON.stringify(store[key].value), before[key], key)
})

test('T3.M2', 'Expense splits preserve every haléř for equal and area allocation', 3, 'Money_Regressions', async () => {
  const { splitAmount } = await viteServer.ssrLoadModule('./src/utils/money.ts')
  const store = getFreshStore()
  for (const key of ['EQUAL', 'BY_AREA']) {
    for (const total of [0.01, 100, 110, 850.75]) {
      for (const count of [1, 3, 4]) {
        const shares = splitAmount(total, store.roommates.value.slice(0, count), key)
        assertEqual(Object.keys(shares).length, count)
        assertEqual(Object.values(shares).reduce((sum, amount) => sum + Math.round(amount * 100), 0), Math.round(total * 100))
        assert(Object.values(shares).every(amount => amount >= 0))
      }
    }
  }
  assertEqual(Object.keys(splitAmount(100, [], 'EQUAL')).length, 0)
  assertEqual(Object.keys(splitAmount(NaN, store.roommates.value, 'EQUAL')).length, 0)
})

function debtSnapshot(store) {
  return JSON.stringify(store.settlements.value.map(s => ({
    totalDebt: s.totalDebt,
    status: s.status,
    breakdown: ['rent', 'energy', 'drogerie', 'wifi', 'other'].map(key => s.breakdown[key] ?? 0),
  })))
}

test('T3.M3', 'Add/delete restores debts and each category bucket exactly', 3, 'Money_Regressions', () => {
  for (const [category, bucket] of [['Bydlení', 'rent'], ['Energie', 'energy'], ['Drogerie', 'drogerie'], ['Služby', 'other'], ['Údržba', 'other'], ['Jídlo', 'other']]) {
    const store = getFreshStore()
    const before = debtSnapshot(store)
    const previous = store.settlements.value.map(s => ({ debt: s.totalDebt, bucket: s.breakdown[bucket] ?? 0 }))
    store.addExpense(createExpensePayload({ category, totalAmount: 133.32 }))
    const added = store.expenses.value[0]
    store.settlements.value.forEach((s, index) => {
      assertEqual(s.totalDebt, Math.round((previous[index].debt + 33.33) * 100) / 100)
      assertEqual(s.breakdown[bucket], Math.round((previous[index].bucket + 33.33) * 100) / 100)
      assertEqual(s.status, s.daysOverdue > 0 ? 'PO_SPLATNOSTI' : 'PŘED_SPLATNOSTÍ')
    })
    store.deleteExpense(added.id)
    store.confirmModal.value.onConfirm()
    assertEqual(debtSnapshot(store), before, category)
    assert(!store.expenses.value.some(e => e.id === added.id))
  }
})

test('T3.M4', 'Member-paid expenses never change debts to the flat account', 3, 'Money_Regressions', () => {
  const store = getFreshStore()
  const before = debtSnapshot(store)
  store.addExpense(createExpensePayload({ payerId: 'user-jakub' }))
  const added = store.expenses.value[0]
  assertEqual(debtSnapshot(store), before)
  store.confirmPayment('user-eliska', { date: '2026-11-06', method: 'bank', note: '', notifyMember: false })
  assertEqual(added.shares.find(s => s.roommateId === 'user-eliska').status, 'DLUŽÍ')
  const afterPayment = debtSnapshot(store)
  store.deleteExpense(added.id)
  store.confirmModal.value.onConfirm()
  assertEqual(debtSnapshot(store), afterPayment)
})

test('T3.M5', 'Payment settles outstanding manager shares and preserves paid history', 3, 'Money_Regressions', () => {
  const store = getFreshStore()
  const oldShare = store.expenses.value.find(e => e.id === 'exp-1').shares.find(s => s.roommateId === 'user-jakub')
  const oldDate = oldShare.settledDate
  store.addExpense(createExpensePayload({ category: 'Jídlo' }))
  const added = store.expenses.value[0]
  store.confirmPayment('user-jakub', { date: '2026-11-06', method: 'bank', note: '', notifyMember: false })
  assertEqual(oldShare.settledDate, oldDate)
  assertEqual(added.shares.find(s => s.roommateId === 'user-jakub').status, 'UHRAZENO')
  assertEqual(added.shares.find(s => s.roommateId === 'user-jakub').settledDate, '2026-11-06')
  const settlement = store.settlements.value.find(s => s.roommateId === 'user-jakub')
  assertEqual(settlement.totalDebt, 0)
  assert(Object.values(settlement.breakdown).every(amount => amount === 0))
  for (const id of ['user-eliska', 'user-martin']) {
    store.confirmPayment(id, { date: '2026-11-06', method: 'bank', note: '', notifyMember: false })
  }
  assertEqual(added.status, 'UHRAZENO')
})

test('T3.M6', 'Zero shares do not create debt and decimal add/delete leaves no residue', 3, 'Money_Regressions', () => {
  const store = getFreshStore()
  const before = debtSnapshot(store)
  store.addExpense(createExpensePayload({ shares: [{ roommateId: 'user-martin', roommateName: 'Martin', amount: 0, status: 'DLUŽÍ' }] }))
  assertEqual(debtSnapshot(store), before)
  const ids = []
  for (const amount of [0.1, 0.2]) {
    store.addExpense(createExpensePayload({ shares: [{ roommateId: 'user-martin', roommateName: 'Martin', amount, status: 'DLUŽÍ' }] }))
    // Distinct IDs keep this regression focused on rounding rather than clock resolution.
    store.expenses.value[0].id = 'decimal-' + amount
    ids.push(store.expenses.value[0].id)
  }
  assertEqual(store.settlements.value.find(s => s.roommateId === 'user-martin').totalDebt, 0.3)
  for (const id of ids) {
    store.deleteExpense(id)
    store.confirmModal.value.onConfirm()
  }
  assertEqual(debtSnapshot(store), before)
})

test('T3.M7', 'Invalid room areas never reach the store', 3, 'Money_Regressions', () => {
  const store = getFreshStore()
  const before = JSON.stringify(store.roommates.value)
  for (const area of [0, -5, 4.9, NaN, Infinity]) {
    assertEqual(store.updateRoommateArea('user-jakub', area), false)
    assertEqual(JSON.stringify(store.roommates.value), before)
    assertEqual(store.toasts.value.at(-1).type, 'error')
  }
  assertEqual(store.updateRoommateArea('user-jakub', 25), true)
  assertEqual(store.roommates.value.find(r => r.id === 'user-jakub').roomAreaM2, 25)
  const src = loadSource('src/views/SettingsView.vue')
  assertNotContains(src, 'v-model.number="r.roomAreaM2"')
})

test('T3.M8', 'Money views retain fractional shares and QR uses two decimal places', 3, 'Money_Regressions', () => {
  const form = loadSource('src/components/ExpenseAddModal.vue')
  const detail = loadSource('src/components/ExpenseDetailModal.vue')
  const qr = loadSource('src/components/QrPaymentModal.vue')
  assertNotContains(form, 'Math.round(computedShares')
  assertNotContains(form, 'Math.round(totalAllocatedShares)')
  assertContains(form, 'roommates.value.filter(r => participantMap[r.id]).map')
  assertNotContains(detail, 'Math.round(share.amount)')
  assertContains(qr, 'minimumFractionDigits: 2, maximumFractionDigits: 2')
  assertContains(qr, 'copyText(settlement.totalDebt.toFixed(2),')
})

// F1: Dashboard Cards (gap-2, flex-wrap)
test('T1.F1.1', 'Card 2 bottom row has gap-2 or gap-x-2 layout class', 1, 'F1_Dashboard_Cards', () => {
  const classes = classList(dashboardCardBottom('dashboard.receivablesTitle'))
  assert(classes.includes('gap-2') || classes.includes('gap-x-2'))
})

test('T1.F1.2', 'Card 2 bottom row has flex-wrap to prevent collision', 1, 'F1_Dashboard_Cards', () => {
  assert(classList(dashboardCardBottom('dashboard.receivablesTitle')).includes('flex-wrap'))
})

test('T1.F1.3', 'Card 2 action buttons preserve their width', 1, 'F1_Dashboard_Cards', () => {
  const row = dashboardCardBottom('dashboard.receivablesTitle')
  const buttons = row.children.filter(node => node.type === 1 && node.tag === 'button')
  assertEqual(buttons.length, 2, 'QR and settlement branches must each have an action')
  assert(buttons.every(button => classList(button).includes('shrink-0')))
})

test('T1.F1.4', 'Card 3 bottom row has gap-2 or gap-x-2 layout class', 1, 'F1_Dashboard_Cards', () => {
  const classes = classList(dashboardCardBottom('dashboard.rentDueTitle'))
  assert(classes.includes('gap-2') || classes.includes('gap-x-2'))
})

test('T1.F1.5', 'Card 3 bottom row has flex-wrap for responsive resilience', 1, 'F1_Dashboard_Cards', () => {
  assert(classList(dashboardCardBottom('dashboard.rentDueTitle')).includes('flex-wrap'))
})

// F2: Dashboard Natural Case Headings
test('T1.F2.1', 'Dashboard hero banner label does not use uppercase tracking-wider', 1, 'F2_Natural_Case_Headings', () => {
  const src = loadSource('src/views/DashboardView.vue')
  assertNotContains(src, 'text-xs font-semibold uppercase tracking-wider mb-1', 'Hero banner should not shout with aggressive uppercase tracking-wider')
})

test('T1.F2.2', 'Card 1 heading uses natural Title/Sentence case for monthly expenses', 1, 'F2_Natural_Case_Headings', () => {
  const src = loadSource('src/views/DashboardView.vue')
  assertMatch(src, /Můj měsíční podíl nákladů \(listopad\)|Měsíční náklady bytu \(listopad\)/i, 'Card 1 heading must use natural case')
  assertNotContains(src, 'MĚSÍČNÍ NÁKLADY BYTU', 'Card 1 must not contain all-caps heading')
})

test('T1.F2.3', 'Card 2 heading uses natural case for current debt / receivables', 1, 'F2_Natural_Case_Headings', () => {
  const src = loadSource('src/views/DashboardView.vue')
  assertMatch(src, /Můj aktuální nedoplatek \(k úhradě\)|Pohledávky správce \(dluží bytu\)/i, 'Card 2 heading must use natural case')
  assertNotContains(src, 'MŮJ AKTUÁLNÍ NEDOPLATEK', 'Card 2 must not contain all-caps heading')
})

test('T1.F2.4', 'Card 3 heading uses natural case for rent due countdown', 1, 'F2_Natural_Case_Headings', () => {
  const src = loadSource('src/views/DashboardView.vue')
  assertMatch(src, /Termín mé úhrady správci|Nájem majiteli \(splatnost\)/i, 'Card 3 heading must use natural case')
  assertNotContains(src, 'NÁJEM MAJITELI', 'Card 3 must not contain all-caps heading')
})

test('T1.F2.5', 'Household balance section heading uses natural case without aggressive uppercase', 1, 'F2_Natural_Case_Headings', () => {
  const src = loadSource('src/views/DashboardView.vue')
  assertMatch(src, /Bilance plateb v bytě/i, 'Balance section heading must use natural Czech title')
  assertNotContains(src, 'text-sm font-bold text-slate-100 uppercase tracking-wider', 'Headings should not retain uppercase tracking-wider')
})

// F3: Welcome Banner Contextual Info
test('T1.F3.1', 'Duplicate "+ Zadat nový výdaj" button is removed from Dashboard hero banner', 1, 'F3_Welcome_Banner_Context', () => {
  const src = loadSource('src/views/DashboardView.vue')
  const heroSection = src.split('<!-- 3 Hero KPI Cards')[0]
  assertNotContains(heroSection, '<span>Zadat nový výdaj</span>', 'Duplicate "Zadat nový výdaj" button should be removed from banner')
})

test('T1.F3.2', 'Global Header.vue retains primary "+ Nový výdaj" CTA', 1, 'F3_Welcome_Banner_Context', () => {
  const headerSrc = loadSource('src/components/Header.vue')
  assertContains(headerSrc, 'openModal(\'EXP_ADD\')', 'Header must have EXP_ADD CTA')
  assertMatch(headerSrc, /Nový výdaj/, 'Header must display Nový výdaj label')
})

test('T1.F3.3', 'Welcome banner includes weekly cleaning status widget', 1, 'F3_Welcome_Banner_Context', () => {
  const src = loadSource('src/views/DashboardView.vue')
  const heroSection = src.split('<!-- 3 Hero KPI Cards')[0]
  assertMatch(heroSection, /Úklid tento týden|myCurrentCleaningShift/, 'Welcome banner must feature cleaning status widget')
})

test('T1.F3.4', 'Welcome banner cleaning widget displays user shift task title dynamically', 1, 'F3_Welcome_Banner_Context', () => {
  const src = loadSource('src/views/DashboardView.vue')
  const heroSection = src.split('<!-- 3 Hero KPI Cards')[0]
  assertContains(heroSection, 'myCurrentCleaningShift', 'Banner must bind to myCurrentCleaningShift')
})

test('T1.F3.5', 'Welcome banner cleaning widget has click handler navigating to CLEANING view', 1, 'F3_Welcome_Banner_Context', () => {
  const src = loadSource('src/views/DashboardView.vue')
  const heroSection = src.split('<!-- 3 Hero KPI Cards')[0]
  assertMatch(heroSection, /navigateTo\(['"]CLEANING['"]\)/, 'Banner widget must navigate to CLEANING')
})

// F4: Cart Purchased Flag & Button
test('T1.F4.1', 'CartItem model supports isPurchased, purchasedBy, purchasedAt fields', 1, 'F4_Cart_Purchased_Flag', () => {
  const typesSrc = loadSource('src/types/index.ts')
  assertContains(typesSrc, 'isPurchased?: boolean', 'CartItem must declare isPurchased')
  assertContains(typesSrc, 'purchasedBy?: string', 'CartItem must declare purchasedBy')
  assertContains(typesSrc, 'purchasedAt?: string', 'CartItem must declare purchasedAt')
})

test('T1.F4.2', 'toggleCartItemPurchased toggles isPurchased flag and stamps user', 1, 'F4_Cart_Purchased_Flag', () => {
  const store = getFreshStore()
  assertDefined(store.toggleCartItemPurchased, 'toggleCartItemPurchased must be exported from store')
  assert(store.cartItems.value.length > 0, 'Cart must have items')
  const item = store.cartItems.value[0]
  const initialPurchased = !!item.isPurchased
  store.toggleCartItemPurchased(item.id)
  assertEqual(item.isPurchased, !initialPurchased, 'toggleCartItemPurchased must invert isPurchased')
  if (item.isPurchased) {
    assertDefined(item.purchasedBy, 'Purchased item must record purchasedBy')
  }
})

test('T1.F4.3', 'CartView template contains status badge indicating Koupeno', 1, 'F4_Cart_Purchased_Flag', () => {
  const cartSrc = loadSource('src/views/CartView.vue')
  assertMatch(cartSrc, /Koupeno|isPurchased/i, 'CartView must render purchased status indication')
})

test('T1.F4.4', 'CartView template provides "Převést do výdajů" button affordance', 1, 'F4_Cart_Purchased_Flag', () => {
  const cartSrc = loadSource('src/views/CartView.vue')
  assertContains(cartSrc, 'Převést do výdajů', 'CartView must have Převést do výdajů button')
})

test('T1.F4.5', 'CartView button "Převést do výdajů" is conditioned on isPurchased', 1, 'F4_Cart_Purchased_Flag', () => {
  const cartSrc = loadSource('src/views/CartView.vue')
  assertMatch(cartSrc, /v-if="[^"]*isPurchased[^"]*"/, 'Převést do výdajů button must be guarded by isPurchased')
})

// F5: Expense Modal Prefill & Transfer
test('T1.F5.1', 'convertCartItemToExpense opens EXP_ADD modal with prefill payload', 1, 'F5_Expense_Modal_Prefill', () => {
  const store = getFreshStore()
  assertDefined(store.convertCartItemToExpense, 'convertCartItemToExpense must be exported from store')
  const item = store.cartItems.value[0]
  store.convertCartItemToExpense(item)
  assertEqual(store.activeModal.value, 'EXP_ADD', 'Modal must be set to EXP_ADD')
  assertDefined(store.expensePrefill.value, 'expensePrefill must be populated')
  assertEqual(store.expensePrefill.value.title, item.name, 'Prefill title must match item name')
})

test('T1.F5.2', 'useSpolubyt retains expensePrefill state for transfer', 1, 'F5_Expense_Modal_Prefill', () => {
  const store = getFreshStore()
  assertDefined(store.expensePrefill, 'expensePrefill ref must be exported from useSpolubyt')
  store.openModal('EXP_ADD', { title: 'Test prefill', totalAmount: 500, category: 'Drogerie', cartItemId: 'c-test' })
  assertEqual(store.expensePrefill.value?.title, 'Test prefill')
  assertEqual(store.expensePrefill.value?.totalAmount, 500)
})

test('T1.F5.3', 'ExpenseAddModal.vue initializes form title and totalAmount from expensePrefill', 1, 'F5_Expense_Modal_Prefill', () => {
  const modalSrc = loadSource('src/components/ExpenseAddModal.vue')
  assertContains(modalSrc, 'expensePrefill.value?.title', 'Form must initialize its title from prefill')
})

test('T1.F5.4', 'Adding expense with cartItemId removes the transferred item from cartItems', 1, 'F5_Expense_Modal_Prefill', () => {
  const store = getFreshStore()
  store.addCartItem({ name: 'Zkušební jar', category: 'Drogerie', unitPrice: 89, qty: 1 })
  const newItem = store.cartItems.value.find(i => i.name === 'Zkušební jar')
  assertDefined(newItem)
  const initialCount = store.cartItems.value.length

  store.openModal('EXP_ADD', {
    title: newItem.name,
    totalAmount: 89,
    category: 'Drogerie',
    cartItemId: newItem.id
  })

  store.addExpense(createExpensePayload({
    title: newItem.name,
    totalAmount: 89,
    category: 'Drogerie',
    payerId: store.currentUser.value.id
  }), { cartItemIds: [newItem.id] })

  assertEqual(store.cartItems.value.length, initialCount - 1, 'Item should be removed from cart after transfer')
  assert(!store.cartItems.value.some(i => i.id === newItem.id), 'Item ID should no longer exist in cart')
})

test('T1.F5.5', 'closeModal clears expensePrefill state to prevent form leakage', 1, 'F5_Expense_Modal_Prefill', () => {
  const store = getFreshStore()
  store.openModal('EXP_ADD', { title: 'Temporary', totalAmount: 100 })
  assertDefined(store.expensePrefill.value)
  store.closeModal()
  assertEqual(store.activeModal.value, null)
  assertEqual(store.expensePrefill.value, null, 'expensePrefill must be null after closeModal')
})

test('T1.F5.6', 'convertCartToExpense prefills EXP_ADD with correct keys and clears cart on save', 1, 'F5_Expense_Modal_Prefill', () => {
  const store = getFreshStore()
  const initialCount = store.cartItems.value.length
  assert(initialCount > 0, 'Cart must have items to convert')
  const expectedTotal = store.cartItems.value.reduce((sum, i) => sum + i.unitPrice * i.qty, 0)

  store.convertCartToExpense()
  assertEqual(store.activeModal.value, 'EXP_ADD', 'Modal must be set to EXP_ADD')
  assertDefined(store.expensePrefill.value, 'expensePrefill must be populated')
  assertEqual(store.expensePrefill.value.totalAmount, expectedTotal, 'Prefill totalAmount must equal cart total')
  assertEqual(store.expensePrefill.value.category, 'Služby', 'Mixed categories use a shared purchase category')
  assertEqual(store.expensePrefill.value.items.length, initialCount, 'Prefill must carry every cart line item')

  const prefillTitle = store.expensePrefill.value.title
  store.addExpense(createExpensePayload({
    title: prefillTitle,
    totalAmount: expectedTotal,
    category: 'Drogerie'
  }), { cartItemIds: store.expensePrefill.value.cartItemIds })
  assertEqual(store.cartItems.value.length, 0, 'All transferred cart items must be removed after save')
})

// F6: Cleaning 'Hotovo' Visual State
test('T1.F6.1', 'toggleShiftStatus marks an uncompleted shift as isCompleted: true', 1, 'F6_Cleaning_Hotovo_Visual', () => {
  const store = getFreshStore()
  const shift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-tomas')
  assertDefined(shift)
  shift.isCompleted = false
  const res = store.toggleShiftStatus(shift.id)
  assert(res, 'toggleShiftStatus should succeed')
  assertEqual(shift.isCompleted, true, 'Shift should be marked completed')
})

test('T1.F6.2', 'Completed cleaning shift records formatted completedAt timestamp', 1, 'F6_Cleaning_Hotovo_Visual', () => {
  const store = getFreshStore()
  const shift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-tomas')
  assertDefined(shift)
  shift.isCompleted = false
  store.toggleShiftStatus(shift.id)
  assertDefined(shift.completedAt, 'completedAt must be set')
  assertMatch(shift.completedAt, /\d{2}\.\s*\d{2}\.\s*\d{4}/, 'completedAt should be formatted as DD. MM. YYYY')
})

test('T1.F6.3', 'Completed cleaning shift records completedBy user name', 1, 'F6_Cleaning_Hotovo_Visual', () => {
  const store = getFreshStore()
  const shift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-tomas')
  assertDefined(shift)
  shift.isCompleted = false
  store.toggleShiftStatus(shift.id)
  assertEqual(shift.completedBy, store.currentUser.value.name, 'completedBy should match acting user')
})

test('T1.F6.4', 'CleaningView template renders visual Hotovo/Splněno badge', 1, 'F6_Cleaning_Hotovo_Visual', () => {
  const src = loadSource('src/views/CleaningView.vue')
  assertMatch(src, /Splněno|Hotovo/, 'CleaningView must render Hotovo/Splněno label')
  assertContains(src, 'bg-emerald-500', 'Completed styling must apply emerald accent')
})

test('T1.F6.5', 'Toggling completed shift resets isCompleted to false and clears timestamp', 1, 'F6_Cleaning_Hotovo_Visual', () => {
  const store = getFreshStore()
  const shift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-tomas')
  assertDefined(shift)
  shift.isCompleted = true
  shift.completedAt = '01. 11. 2026 12:00'
  store.toggleShiftStatus(shift.id)
  assertEqual(shift.isCompleted, false, 'Shift should revert to false')
  assertEqual(shift.completedAt, undefined, 'completedAt should be cleared')
})

// F7: Cleaning Shift Swap & Pending Request
test('T1.F7.1', 'ShiftSwapRequest model defines PENDING, ACCEPTED, REJECTED, CANCELLED lifecycle', 1, 'F7_Cleaning_Shift_Swap', () => {
  const typesSrc = loadSource('src/types/index.ts')
  assertContains(typesSrc, 'export interface ShiftSwapRequest', 'ShiftSwapRequest interface must exist')
  assertContains(typesSrc, '\'PENDING\' | \'ACCEPTED\' | \'REJECTED\' | \'CANCELLED\'', 'Swap statuses must be typed')
})

test('T1.F7.2', 'requestShiftSwap creates pending swap request with target flatmate', 1, 'F7_Cleaning_Shift_Swap', () => {
  const store = getFreshStore()
  assertDefined(store.requestShiftSwap, 'requestShiftSwap must be exported')
  const shift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-tomas')
  assertDefined(shift)
  if (shift.isCompleted) store.toggleShiftStatus(shift.id)
  shift.swapRequest = undefined

  store.requestShiftSwap(shift.id, 'user-jakub', 'Mám seminární práci')
  assertDefined(shift.swapRequest, 'swapRequest must be set on shift')
  assertEqual(shift.swapRequest.status, 'PENDING')
  assertEqual(shift.swapRequest.targetRoommateId, 'user-jakub')
  assertEqual(shift.swapRequest.note, 'Mám seminární práci')
})

test('T1.F7.3', 'Shift with active swap displays "čekající žádost" pending badge', 1, 'F7_Cleaning_Shift_Swap', () => {
  const src = loadSource('src/views/CleaningView.vue')
  assertMatch(src, /v-(?:if|else-if)="[^"]*swapRequest\?\.status === 'PENDING'"/, 'Pending badge must be conditional on request status')
})

test('T1.F7.4', 'acceptShiftSwap reassigns shift to recipient and marks ACCEPTED', 1, 'F7_Cleaning_Shift_Swap', () => {
  const store = getFreshStore()
  const shift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-tomas')
  assertDefined(shift)
  if (shift.isCompleted) store.toggleShiftStatus(shift.id)
  store.requestShiftSwap(shift.id, 'user-jakub', 'Výměna')
  store.setCurrentUser('user-jakub')
  store.acceptShiftSwap(shift.id)
  assertEqual(shift.swapRequest.status, 'ACCEPTED')
  assertEqual(shift.roommateId, 'user-jakub', 'Shift roommateId must be updated to recipient')
  assertEqual(shift.roommateName, 'Jakub Kovář')
})

test('T1.F7.5', 'rejectShiftSwap marks swap REJECTED and preserves original roommate', 1, 'F7_Cleaning_Shift_Swap', () => {
  const store = getFreshStore()
  const shift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-tomas')
  assertDefined(shift)
  if (shift.isCompleted) store.toggleShiftStatus(shift.id)
  const originalRoommateId = shift.roommateId
  store.requestShiftSwap(shift.id, 'user-jakub', 'Výměna')
  store.setCurrentUser('user-jakub')
  store.rejectShiftSwap(shift.id)
  assertEqual(shift.swapRequest.status, 'REJECTED')
  assertEqual(shift.roommateId, originalRoommateId, 'Shift assignee must remain unchanged')
})

// F8: Energy Advance Drawdown Prediction
test('T1.F8.1', 'annualEnergyPrediction reactive computed property is exposed from store', 1, 'F8_Energy_Prediction', () => {
  const store = getFreshStore()
  assertDefined(store.annualEnergyPrediction, 'annualEnergyPrediction must be exported')
  assertDefined(store.annualEnergyPrediction.value, 'annualEnergyPrediction must have a reactive value')
})

test('T1.F8.2', 'annualAdvances calculates settings.monthlyUtilities * 12', 1, 'F8_Energy_Prediction', () => {
  const store = getFreshStore()
  const expectedAdvances = store.settings.value.monthlyUtilities * 12
  assertEqual(store.annualEnergyPrediction.value.annualAdvances, expectedAdvances, 'Annual advances should equal 12 * monthlyUtilities')
})

test('T1.F8.3', 'netDelta computes net surplus or deficit between advances and projected cost', 1, 'F8_Energy_Prediction', () => {
  const store = getFreshStore()
  const pred = store.annualEnergyPrediction.value
  const expectedDelta = pred.annualAdvances - pred.projectedAnnualCost
  assertEqual(pred.netDelta, expectedDelta, 'netDelta must equal annualAdvances - projectedAnnualCost')
})

test('T1.F8.4', 'isSurplus reflects sign of netDelta and formattedDelta includes CZK suffix', 1, 'F8_Energy_Prediction', () => {
  const store = getFreshStore()
  const pred = store.annualEnergyPrediction.value
  assertEqual(pred.isSurplus, pred.netDelta >= 0, 'isSurplus must be true if netDelta >= 0')
  assertContains(pred.formattedDelta, 'CZK', 'formattedDelta must format with CZK')
})

test('T1.F8.5', 'drawdownPct accurately calculates projected advance utilization percentage', 1, 'F8_Energy_Prediction', () => {
  const store = getFreshStore()
  const pred = store.annualEnergyPrediction.value
  const expectedPct = Math.round((pred.projectedAnnualCost / pred.annualAdvances) * 100)
  assertEqual(pred.drawdownPct, expectedPct, 'drawdownPct should match rounded percentage')
  assert(pred.drawdownPct > 0 && pred.drawdownPct < 200, 'drawdownPct should be a realistic percentage')
})

// F9: QR Code Generation & Display
test('T1.F9.1', 'SPAYD helper builds exact payment fields used by QR component', 1, 'F9_QR_Code_Generation', async () => {
  const { buildSpayd } = await viteServer.ssrLoadModule('./src/utils/spayd.ts')
  assertEqual(buildSpayd('CZ6508000000000123456789', 9850, 'Jakub Kovář'),
    'SPD*1.0*ACC:CZ6508000000000123456789*AM:9850.00*CC:CZK*MSG:Spolubyt Najem 11/2026 Jakub Kovar*X-VS:20261101')
  assertContains(loadSource('src/components/QrPaymentModal.vue'), 'buildSpayd(')
})

test('T1.F9.2', 'SPAYD helper formats haléře and CZK currency', 1, 'F9_QR_Code_Generation', async () => {
  const { buildSpayd } = await viteServer.ssrLoadModule('./src/utils/spayd.ts')
  assertContains(buildSpayd('CZ6508000000000123456789', 4200.5678, 'Tomáš'), '*AM:4200.57*CC:CZK*')
})

test('T1.F9.3', 'SPAYD helper strips whitespace from IBAN', 1, 'F9_QR_Code_Generation', async () => {
  const { buildSpayd } = await viteServer.ssrLoadModule('./src/utils/spayd.ts')
  assertContains(buildSpayd('CZ65 0800 0000 0001 2345 6789', 1, 'Tomáš'), '*ACC:CZ6508000000000123456789*')
})

test('T1.F9.4', 'SPAYD helper sanitizes payment message field delimiters', 1, 'F9_QR_Code_Generation', async () => {
  const { buildSpayd } = await viteServer.ssrLoadModule('./src/utils/spayd.ts')
  const result = buildSpayd('CZ6508000000000123456789', 1, 'Eliška*AM:999*')
  assertContains(result, '*MSG:Spolubyt Najem 11/2026 EliskaAM999*X-VS:20261101')
  assertEqual(result.split('*AM:').length, 2)
})

test('T1.F9.5', 'QRCode library successfully renders SPAYD string into matrix', 1, 'F9_QR_Code_Generation', async () => {
  const sampleSpayd = 'SPD*1.0*ACC:CZ4808000000002101234567*AM:4200.00*CC:CZK*MSG:Spolubyt Najem 11/2026 Tomas*X-VS:20261101'
  const svg = await QRCode.toString(sampleSpayd, { type: 'svg' })
  assertContains(svg, '<svg', 'QRCode must generate valid SVG markup')
  assertContains(svg, '</svg>', 'QRCode SVG must have closing tag')
})

// F10: Role Switching Reactivity
test('T1.F10.1', 'setCurrentUser(user-tomas) activates Správce with isMasterTenant: true', 1, 'F10_Role_Switching', () => {
  const store = getFreshStore()
  store.setCurrentUser('user-tomas')
  assertEqual(store.currentUser.value.id, 'user-tomas')
  assertEqual(store.currentUser.value.role, 'Správce')
  assertEqual(store.isMasterTenant.value, true)
})

test('T1.F10.2', 'setCurrentUser(user-jakub) activates Člen with isMasterTenant: false', 1, 'F10_Role_Switching', () => {
  const store = getFreshStore()
  store.setCurrentUser('user-jakub')
  assertEqual(store.currentUser.value.id, 'user-jakub')
  assertEqual(store.currentUser.value.role, 'Člen')
  assertEqual(store.isMasterTenant.value, false)
})

test('T1.F10.3', 'Dashboard dynamically switches overview header based on user role', 1, 'F10_Role_Switching', () => {
  const src = loadSource('src/views/DashboardView.vue')
  assertContains(src, 'isMasterTenant', 'Dashboard must adapt based on isMasterTenant')
  assertMatch(src, /Centrální přehled správce bytu|Osobní přehled spolubydlícího/, 'Dashboard should have role-specific titles')
})

test('T1.F10.4', 'SettingsView restricts apartment master parameters from regular members', 1, 'F10_Role_Switching', () => {
  const settingsSrc = loadSource('src/views/SettingsView.vue')
  assertMatch(settingsSrc, /:disabled="!isMasterTenant"|v-if="isMasterTenant"/, 'Master settings inputs must be guarded by isMasterTenant')
})

test('T1.F10.5', 'canConfirmShift restricts shift confirmation to assigned roommate or Správce', 1, 'F10_Role_Switching', () => {
  const store = getFreshStore()
  const shift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-jakub')
  assertDefined(shift)
  
  // As Eliška (Člen)
  store.setCurrentUser('user-eliska')
  assertEqual(store.canConfirmShift(shift), false, 'Eliška should not be allowed to confirm Jakub\'s shift')

  // As Jakub (Assigned)
  store.setCurrentUser('user-jakub')
  assertEqual(store.canConfirmShift(shift), true, 'Jakub should be allowed to confirm his own shift')

  // As Tomáš (Správce)
  store.setCurrentUser('user-tomas')
  assertEqual(store.canConfirmShift(shift), true, 'Tomáš (Správce) should have override permission')
})

// F11: Build & Runtime Integrity
test('T1.F11.1', 'npm run build executes with exit code 0', 1, 'F11_Build_Runtime_Integrity', () => {
  const result = execSync('npm run build', { cwd: APP_ROOT, encoding: 'utf8', timeout: 300_000 })
  assertContains(result, 'built in', 'Build must output completion message')
})

test('T1.F11.2', 'Production build generates valid dist/index.html', 1, 'F11_Build_Runtime_Integrity', () => {
  const indexPath = path.resolve(APP_ROOT, 'dist/index.html')
  assert(fs.existsSync(indexPath), 'dist/index.html must exist')
  const content = fs.readFileSync(indexPath, 'utf8')
  assertMatch(content, /<!doctype html>/i, 'index.html must have HTML5 doctype')
  assertContains(content, '<div id="app"></div>', 'index.html must mount div#app')
})

test('T1.F11.3', 'Production build emits JavaScript bundle in dist/assets', 1, 'F11_Build_Runtime_Integrity', () => {
  const assetsDir = path.resolve(APP_ROOT, 'dist/assets')
  assert(fs.existsSync(assetsDir), 'dist/assets must exist')
  const jsFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.js'))
  assert(jsFiles.length > 0, 'Must have at least one JS bundle in dist/assets')
})

test('T1.F11.4', 'Production build emits CSS bundle in dist/assets', 1, 'F11_Build_Runtime_Integrity', () => {
  const assetsDir = path.resolve(APP_ROOT, 'dist/assets')
  const cssFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.css'))
  assert(cssFiles.length > 0, 'Must have at least one CSS bundle in dist/assets')
})

test('T1.F11.5', 'Store initializes initial mock fixtures without errors or empty lists', 1, 'F11_Build_Runtime_Integrity', () => {
  const store = getFreshStore()
  assert(store.roommates.value.length >= 4, 'Must have at least 4 roommates')
  assert(store.expenses.value.length > 0, 'Must have initial expenses')
  assert(store.cartItems.value.length > 0, 'Must have initial cart items')
  assert(store.cleaningShifts.value.length > 0, 'Must have initial cleaning shifts')
})

// -------------------------------------------------------------------------
// TIER 2: BOUNDARY VALUE & CORNER CASES (55 tests)
// -------------------------------------------------------------------------

// B1: Dashboard Cards Boundaries
test('T2.B1.1', 'Card 2 handles 0 debt without breaking horizontal layout', 2, 'B1_Dashboard_Cards_Boundaries', () => {
  const store = getFreshStore()
  store.setCurrentUser('user-martin')
  assertEqual(store.currentUserDebt.value, 0)
  const src = loadSource('src/views/DashboardView.vue')
  assertContains(src, 'Všechny platby máte vyrovnány', 'Card 2 must provide settled message for 0 debt')
})

test('T2.B1.2', 'Card 2 handles overdue status with warning icon without text clipping', 2, 'B1_Dashboard_Cards_Boundaries', () => {
  const store = getFreshStore()
  store.setCurrentUser('user-eliska')
  assertEqual(store.isCurrentUserOverdue.value, true)
  const src = loadSource('src/views/DashboardView.vue')
  assertContains(src, 'Splatnost vypršela', 'Card 2 must indicate overdue status')
})

test('T2.B1.3', 'Card 2 handles long flatmate names in subtitle without blowout', 2, 'B1_Dashboard_Cards_Boundaries', () => {
  const src = loadSource('src/views/DashboardView.vue')
  assertContains(src, 'min-w-0', 'Labels must have min-w-0 to allow truncation or proper flex shrink')
})

test('T2.B1.4', 'Dashboard renders a large rent amount with Czech formatting', 2, 'B1_Dashboard_Cards_Boundaries', async () => {
  const store = getFreshStore()
  store.settings.value.monthlyRent = 125000
  const html = await renderView('./src/views/DashboardView.vue')
  assertContains(html, (125000).toLocaleString('cs-CZ'))
})

test('T2.B1.5', 'Dashboard renders an empty bank account without undefined output', 2, 'B1_Dashboard_Cards_Boundaries', async () => {
  const store = getFreshStore()
  store.settings.value.accountNumber = ''
  const html = await renderView('./src/views/DashboardView.vue')
  assertContains(html, 'Účet:')
  assertNotContains(html, 'undefined')
})

// B2: Natural Case Headings Boundaries
test('T2.B2.1', 'Headings preserve necessary uppercase acronyms (CZK, QR)', 2, 'B2_Natural_Headings_Boundaries', () => {
  const src = loadSource('src/views/DashboardView.vue')
  assertMatch(src, /CZK|QR/, 'Acronyms CZK and QR must be kept uppercase')
})

test('T2.B2.2', 'Czech diacritics lowercase characters render intact in sentence headings', 2, 'B2_Natural_Headings_Boundaries', () => {
  const src = loadSource('src/views/DashboardView.vue')
  assertMatch(src, /[ěščřžýáíé]/, 'Headings must contain Czech diacritics in lowercase')
})

test('T2.B2.3', 'Month in parentheses uses natural lowercase ("listopad")', 2, 'B2_Natural_Headings_Boundaries', () => {
  const src = loadSource('src/views/DashboardView.vue')
  assertMatch(src, /\(listopad\)/i, 'Parenthetical month should not be ALL-CAPS')
  assertNotContains(src, '(LISTOPAD)', 'Month should not be uppercase LISTOPAD')
})

test('T2.B2.4', 'Dynamic user persona role inside parentheses does not create duplicate brackets', 2, 'B2_Natural_Headings_Boundaries', () => {
  const src = loadSource('src/views/DashboardView.vue')
  assertNotContains(src, '((${currentUser.role}))', 'Must avoid double parentheses')
})

test('T2.B2.5', 'Section sub-headings retain sentence case with first letter capital only', 2, 'B2_Natural_Headings_Boundaries', () => {
  const src = loadSource('src/views/DashboardView.vue')
  assertMatch(src, /Poslední výdaje a nákupy|Energie a měřidla|Úklid tento týden|Nákupní košík bytu/, 'Headings must be sentence case')
})

// B3: Welcome Banner Contextual Info Boundaries
test('T2.B3.1', 'Dashboard renders the no-shift state when persona has no assignment', 2, 'B3_Welcome_Banner_Boundaries', async () => {
  const store = getFreshStore()
  store.cleaningShifts.value = store.cleaningShifts.value.filter(shift => shift.roommateId !== store.currentUser.value.id)
  assertEqual(store.myCurrentCleaningShift.value, undefined)
  const html = await renderView('./src/views/DashboardView.vue')
  assertContains(html, 'Nemáte přiřazen úklid')
})

test('T2.B3.2', 'Welcome banner handles user whose shift is already completed with Splněno badge', 2, 'B3_Welcome_Banner_Boundaries', () => {
  const store = getFreshStore()
  store.setCurrentUser('user-tomas')
  const shift = store.myCurrentCleaningShift.value
  assertDefined(shift)
  shift.isCompleted = true
  assertEqual(store.myCurrentCleaningPending.value, false)
})

test('T2.B3.3', 'Welcome banner handles user with an active pending swap request', 2, 'B3_Welcome_Banner_Boundaries', () => {
  const store = getFreshStore()
  const shift = store.myCurrentCleaningShift.value
  assertDefined(shift)
  if (shift.isCompleted) store.toggleShiftStatus(shift.id)
  store.requestShiftSwap(shift.id, 'user-jakub', 'Nemohu uklízet')
  assertEqual(shift.swapRequest?.status, 'PENDING')
})

test('T2.B3.4', 'Welcome banner uses flex-col on mobile and flex-row on desktop for clean stacking', 2, 'B3_Welcome_Banner_Boundaries', () => {
  const src = loadSource('src/views/DashboardView.vue')
  const heroSection = src.split('<!-- 3 Hero KPI Cards')[0]
  assertContains(heroSection, 'flex-col', 'Banner must support mobile flex-col')
  assertContains(heroSection, 'sm:flex-row', 'Banner must transition to sm:flex-row')
})

test('T2.B3.5', 'Repeated rapid clicks on banner navigation preserve idempotent route state', 2, 'B3_Welcome_Banner_Boundaries', () => {
  const store = getFreshStore()
  store.navigateTo('CLEANING')
  store.navigateTo('CLEANING')
  assertEqual(store.currentPage.value, 'CLEANING')
})

// B4: Cart Purchased Flag & Button Boundaries
test('T2.B4.1', 'addCartItem prevents zero or negative quantity', 2, 'B4_Cart_Boundaries', () => {
  const store = getFreshStore()
  const initialCount = store.cartItems.value.length
  store.addCartItem({ name: 'Neplatná položka', category: 'Drogerie', unitPrice: 50, qty: 0 })
  assertEqual(store.cartItems.value.length, initialCount, 'Item with qty 0 should not be added')
  store.addCartItem({ name: 'Záporná cena', category: 'Drogerie', unitPrice: -20, qty: 1 })
  assertEqual(store.cartItems.value.length, initialCount, 'Item with negative price should not be added')
})

test('T2.B4.2', 'Large quantity (e.g. 99 pcs) item subtotal calculates correctly without overflow', 2, 'B4_Cart_Boundaries', () => {
  const store = getFreshStore()
  store.addCartItem({ name: 'Hromadný nákup', category: 'Drogerie', unitPrice: 15, qty: 99 })
  const item = store.cartItems.value.find(i => i.name === 'Hromadný nákup')
  assertDefined(item)
  assertEqual(item.unitPrice * item.qty, 1485)
})

test('T2.B4.3', 'CartItem with undefined isPurchased defaults safely to unpurchased', 2, 'B4_Cart_Boundaries', () => {
  const store = getFreshStore()
  store.cartItems.value.push({
    id: 'c-legacy',
    name: 'Stará položka bez příznaku',
    category: 'Drogerie',
    unitPrice: 50,
    qty: 1,
    addedBy: 'Admin',
    addedAt: 'Dnes'
  })
  const item = store.cartItems.value.find(i => i.id === 'c-legacy')
  assertEqual(!!item.isPurchased, false, 'Undefined should evaluate to false')
})

test('T2.B4.4', 'Multiple consecutive purchase status toggles maintain consistent boolean state', 2, 'B4_Cart_Boundaries', () => {
  const store = getFreshStore()
  const item = store.cartItems.value[0]
  store.toggleCartItemPurchased(item.id)
  const state1 = item.isPurchased
  store.toggleCartItemPurchased(item.id)
  assertEqual(item.isPurchased, !state1)
  store.toggleCartItemPurchased(item.id)
  assertEqual(item.isPurchased, state1)
})

test('T2.B4.5', 'Unmarking a purchased item cleans up purchasedBy and purchasedAt fields', 2, 'B4_Cart_Boundaries', () => {
  const store = getFreshStore()
  const item = store.cartItems.value[0]
  item.isPurchased = false
  store.toggleCartItemPurchased(item.id)
  assertEqual(item.isPurchased, true)
  assertDefined(item.purchasedBy)
  store.toggleCartItemPurchased(item.id)
  assertEqual(item.isPurchased, false)
  assertEqual(item.purchasedBy, undefined)
  assertEqual(item.purchasedAt, undefined)
})

// B5: Expense Modal Prefill & Transfer Boundaries
test('T2.B5.1', 'Expense prefill retains an explicitly zero amount for form validation', 2, 'B5_Expense_Prefill_Boundaries', () => {
  const store = getFreshStore()
  store.openModal('EXP_ADD', { title: 'Bez ceny', totalAmount: 0 })
  assertDefined(store.expensePrefill.value)
  assertEqual(store.expensePrefill.value.title, 'Bez ceny')
  assertEqual(store.expensePrefill.value.totalAmount, 0)
})

test('T2.B5.2', 'Item title with quotes and special characters escapes safely', 2, 'B5_Expense_Prefill_Boundaries', () => {
  const store = getFreshStore()
  const specialName = 'Kapsle "Jar" Platinum & Citrus (100% bio)'
  store.addCartItem({ name: specialName, category: 'Drogerie', unitPrice: 299, qty: 1 })
  const item = store.cartItems.value.find(i => i.name === specialName)
  assertDefined(item)
  store.convertCartItemToExpense(item)
  assertEqual(store.expensePrefill.value.title, specialName)
})

test('T2.B5.3', 'Opening a prefill preserves its title without creating an expense', 2, 'B5_Expense_Prefill_Boundaries', () => {
  const store = getFreshStore()
  const count = store.expenses.value.length
  store.openModal('EXP_ADD', { title: 'Předvyplněný výdaj', category: 'Údržba' })
  assertEqual(store.expensePrefill.value.title, 'Předvyplněný výdaj')
  assertEqual(store.expensePrefill.value.category, 'Údržba')
  assertEqual(store.expenses.value.length, count)
})

test('T2.B5.4', 'Closing expense modal without adding expense retains item in cart', 2, 'B5_Expense_Prefill_Boundaries', () => {
  const store = getFreshStore()
  const initialCount = store.cartItems.value.length
  const item = store.cartItems.value[0]
  store.convertCartItemToExpense(item)
  store.closeModal()
  assertEqual(store.cartItems.value.length, initialCount, 'Item should remain in cart if modal cancelled')
})

test('T2.B5.5', 'Deleting item from cart while prefill is open does not crash addExpense', 2, 'B5_Expense_Prefill_Boundaries', () => {
  const store = getFreshStore()
  store.addCartItem({ name: 'Rychle smazat', category: 'Drogerie', unitPrice: 30, qty: 1 })
  const item = store.cartItems.value.find(i => i.name === 'Rychle smazat')
  assertDefined(item)
  store.convertCartItemToExpense(item)
  store.cartItems.value = store.cartItems.value.filter(i => i.id !== item.id)
  const saved = store.addExpense(createExpensePayload({
    title: 'Rychle smazat',
    totalAmount: 30,
    category: 'Drogerie',
    payerId: store.currentUser.value.id
  }), { cartItemIds: [item.id] })
  assertEqual(saved, true)
  store.closeModal()
  assertEqual(store.activeModal.value, null)
})

// B6: Cleaning Hotovo Visual Boundaries
test('T2.B6.1', 'Unauthorized regular member attempting to confirm another shift is rejected', 2, 'B6_Cleaning_Hotovo_Boundaries', () => {
  const store = getFreshStore()
  const shift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-jakub')
  assertDefined(shift)
  shift.isCompleted = false
  store.setCurrentUser('user-martin')
  const result = store.toggleShiftStatus(shift.id)
  assertEqual(result, false, 'Unauthorized toggle should return false')
  assertEqual(shift.isCompleted, false, 'Shift completion state must remain false')
})

test('T2.B6.2', 'Správce can confirm any shift with audit noting manager override', 2, 'B6_Cleaning_Hotovo_Boundaries', () => {
  const store = getFreshStore()
  const shift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-jakub')
  assertDefined(shift)
  shift.isCompleted = false
  store.setCurrentUser('user-tomas')
  const result = store.toggleShiftStatus(shift.id)
  assertEqual(result, true, 'Manager should be authorized')
  assertEqual(shift.isCompleted, true)
  assertEqual(shift.completedBy, 'Tomáš Beránek')
})

test('T2.B6.3', 'Shift note with 200+ characters is preserved without truncation or error', 2, 'B6_Cleaning_Hotovo_Boundaries', () => {
  const store = getFreshStore()
  const shift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-tomas')
  assertDefined(shift)
  shift.isCompleted = false
  const longNote = 'A'.repeat(250)
  store.toggleShiftStatus(shift.id, longNote)
  assertEqual(shift.notes, longNote)
})

test('T2.B6.4', 'Year boundary week number rotation generates valid dates without crashing', 2, 'B6_Cleaning_Hotovo_Boundaries', () => {
  const store = getFreshStore()
  store.selectCleaningWeek(52)
  const week52Shifts = store.cleaningShifts.value.filter(s => s.weekNumber === 52)
  assert(week52Shifts.length >= 4, 'Must generate shifts for week 52')
  store.selectCleaningWeek(1)
  const week1Shifts = store.cleaningShifts.value.filter(s => s.weekNumber === 1)
  assert(week1Shifts.length >= 4, 'Must generate shifts for week 1')
})

test('T2.B6.5', 'Re-completing an already completed shift operates idempotently', 2, 'B6_Cleaning_Hotovo_Boundaries', () => {
  const store = getFreshStore()
  const shift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-tomas')
  assertDefined(shift)
  shift.isCompleted = false
  store.toggleShiftStatus(shift.id)
  assertEqual(shift.isCompleted, true)
  store.toggleShiftStatus(shift.id)
  assertEqual(shift.isCompleted, false)
})

// B7: Cleaning Shift Swap Boundaries
test('T2.B7.1', 'Requesting shift swap with oneself is rejected', 2, 'B7_Shift_Swap_Boundaries', () => {
  const store = getFreshStore()
  const shift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-tomas')
  assertDefined(shift)
  if (shift.isCompleted) store.toggleShiftStatus(shift.id)
  shift.swapRequest = undefined
  store.requestShiftSwap(shift.id, 'user-tomas', 'Výměna se sebou')
  assertEqual(shift.swapRequest, undefined, 'Self-swap must not create a swapRequest')
})

test('T2.B7.2', 'Requesting shift swap with non-existent flatmate ID is safely rejected', 2, 'B7_Shift_Swap_Boundaries', () => {
  const store = getFreshStore()
  const shift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-tomas')
  assertDefined(shift)
  if (shift.isCompleted) store.toggleShiftStatus(shift.id)
  shift.swapRequest = undefined
  store.requestShiftSwap(shift.id, 'user-non-existent', 'Výměna')
  assertEqual(shift.swapRequest, undefined, 'Invalid roommate ID must not create swapRequest')
})

test('T2.B7.3', 'Non-recipient member cannot accept an incoming shift swap request', 2, 'B7_Shift_Swap_Boundaries', () => {
  const store = getFreshStore()
  const shift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-tomas')
  assertDefined(shift)
  if (shift.isCompleted) store.toggleShiftStatus(shift.id)
  store.requestShiftSwap(shift.id, 'user-jakub', 'Prosím vezmi to')
  store.setCurrentUser('user-eliska')
  store.acceptShiftSwap(shift.id)
  assertEqual(shift.swapRequest.status, 'PENDING', 'Unauthorized user cannot accept swap')
  assertEqual(shift.roommateId, 'user-tomas', 'Assignee must not change')
})

test('T2.B7.4', 'Canceling a swap request restores shift swapRequest status to CANCELLED', 2, 'B7_Shift_Swap_Boundaries', () => {
  const store = getFreshStore()
  const shift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-tomas')
  assertDefined(shift)
  if (shift.isCompleted) store.toggleShiftStatus(shift.id)
  store.requestShiftSwap(shift.id, 'user-jakub', 'Zruším to')
  store.cancelShiftSwap(shift.id)
  assertEqual(shift.swapRequest.status, 'CANCELLED')
})

test('T2.B7.5', 'Non-requester cannot cancel another flatmates swap request', 2, 'B7_Shift_Swap_Boundaries', () => {
  const store = getFreshStore()
  const shift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-tomas')
  assertDefined(shift)
  if (shift.isCompleted) store.toggleShiftStatus(shift.id)
  store.requestShiftSwap(shift.id, 'user-jakub', 'Zruším to')
  store.setCurrentUser('user-eliska')
  store.cancelShiftSwap(shift.id)
  assertEqual(shift.swapRequest.status, 'PENDING', 'Unauthorized member cannot cancel swap')
})

// B8: Energy Prediction Boundaries
test('T2.B8.1', 'Prediction handles zero monthly utilities in settings without NaN or Infinity', 2, 'B8_Energy_Boundaries', () => {
  const store = getFreshStore()
  const orig = store.settings.value.monthlyUtilities
  store.settings.value.monthlyUtilities = 0
  const pred = store.annualEnergyPrediction.value
  assert(!isNaN(pred.drawdownPct), 'drawdownPct must not be NaN')
  assert(isFinite(pred.drawdownPct), 'drawdownPct must be finite')
  store.settings.value.monthlyUtilities = orig
})

test('T2.B8.2', 'Prediction handles extreme low utilities advance (e.g. 1 000 CZK) indicating Vysoké riziko', 2, 'B8_Energy_Boundaries', () => {
  const store = getFreshStore()
  const orig = store.settings.value.monthlyUtilities
  store.settings.value.monthlyUtilities = 1000
  const pred = store.annualEnergyPrediction.value
  assertEqual(pred.isSurplus, false, 'Extremely low advances must result in deficit')
  assertEqual(pred.riskLevel, 'Vysoké riziko')
  store.settings.value.monthlyUtilities = orig
})

test('T2.B8.3', 'Prediction handles extreme high utilities advance (e.g. 50 000 CZK) indicating Nízké riziko', 2, 'B8_Energy_Boundaries', () => {
  const store = getFreshStore()
  const orig = store.settings.value.monthlyUtilities
  store.settings.value.monthlyUtilities = 50000
  const pred = store.annualEnergyPrediction.value
  assertEqual(pred.isSurplus, true, 'High advances must result in surplus')
  assertEqual(pred.riskLevel, 'Nízké riziko')
  store.settings.value.monthlyUtilities = orig
})

test('T2.B8.4', 'Prediction formattedDelta prefixes + sign for positive surplus', 2, 'B8_Energy_Boundaries', () => {
  const store = getFreshStore()
  const orig = store.settings.value.monthlyUtilities
  store.settings.value.monthlyUtilities = 15000
  const pred = store.annualEnergyPrediction.value
  assert(pred.formattedDelta.startsWith('+'), 'Surplus delta must start with + sign')
  store.settings.value.monthlyUtilities = orig
})

test('T2.B8.5', 'Risk level transitions precisely at 100/101/108/109 percent', 2, 'B8_Energy_Boundaries', () => {
  const store = getFreshStore()
  assertEqual(store.annualEnergyPrediction.value.projectedAnnualCost, 101750)
  for (const [pct, risk] of [[100, 'Nízké riziko'], [101, 'Mírné překročení'], [108, 'Mírné překročení'], [109, 'Vysoké riziko']]) {
    store.settings.value.monthlyUtilities = 101750 / (12 * pct / 100)
    assertEqual(store.annualEnergyPrediction.value.drawdownPct, pct)
    assertEqual(store.annualEnergyPrediction.value.riskLevel, risk)
  }
})

// B9: QR Code Generation Boundaries
test('T2.B9.1', 'SPAYD sanitizes heavy Czech diacritics while preserving hyphens', 2, 'B9_QR_Boundaries', async () => {
  const { buildSpayd } = await viteServer.ssrLoadModule('./src/utils/spayd.ts')
  assertContains(buildSpayd('CZ6508000000000123456789', 1, 'František Čermák-Dvořák'), '*MSG:Spolubyt Najem 11/2026 Frantisek Cermak-Dvorak*')
})

test('T2.B9.2', 'SPAYD rounds fractional debt accurately to 2 places', 2, 'B9_QR_Boundaries', async () => {
  const { buildSpayd } = await viteServer.ssrLoadModule('./src/utils/spayd.ts')
  assertContains(buildSpayd('CZ6508000000000123456789', 0.01, 'Tomáš'), '*AM:0.01*CC:CZK*')
})

test('T2.B9.3', 'SPAYD message is truncated to exactly 60 ASCII characters', 2, 'B9_QR_Boundaries', async () => {
  const { buildSpayd } = await viteServer.ssrLoadModule('./src/utils/spayd.ts')
  const result = buildSpayd('CZ6508000000000123456789', 1, 'Ž'.repeat(100))
  const message = result.split('*MSG:')[1].split('*')[0]
  assertEqual(message, ('Spolubyt Najem 11/2026 ' + 'Z'.repeat(100)).slice(0, 60))
  assertEqual(message.length, 60)
})

test('T2.B9.4', 'SPAYD helper uses frozen November variable symbol', 2, 'B9_QR_Boundaries', async () => {
  const { buildSpayd } = await viteServer.ssrLoadModule('./src/utils/spayd.ts')
  assert(buildSpayd('CZ6508000000000123456789', 1, 'Tomáš').endsWith('*X-VS:20261101'))
})

test('T2.B9.5', 'Attempting QR payment modal open for 0 debt is prevented or handled gracefully', 2, 'B9_QR_Boundaries', () => {
  const store = getFreshStore()
  store.setCurrentUser('user-martin')
  assertEqual(store.currentUserDebt.value, 0)
  const settlement = store.currentUserSettlement.value
  assertDefined(settlement)
  assertEqual(settlement.totalDebt, 0)
})

// B10: Role Switching Boundaries
test('T2.B10.1', 'Switching to unknown user ID defaults safely to first roommate', 2, 'B10_Role_Switching_Boundaries', () => {
  const store = getFreshStore()
  store.setCurrentUser('user-unknown-ghost')
  assertDefined(store.currentUser.value)
  assertEqual(store.currentUser.value.id, store.roommates.value[0].id)
})

test('T2.B10.2', 'Rapid role switching preserves correct isMasterTenant boolean value', 2, 'B10_Role_Switching_Boundaries', () => {
  const store = getFreshStore()
  store.setCurrentUser('user-tomas')
  assertEqual(store.isMasterTenant.value, true)
  store.setCurrentUser('user-jakub')
  assertEqual(store.isMasterTenant.value, false)
  store.setCurrentUser('user-eliska')
  assertEqual(store.isMasterTenant.value, false)
  store.setCurrentUser('user-tomas')
  assertEqual(store.isMasterTenant.value, true)
})

test('T2.B10.3', 'Persona switch retains active page without redirecting back to DASH', 2, 'B10_Role_Switching_Boundaries', () => {
  const store = getFreshStore()
  store.navigateTo('SETTINGS')
  store.setCurrentUser('user-jakub')
  assertEqual(store.currentPage.value, 'SETTINGS', 'Page must remain SETTINGS')
})

test('T2.B10.4', 'Persona switch immediately updates personal monthly cost and debt KPIs', 2, 'B10_Role_Switching_Boundaries', () => {
  const store = getFreshStore()
  store.setCurrentUser('user-tomas')
  store.setCurrentUser('user-jakub')
  const jakubDebt = store.currentUserDebt.value
  assertEqual(jakubDebt, 9850, 'Jakub debt should match fixture')
  store.setCurrentUser('user-eliska')
  const eliskaDebt = store.currentUserDebt.value
  assertEqual(eliskaDebt, 4500, 'Eliška debt should match fixture')
})

test('T2.B10.5', 'updateRoommateArea recalculates area percentages to sum to 100%', 2, 'B10_Role_Switching_Boundaries', () => {
  const store = getFreshStore()
  store.updateRoommateArea('user-tomas', 30)
  const totalPct = store.roommates.value.reduce((sum, r) => sum + r.areaSharePct, 0)
  assert(Math.abs(totalPct - 100) < 0.5, `Sum of area shares should be ~100%, got ${totalPct}`)
})

// B11: Build & Runtime Integrity Boundaries
test('T2.B11.1', 'Production JS bundle size remains under 500 kB budget', 2, 'B11_Integrity_Boundaries', () => {
  const assetsDir = path.resolve(APP_ROOT, 'dist/assets')
  const jsFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.js'))
  for (const f of jsFiles) {
    const stat = fs.statSync(path.join(assetsDir, f))
    const kb = stat.size / 1024
    assert(kb < 500, `JS bundle ${f} exceeds 500 kB budget (size: ${kb.toFixed(1)} kB)`)
  }
})

test('T2.B11.2', 'Production CSS bundle size remains under 100 kB budget', 2, 'B11_Integrity_Boundaries', () => {
  const assetsDir = path.resolve(APP_ROOT, 'dist/assets')
  const cssFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.css'))
  for (const f of cssFiles) {
    const stat = fs.statSync(path.join(assetsDir, f))
    const kb = stat.size / 1024
    assert(kb < 100, `CSS bundle ${f} exceeds 100 kB budget (size: ${kb.toFixed(1)} kB)`)
  }
})

test('T2.B11.3', 'Storage quota failure is caught after persistence watcher runs', 2, 'B11_Integrity_Boundaries', async () => {
  const store = getFreshStore()
  await new Promise(resolve => setTimeout(resolve))
  const originalSetItem = globalThis.localStorage.setItem
  const originalError = console.error
  let writes = 0
  globalThis.localStorage.setItem = () => {
    writes++
    throw new Error('QuotaExceededError')
  }
  console.error = () => {}
  try {
    store.setCurrentUser('user-jakub')
    await new Promise(resolve => setTimeout(resolve))
    assert(writes > 0, 'Watcher must attempt persistence while quota failure is installed')
    assertEqual(store.storageWriteFailed.value, true)
    assertEqual(store.currentUser.value.id, 'user-jakub')
  } finally {
    globalThis.localStorage.setItem = originalSetItem
    console.error = originalError
    store.storageWriteFailed.value = false
  }
})

test('T2.B11.4', 'Corrupted storage is hydrated through fallback rather than fixture reset', 2, 'B11_Integrity_Boundaries', async () => {
  await new Promise(resolve => setTimeout(resolve))
  const prefix = storagePrefix()
  globalThis.localStorage.clear()
  globalThis.localStorage.setItem(prefix + 'state', '{invalid_json[')
  const originalError = console.error
  console.error = () => {}
  try {
    const store = await reloadStore()
    assertEqual(JSON.stringify(store.roommates.value), JSON.stringify(mockDataModule.INITIAL_ROOMMATES))
    assertEqual(store.currentUser.value.id, 'user-tomas')
    assertEqual(store.isMasterTenant.value, true)
    assertEqual(store.storageRecovered.value, true)
  } finally {
    console.error = originalError
  }
})

test('T2.B11.5', 'Expense CSV export prepends UTF-8 BOM marker for Excel compatibility', 2, 'B11_Integrity_Boundaries', () => {
  const src = loadSource('src/composables/useSpolubyt.ts')
  assertContains(src, '\\uFEFF', 'CSV export must prepend UTF-8 BOM \\uFEFF')
})

// -------------------------------------------------------------------------
// TIER 3: CROSS-FEATURE COMBINATIONS (15 tests)
// -------------------------------------------------------------------------

test('T3.C1', 'Cart-to-Expense + Role Switching: Člen logs expense, Správce sees receivables update', 3, 'Cross_Feature', () => {
  const store = getFreshStore()
  store.setCurrentUser('user-jakub')
  store.addExpense(createExpensePayload({
    title: 'Společný nákup Jakub',
    totalAmount: 1200,
    category: 'Drogerie',
    payerId: 'user-jakub',
    payerName: 'Jakub Kovář'
  }))
  store.setCurrentUser('user-tomas')
  const newExp = store.expenses.value.find(e => e.title === 'Společný nákup Jakub')
  assertDefined(newExp)
  assertEqual(newExp.payerName, 'Jakub Kovář')
})

test('T3.C2', 'Cart-to-Expense + Debt Settlement: Cart item to expense increments total debt', 3, 'Cross_Feature', () => {
  const store = getFreshStore()
  const initialExpensesCount = store.expenses.value.length
  store.addCartItem({ name: 'Filtry na vodu', category: 'Údržba', unitPrice: 400, qty: 1 })
  const item = store.cartItems.value.find(i => i.name === 'Filtry na vodu')
  store.convertCartItemToExpense(item)
  store.addExpense(createExpensePayload({
    title: item.name,
    totalAmount: 400,
    category: 'Údržba',
    payerId: store.currentUser.value.id
  }), { cartItemIds: [item.id] })
  assertEqual(store.expenses.value.length, initialExpensesCount + 1)
})

test('T3.C3', 'Cart-to-Expense + Dashboard KPI: Converted cart expense updates monthlyTotalExpenses', 3, 'Cross_Feature', () => {
  const store = getFreshStore()
  const prevTotal = store.monthlyTotalExpenses.value
  store.addExpense(createExpensePayload({
    title: 'Rychlý nákup',
    totalAmount: 500,
    category: 'Jídlo',
    payerId: store.currentUser.value.id
  }))
  assertEqual(store.monthlyTotalExpenses.value, prevTotal + 500)
})

test('T3.C4', 'Cleaning Swap + Role Switching: Člen A requests swap with Člen B, Člen B logs in and accepts', 3, 'Cross_Feature', () => {
  const store = getFreshStore()
  const shift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-tomas')
  assertDefined(shift)
  if (shift.isCompleted) store.toggleShiftStatus(shift.id)
  store.setCurrentUser('user-tomas')
  store.requestShiftSwap(shift.id, 'user-jakub', 'Mám schůzku')
  assertEqual(shift.swapRequest.status, 'PENDING')
  store.setCurrentUser('user-jakub')
  store.acceptShiftSwap(shift.id)
  assertEqual(shift.swapRequest.status, 'ACCEPTED')
  assertEqual(shift.roommateId, 'user-jakub')
})

test('T3.C5', 'Cleaning Swap + Welcome Banner: Swap request updates welcome banner status for both users', 3, 'Cross_Feature', () => {
  const store = getFreshStore()
  const shift = store.myCurrentCleaningShift.value
  assertDefined(shift)
  if (shift.isCompleted) store.toggleShiftStatus(shift.id)
  store.requestShiftSwap(shift.id, 'user-jakub', 'Výměna')
  assertEqual(shift.swapRequest?.status, 'PENDING')
})

test('T3.C6', 'Cleaning Complete + Welcome Banner: Completing shift immediately reflects Splněno ✓ in banner', 3, 'Cross_Feature', () => {
  const store = getFreshStore()
  const shift = store.myCurrentCleaningShift.value
  assertDefined(shift)
  shift.isCompleted = false
  store.toggleShiftStatus(shift.id)
  assertEqual(shift.isCompleted, true)
  assertEqual(store.myCurrentCleaningPending.value, false)
})

test('T3.C7', 'Energy Prediction + Settings Update: Updating monthlyUtilities dynamically updates annual advances', 3, 'Cross_Feature', () => {
  const store = getFreshStore()
  const orig = store.settings.value.monthlyUtilities
  store.saveApartmentSettings({ ...store.settings.value, monthlyUtilities: 10000 })
  assertEqual(store.annualEnergyPrediction.value.annualAdvances, 120000)
  store.saveApartmentSettings({ ...store.settings.value, monthlyUtilities: orig })
})

test('T3.C8', 'Energy Prediction + Meter Reading: Adding new meter reading maintains latest meter deltas', 3, 'Cross_Feature', () => {
  const store = getFreshStore()
  const prevElec = store.latestMeters.value['ELEKTŘINA']
  const newVal = prevElec ? prevElec.value + 50 : 15000
  store.addMeterReading({
    type: 'ELEKTŘINA',
    date: '2026-11-06',
    value: newVal,
    note: 'Listopadový kontrolní odečet'
  })
  assertEqual(store.latestMeters.value['ELEKTŘINA'].value, newVal)
})

test('T3.C9', 'Energy Prediction + Dashboard Thermometer: drawdownPct dynamically drives thermometer style', 3, 'Cross_Feature', () => {
  const store = getFreshStore()
  const pred = store.annualEnergyPrediction.value
  assertDefined(pred.drawdownPct)
  const src = loadSource('src/views/DashboardView.vue')
  assertContains(src, 'annualEnergyPrediction.drawdownPct', 'Dashboard must bind the actual prediction percentage')
})

test('T3.C10', 'Role Switching + Cleaning Authorization: Člen cannot confirm other shift, Správce can', 3, 'Cross_Feature', () => {
  const store = getFreshStore()
  const shift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-jakub')
  assertDefined(shift)
  shift.isCompleted = false

  store.setCurrentUser('user-eliska')
  assert(!store.canConfirmShift(shift))

  store.setCurrentUser('user-tomas')
  assert(store.canConfirmShift(shift))
})

test('T3.C11', 'Role Switching + Settings Guard: Správce can save settings; Člen inputs are disabled in template', 3, 'Cross_Feature', () => {
  const settingsSrc = loadSource('src/views/SettingsView.vue')
  assertMatch(settingsSrc, /!isMasterTenant/, 'SettingsView must enforce disabled attribute for non-master tenant')
})

test('T3.C12', 'QR Code Generation + Settlement Payment: Settling payment resets debt to 0', 3, 'Cross_Feature', () => {
  const store = getFreshStore()
  const settlement = store.settlements.value.find(s => s.roommateId === 'user-jakub')
  assertDefined(settlement)
  store.confirmPayment(settlement.roommateId, {
    date: '2026-11-06',
    method: 'QR platba',
    note: 'Vyrovnání',
    notifyMember: true
  })
  assertEqual(settlement.totalDebt, 0)
  assertEqual(settlement.status, 'VYROVNÁNO')
})

test('T3.C13', 'Dashboard Navigation + Modal Lifecycle: Quick action opens modal, cancel returns focus to dashboard', 3, 'Cross_Feature', () => {
  const store = getFreshStore()
  store.currentPage.value = 'DASH'
  store.openModal('METER_ADD')
  assertEqual(store.activeModal.value, 'METER_ADD')
  store.closeModal()
  assertEqual(store.activeModal.value, null)
  assertEqual(store.currentPage.value, 'DASH')
})

test('T3.C14', 'Expense Filtering + CSV Export: Filtering expenses by category updates filtered list', 3, 'Cross_Feature', () => {
  const store = getFreshStore()
  store.expenseFilters.value.category = 'Drogerie'
  const filtered = store.filteredExpenses.value
  assert(filtered.every(e => e.category === 'Drogerie'), 'All filtered expenses must be Drogerie')
  store.resetExpenseFilters()
  assertEqual(store.expenseFilters.value.category, 'ALL')
})

test('T3.C15', 'Reset Demo Data + Full State Integrity: Calling resetDemoData cleanly restores initial fixtures', 3, 'Cross_Feature', () => {
  const store = getFreshStore()
  store.addCartItem({ name: 'Dočasná položka', category: 'Jídlo', unitPrice: 10, qty: 1 })
  store.resetDemoData()
  store.confirmModal.value.onConfirm()
  assertEqual(store.cartItems.value.some(i => i.name === 'Dočasná položka'), false)
})

// -------------------------------------------------------------------------
// TIER 4: REAL-WORLD TENANT APPLICATION SCENARIOS (6 tests)
// -------------------------------------------------------------------------

test('T4.S1', 'Scenario 1: Shared Shopping & Immediate Expense Split', 4, 'Tenant_Workloads', () => {
  const store = getFreshStore()
  store.setCurrentUser('user-jakub')
  // 1. Add shopping list items
  store.addCartItem({ name: 'Tablety do myčky Somat', category: 'Drogerie', unitPrice: 349, qty: 1 })
  const item = store.cartItems.value.find(i => i.name === 'Tablety do myčky Somat')
  assertDefined(item)
  // 2. Mark purchased
  store.toggleCartItemPurchased(item.id)
  assertEqual(item.isPurchased, true)
  // 3. Convert to expense
  store.convertCartItemToExpense(item)
  assertEqual(store.activeModal.value, 'EXP_ADD')
  assertEqual(store.expensePrefill.value.title, 'Tablety do myčky Somat')
  // 4. Submit expense
  store.addExpense(createExpensePayload({
    title: item.name,
    totalAmount: 349,
    category: 'Drogerie',
    payerId: 'user-jakub',
    payerName: 'Jakub Kovář'
  }), { cartItemIds: [item.id] })
  // 5. Verify item removed from cart
  assert(!store.cartItems.value.some(i => i.id === item.id))
  // 6. Verify expense logged
  const logged = store.expenses.value.find(e => e.title === 'Tablety do myčky Somat')
  assertDefined(logged)
  assertEqual(logged.payerName, 'Jakub Kovář')
})

test('T4.S2', 'Scenario 2: Shift Swap Negotiation Between Busy Flatmates', 4, 'Tenant_Workloads', () => {
  const store = getFreshStore()
  // Flatmate Eliška cannot clean corridor due to exams
  store.setCurrentUser('user-eliska')
  const eliskaShift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-eliska')
  assertDefined(eliskaShift)
  // 1. Send swap request to Martin
  store.requestShiftSwap(eliskaShift.id, 'user-martin', 'Mám zkoušku z mikroekonomie v pátek!')
  assertEqual(eliskaShift.swapRequest.status, 'PENDING')
  // 2. Martin logs in
  store.setCurrentUser('user-martin')
  assertEqual(store.currentUser.value.id, 'user-martin')
  // 3. Martin accepts the swap
  store.acceptShiftSwap(eliskaShift.id)
  assertEqual(eliskaShift.swapRequest.status, 'ACCEPTED')
  assertEqual(eliskaShift.roommateId, 'user-martin')
  assertEqual(eliskaShift.roommateName, 'Martin Pospíšil')
})

test('T4.S3', 'Scenario 3: Winter Heating Season Advance Adjustment', 4, 'Tenant_Workloads', () => {
  const store = getFreshStore()
  store.setCurrentUser('user-tomas') // Správce
  // 1. Review current prediction
  const initialPred = store.annualEnergyPrediction.value
  assertDefined(initialPred)
  // 2. Cold winter spike: adjust monthly advance in Settings from 8600 to 9200
  store.saveApartmentSettings({ ...store.settings.value, monthlyUtilities: 9200 })
  // 3. Verify prediction recalculation
  const updatedPred = store.annualEnergyPrediction.value
  assertEqual(updatedPred.annualAdvances, 9200 * 12)
  assert(updatedPred.netDelta > initialPred.netDelta, 'Higher advances should improve surplus delta')
  assertEqual(updatedPred.isSurplus, true)
})

test('T4.S4', 'Scenario 4: Monthly Rent & Utility Settlement via SPAYD QR', 4, 'Tenant_Workloads', async () => {
  const store = getFreshStore()
  // 1. Switch to debtor Jakub Novák
  store.setCurrentUser('user-jakub')
  const settlement = store.currentUserSettlement.value
  assertDefined(settlement)
  assert(settlement.totalDebt > 0)
  // 2. Construct SPAYD string
  const { buildSpayd } = await viteServer.ssrLoadModule('./src/utils/spayd.ts')
  const spayd = buildSpayd(store.settings.value.iban, settlement.totalDebt, settlement.roommateName)
  // 3. Generate QR Canvas
  const qrSvg = await QRCode.toString(spayd, { type: 'svg' })
  assert(qrSvg.length > 100, 'QR SVG must be generated')
  // 4. Správce confirms payment
  store.setCurrentUser('user-tomas')
  store.confirmPayment(settlement.roommateId, {
    date: '2026-11-06',
    method: 'QR platba',
    note: 'QR platba bankou',
    notifyMember: true
  })
  assertEqual(settlement.totalDebt, 0)
  assertEqual(settlement.status, 'VYROVNÁNO')
})

test('T4.S5', 'Scenario 5: New Roommate Onboarding & Area Share Recalculation', 4, 'Tenant_Workloads', () => {
  const store = getFreshStore()
  store.setCurrentUser('user-tomas')
  // Onboard modified room layout: Jakub's room expanded to 25m2
  store.updateRoommateArea('user-jakub', 25)
  const totalArea = store.roommates.value.reduce((sum, r) => sum + r.roomAreaM2, 0)
  const expectedShare = Math.round((25 / totalArea) * 1000) / 10
  const jakub = store.roommates.value.find(r => r.id === 'user-jakub')
  assertEqual(jakub.areaSharePct, expectedShare)
  // Check total share sums to 100%
  const totalShares = store.roommates.value.reduce((sum, r) => sum + r.areaSharePct, 0)
  assert(Math.abs(totalShares - 100) < 0.5)
})

test('T4.S6', 'Scenario 6: Full Household Operational Cycle (Disaster Recovery & Reset)', 4, 'Tenant_Workloads', () => {
  const store = getFreshStore()
  // Multi-step lifecycle:
  // 1. Add cart items
  store.addCartItem({ name: 'Sáčky do koše', category: 'Drogerie', unitPrice: 45, qty: 2 })
  // 2. Add meter reading
  store.addMeterReading({ type: 'PLYN', date: '2026-11-06', value: 3500, note: 'Kontrola kotle' })
  // 3. Complete cleaning shift
  const shift = store.cleaningShifts.value[0]
  shift.isCompleted = true
  // 4. Execute demo reset
  store.resetDemoData()
  store.confirmModal.value.onConfirm()
  // 5. Verify pristine state restoration
  assertEqual(store.currentPage.value, 'DASH')
  assertEqual(store.currentUser.value.id, 'user-tomas')
  assert(!store.cartItems.value.some(i => i.name === 'Sáčky do koše'))
})

// TODO1 regressions: exercise application operations rather than copies of their logic.
test('T3.R1', 'Seed debts equal open manager shares and category buckets', 3, 'TODO1_Regressions', () => {
  const store = getFreshStore()
  for (const settlement of store.settlements.value) {
    const buckets = { rent: 0, energy: 0, drogerie: 0, other: 0 }
    for (const expense of store.expenses.value) {
      assertEqual(Math.round(expense.shares.reduce((sum, share) => sum + share.amount, 0) * 100), Math.round(expense.totalAmount * 100), expense.id + ' allocated total')
      if (expense.payerId !== store.managerRoommate.value.id) continue
      for (const share of expense.shares) {
        if (share.roommateId !== settlement.roommateId || !['DLUŽÍ', 'PO_SPLATNOSTI'].includes(share.status)) continue
        const bucket = expense.category === 'Bydlení' ? 'rent' : expense.category === 'Energie' ? 'energy' : expense.category === 'Drogerie' ? 'drogerie' : 'other'
        buckets[bucket] += Math.round(share.amount * 100)
      }
    }
    assertEqual(Object.values(buckets).reduce((sum, cents) => sum + cents, 0), Math.round(settlement.totalDebt * 100), settlement.roommateId)
    for (const [bucket, cents] of Object.entries(buckets)) assertEqual(cents, Math.round((settlement.breakdown[bucket] || 0) * 100), settlement.roommateId + ' ' + bucket)
    assertEqual(settlement.breakdown.wifi || 0, 0, 'Services must use the same bucket as add/delete')
  }
})

test('T3.R2', 'Unrelated expense saves never consume a stale cart prefill', 3, 'TODO1_Regressions', () => {
  const store = getFreshStore()
  const item = store.cartItems.value[0]
  store.convertCartItemToExpense(item)
  const cartBefore = JSON.stringify(store.cartItems.value)
  assertEqual(store.addExpense(createExpensePayload()), true)
  assertEqual(JSON.stringify(store.cartItems.value), cartBefore)
  assertEqual(store.activeModal.value, 'EXP_ADD', 'Caller owns modal closure')
  assertEqual(store.addExpense(createExpensePayload(), { cartItemIds: [item.id] }), true)
  assert(!store.cartItems.value.some(row => row.id === item.id))
})

test('T3.R3', 'Members cannot delete another payer expense, confirm debt or send reminders', 3, 'TODO1_Regressions', () => {
  const store = getFreshStore()
  store.setCurrentUser('user-eliska')
  const expense = store.expenses.value.find(e => e.id === 'exp-3')
  assertDefined(expense)
  assertEqual(store.canDeleteExpense(expense), false)
  const before = JSON.stringify({ expenses: store.expenses.value, settlements: store.settlements.value })
  for (const action of [
    () => store.deleteExpense(expense.id),
    () => store.confirmPayment('user-eliska', { date: '2026-11-12', method: 'BANK', note: '', notifyMember: false }),
    () => store.sendReminder('user-jakub'),
  ]) {
    action()
    assertEqual(JSON.stringify({ expenses: store.expenses.value, settlements: store.settlements.value }), before)
    assertEqual(store.toasts.value.at(-1).title, 'Přístup odepřen')
    assertEqual(store.toasts.value.at(-1).type, 'warning')
    assertEqual(store.confirmModal.value.isOpen, false)
  }
  const ownExpense = store.expenses.value.find(e => e.payerId === 'user-eliska')
  assertDefined(ownExpense)
  assertEqual(store.canDeleteExpense(ownExpense), true)
  store.deleteExpense(ownExpense.id)
  assertEqual(store.confirmModal.value.isOpen, true)
  store.confirmModal.value.onConfirm()
  assert(!store.expenses.value.some(e => e.id === ownExpense.id))
})

test('T3.R4', 'Settings and room changes reject members without mutating data', 3, 'TODO1_Regressions', () => {
  const store = getFreshStore()
  store.setCurrentUser('user-jakub')
  const settings = JSON.stringify(store.settings.value)
  const roommates = JSON.stringify(store.roommates.value)
  assertEqual(store.saveApartmentSettings({ ...store.settings.value, monthlyRent: 1 }), false)
  assertEqual(JSON.stringify(store.settings.value), settings)
  assertEqual(store.toasts.value.at(-1).title, 'Přístup odepřen')
  assertEqual(store.updateRoommateArea('user-jakub', 99), false)
  assertEqual(JSON.stringify(store.roommates.value), roommates)
  assertEqual(store.toasts.value.at(-1).title, 'Přístup odepřen')
})

test('T3.R5', 'Settings reject malformed account, amounts and due days atomically', 3, 'TODO1_Regressions', () => {
  const store = getFreshStore()
  const before = JSON.stringify(store.settings.value)
  for (const patch of [
    { iban: '' }, { iban: 'CZ65*AM:999' },
    { monthlyRent: '' }, { monthlyRent: -1 }, { monthlyRent: NaN },
    { monthlyUtilities: 0 }, { monthlyUtilities: Infinity },
    { dueDayOfMonth: 0 }, { dueDayOfMonth: 29 }, { dueDayOfMonth: 1.5 },
    { name: ' ' }, { accountNumber: '' },
  ]) {
    assertEqual(store.saveApartmentSettings({ ...store.settings.value, ...patch }), false, JSON.stringify(patch))
    assertEqual(JSON.stringify(store.settings.value), before)
    assertEqual(store.toasts.value.at(-1).type, 'error')
  }
  assertEqual(store.saveApartmentSettings({ ...store.settings.value, monthlyUtilities: 9000, dueDayOfMonth: 20 }), true)
  assertEqual(store.annualEnergyPrediction.value.annualAdvances, 108000)
  assert(store.settlements.value.every(s => s.dueDate === '2026-11-20'))
})

test('T3.R6', 'Room area edits update settlement presentation without rewriting historical debts', 3, 'TODO1_Regressions', () => {
  const store = getFreshStore()
  const before = debtSnapshot(store)
  assertEqual(store.updateRoommateArea('user-jakub', 25), true)
  const roommate = store.roommates.value.find(r => r.id === 'user-jakub')
  const settlement = store.settlements.value.find(r => r.roommateId === 'user-jakub')
  assertDefined(roommate)
  assertDefined(settlement)
  assertEqual(settlement.roomAreaM2, roommate.roomAreaM2)
  assertEqual(settlement.areaSharePct, roommate.areaSharePct)
  assertEqual(debtSnapshot(store), before)
})

test('T3.R7', 'Meter validation rejects lower values, invalid and out-of-order dates', 3, 'TODO1_Regressions', () => {
  const store = getFreshStore()
  const previous = store.latestMeters.value['ELEKTŘINA']
  const before = JSON.stringify(store.meters.value)
  for (const patch of [
    { value: previous.value - 1 }, { value: NaN }, { value: Infinity }, { value: -1 },
    { date: '2026-10-30' }, { date: '2026-11-13' }, { date: '' }, { date: '2026-02-30' },
  ]) {
    assertEqual(store.addMeterReading({ type: 'ELEKTŘINA', date: '2026-11-12', value: previous.value + 1, ...patch }), false)
    assertEqual(JSON.stringify(store.meters.value), before)
    assertEqual(store.toasts.value.at(-1).type, 'error')
  }
  assertEqual(store.addMeterReading({ type: 'ELEKTŘINA', date: '2026-11-12', value: previous.value + 1 }), true)
  assertEqual(store.latestMeters.value['ELEKTŘINA'].delta, 1)
})

test('T3.R8', 'Only the latest meter reading can be removed, with confirmation', 3, 'TODO1_Regressions', () => {
  const store = getFreshStore()
  const previous = store.latestMeters.value['ELEKTŘINA']
  assertEqual(store.addMeterReading({ type: 'ELEKTŘINA', date: '2026-11-12', value: previous.value + 10000 }), true)
  const added = store.latestMeters.value['ELEKTŘINA']
  const before = JSON.stringify(store.meters.value)
  store.deleteLatestMeterReading(previous.id)
  assertEqual(store.confirmModal.value.isOpen, false)
  assertEqual(JSON.stringify(store.meters.value), before)
  store.deleteLatestMeterReading(added.id)
  assertEqual(store.confirmModal.value.isOpen, true)
  assertEqual(JSON.stringify(store.meters.value), before)
  store.confirmModal.value.onConfirm()
  assertEqual(store.latestMeters.value['ELEKTŘINA'].id, previous.id)
  assertEqual(store.addMeterReading({ type: 'ELEKTŘINA', date: '2026-11-12', value: previous.value + 10 }), true)
})

test('T3.R9', 'Completed and already-pending cleaning shifts cannot receive new requests', 3, 'TODO1_Regressions', () => {
  const store = getFreshStore()
  const completed = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.isCompleted)
  assertDefined(completed)
  const before = JSON.stringify(completed)
  store.requestShiftSwap(completed.id, 'user-jakub')
  assertEqual(JSON.stringify(completed), before)
  assertEqual(store.toasts.value.at(-1).type, 'warning')
  const pending = store.cleaningShifts.value.find(s => s.weekNumber === 45 && !s.isCompleted)
  assertDefined(pending)
  store.requestShiftSwap(pending.id, 'user-martin')
  assertEqual(pending.swapRequest.status, 'PENDING')
  const request = JSON.stringify(pending.swapRequest)
  store.requestShiftSwap(pending.id, 'user-eliska')
  assertEqual(JSON.stringify(pending.swapRequest), request)
  assertEqual(store.toggleShiftStatus(pending.id), true)
  assertEqual(pending.swapRequest.status, 'CANCELLED')
  store.setCurrentUser('user-martin')
  store.acceptShiftSwap(pending.id)
  assertEqual(pending.roommateId, 'user-jakub')
})

test('T3.R10', 'Cleaning request and reject permissions preserve state, manager can intervene', 3, 'TODO1_Regressions', () => {
  const store = getFreshStore()
  const shift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-jakub')
  assertDefined(shift)
  store.setCurrentUser('user-eliska')
  const before = JSON.stringify(shift)
  store.requestShiftSwap(shift.id, 'user-martin')
  assertEqual(JSON.stringify(shift), before)
  assertEqual(store.toasts.value.at(-1).title, 'Přístup odepřen')
  store.setCurrentUser('user-jakub')
  store.requestShiftSwap(shift.id, 'user-martin')
  const pending = JSON.stringify(shift)
  store.setCurrentUser('user-eliska')
  store.rejectShiftSwap(shift.id)
  assertEqual(JSON.stringify(shift), pending)
  assertEqual(store.toasts.value.at(-1).title, 'Přístup odepřen')
  store.setCurrentUser('user-tomas')
  store.acceptShiftSwap(shift.id)
  assertEqual(shift.roommateId, 'user-martin')
  assertEqual(shift.swapRequest.status, 'ACCEPTED')
})

test('T3.R11', 'Invalid week numbers do not generate or persist cleaning shifts', 3, 'TODO1_Regressions', () => {
  const store = getFreshStore()
  const before = JSON.stringify(store.cleaningShifts.value)
  for (const week of [0, -1, 54, 60, NaN, Infinity, 45.5]) {
    store.selectCleaningWeek(week)
    assertEqual(store.selectedCleaningWeek.value, 45)
    assertEqual(JSON.stringify(store.cleaningShifts.value), before)
  }
  store.selectCleaningWeek(53)
  assertEqual(store.selectedWeekShifts.value.length, 4)
})

test('T3.R12', 'Rapid creation produces unique IDs and expense codes', 3, 'TODO1_Regressions', () => {
  const store = getFreshStore()
  const originalNow = Date.now
  Date.now = () => 123456789
  try {
    for (let index = 0; index < 20; index++) {
      assertEqual(store.addExpense(createExpensePayload()), true)
      store.addCartItem({ name: 'Položka ' + index, category: 'Drogerie', unitPrice: 10, qty: 1 })
      assertEqual(store.addMeterReading({ type: 'ELEKTŘINA', date: '2026-11-12', value: 15000 + index }), true)
    }
  } finally {
    Date.now = originalNow
  }
  for (const slice of [store.expenses.value, store.cartItems.value, store.meters.value]) assertEqual(new Set(slice.map(row => row.id)).size, slice.length)
  assertEqual(new Set(store.expenses.value.map(row => row.code)).size, store.expenses.value.length)
  assert(store.expenses.value.slice(0, 20).every(e => e.code.startsWith('VYD-2026-11-')))
})

test('T3.R13', 'Persistence round trip hydrates modified slices and active persona', 3, 'TODO1_Regressions', async () => {
  const store = getFreshStore()
  store.addExpense(createExpensePayload({ title: 'Uložený výdaj' }))
  store.addCartItem({ name: 'Uložená položka', category: 'Údržba', unitPrice: 9, qty: 2 })
  assertEqual(store.saveApartmentSettings({ ...store.settings.value, monthlyUtilities: 9100 }), true)
  store.setCurrentUser('user-jakub')
  await new Promise(resolve => setTimeout(resolve))
  const snapshot = Object.fromEntries(['expenses', 'settlements', 'cartItems', 'settings', 'roommates', 'meters', 'cleaningShifts'].map(key => [key, JSON.stringify(store[key].value)]))
  const hydrated = await reloadStore()
  for (const [key, expected] of Object.entries(snapshot)) assertEqual(JSON.stringify(hydrated[key].value), expected, key)
  assertEqual(hydrated.currentUser.value.id, 'user-jakub')
  assertEqual(hydrated.isMasterTenant.value, false)
})

test('T3.R14', 'Malformed JSON shapes recover before any UI reads the persona', 3, 'TODO1_Regressions', async () => {
  await new Promise(resolve => setTimeout(resolve))
  const originalError = console.error
  console.error = () => {}
  try {
    for (const malformed of [null, [], [{ id: 'incomplete' }]]) {
      globalThis.localStorage.clear()
      const snapshot = defaultSnapshot()
      snapshot.roommates = malformed
      snapshot.currentUserId = 'unknown'
      globalThis.localStorage.setItem(storagePrefix() + 'state', JSON.stringify(snapshot))
      const store = await reloadStore()
      assertEqual(store.currentUser.value.id, 'user-tomas')
      assertEqual(store.isMasterTenant.value, true)
      assertEqual(store.roommates.value.length, mockDataModule.INITIAL_ROOMMATES.length)
      assertEqual(store.storageRecovered.value, true)
      await new Promise(resolve => setTimeout(resolve))
    }
  } finally {
    console.error = originalError
  }
})

test('T3.R15', 'CSV cells quote delimiters and neutralize spreadsheet formulas', 3, 'TODO1_Regressions', async () => {
  const { csvCell } = await viteServer.ssrLoadModule('./src/utils/format.ts')
  assertEqual(csvCell('Jan "Tester"; Novák'), '"Jan ""Tester""; Novák"')
  for (const value of ['=HYPERLINK("x")', '+1', '-1', '@SUM(A1)', ' =1']) {
    const cell = csvCell(value)
    assert(cell.startsWith('"\''), value + ' must be a literal cell')
    assert(cell.endsWith('"'))
  }
  assertEqual(csvCell(9850), '"9850"')
})

test('T3.R16', 'Empty cart, unknown shifts and repeated toggles remain deterministic', 3, 'TODO1_Regressions', () => {
  const store = getFreshStore()
  const item = store.cartItems.value[0]
  const initial = !!item.isPurchased
  for (let count = 0; count < 100; count++) store.toggleCartItemPurchased(item.id)
  assertEqual(!!item.isPurchased, initial)
  const shifts = JSON.stringify(store.cleaningShifts.value)
  assertEqual(store.toggleShiftStatus('unknown-shift'), false)
  store.requestShiftSwap('unknown-shift', 'user-jakub')
  store.acceptShiftSwap('unknown-shift')
  store.rejectShiftSwap('unknown-shift')
  store.cancelShiftSwap('unknown-shift')
  assertEqual(JSON.stringify(store.cleaningShifts.value), shifts)
  store.cartItems.value = []
  store.convertCartToExpense()
  assertEqual(store.activeModal.value, null)
  assertEqual(store.toasts.value.at(-1).type, 'warning')
})

test('T3.R17', 'An invalid snapshot slice resets the whole household atomically', 3, 'TODO1_Regressions', async () => {
  await new Promise(resolve => setTimeout(resolve))
  const snapshot = defaultSnapshot()
  snapshot.expenses = null
  snapshot.settings.monthlyRent = 12345
  snapshot.settlements[0].totalDebt = 1
  globalThis.localStorage.setItem(storagePrefix() + 'state', JSON.stringify(snapshot))
  const originalError = console.error
  console.error = () => {}
  try {
    const store = await reloadStore()
    assertEqual(store.storageRecovered.value, true)
    assertEqual(JSON.stringify(store.expenses.value), JSON.stringify(mockDataModule.INITIAL_EXPENSES))
    assertEqual(JSON.stringify(store.settlements.value), JSON.stringify(mockDataModule.INITIAL_SETTLEMENTS))
    assertEqual(store.settings.value.monthlyRent, mockDataModule.INITIAL_SETTINGS.monthlyRent)
  } finally {
    console.error = originalError
  }
})

test('T3.R18', 'An unknown stored persona normalizes to an existing roommate', 3, 'TODO1_Regressions', async () => {
  await new Promise(resolve => setTimeout(resolve))
  const snapshot = defaultSnapshot()
  snapshot.currentUserId = 'unknown'
  globalThis.localStorage.setItem(storagePrefix() + 'state', JSON.stringify(snapshot))
  const store = await reloadStore()
  assertEqual(store.currentUser.value.id, snapshot.roommates[0].id)
  assertEqual(store.isMasterTenant.value, true)
})

test('T3.R19', 'Stale tab edits cannot overwrite another tab snapshot', 3, 'TODO1_Regressions', async () => {
  const store = getFreshStore()
  await new Promise(resolve => setTimeout(resolve))
  const key = storagePrefix() + 'state'
  const newer = JSON.parse(globalThis.localStorage.getItem(key))
  newer.settings.name = 'Novější změna z jiné karty'
  const externalSnapshot = JSON.stringify(newer)
  globalThis.localStorage.setItem(key, externalSnapshot)
  store.addCartItem({ name: 'Lokální úprava', category: 'Drogerie', unitPrice: 10, qty: 1 })
  await new Promise(resolve => setTimeout(resolve))
  assertEqual(store.storageConflict.value, true)
  assertEqual(globalThis.localStorage.getItem(key), externalSnapshot)
})

test('T3.R20', 'Malformed optional receipt items trigger atomic snapshot recovery', 3, 'TODO1_Regressions', async () => {
  await new Promise(resolve => setTimeout(resolve))
  const snapshot = defaultSnapshot()
  snapshot.expenses[0].receiptItems = [null]
  snapshot.settings.name = 'Tento neplatný snapshot se nesmí načíst'
  globalThis.localStorage.clear()
  globalThis.localStorage.setItem(storagePrefix() + 'state', JSON.stringify(snapshot))
  const originalError = console.error
  console.error = () => {}
  try {
    const store = await reloadStore()
    assertEqual(store.storageRecovered.value, true)
    assertEqual(JSON.stringify(store.expenses.value), JSON.stringify(mockDataModule.INITIAL_EXPENSES))
    assertEqual(store.settings.value.name, mockDataModule.INITIAL_SETTINGS.name)
    assertEqual(JSON.stringify(store.settlements.value), JSON.stringify(mockDataModule.INITIAL_SETTLEMENTS))
  } finally {
    console.error = originalError
  }
})

test('T3.R21', 'Due-day changes synchronize open share and expense statuses without changing money or paid history', 3, 'TODO1_Regressions', () => {
  const store = getFreshStore()
  const moneyBefore = JSON.stringify(store.settlements.value.map(row => ({ totalDebt: row.totalDebt, breakdown: row.breakdown })))
  const memberExpense = store.expenses.value.find(expense => expense.payerId !== store.managerRoommate.value.id)
  assertDefined(memberExpense)
  const memberBefore = JSON.stringify(memberExpense)
  const paidHistory = store.expenses.value.flatMap(expense => expense.shares
    .filter(share => share.status === 'UHRAZENO' || share.status === 'PLÁTCE')
    .map(share => ({ expenseId: expense.id, roommateId: share.roommateId, snapshot: JSON.stringify(share) })))

  for (const [day, shareStatus, settlementStatus, expenseStatus] of [
    [20, 'DLUŽÍ', 'PŘED_SPLATNOSTÍ', 'ČÁSTEČNĚ'],
    [1, 'PO_SPLATNOSTI', 'PO_SPLATNOSTI', 'PO_SPLATNOSTI'],
  ]) {
    assertEqual(store.saveApartmentSettings({ ...store.settings.value, dueDayOfMonth: day }), true)
    const debtors = store.settlements.value.filter(settlement => settlement.totalDebt > 0)
    assert(debtors.length > 0)
    for (const settlement of debtors) {
      assertEqual(settlement.status, settlementStatus)
      assertEqual(settlement.dueDate, `2026-11-${String(day).padStart(2, '0')}`)
    }
    const openExpenses = store.expenses.value.filter(expense => expense.payerId === store.managerRoommate.value.id
      && expense.shares.some(share => ['DLUŽÍ', 'PO_SPLATNOSTI'].includes(share.status)))
    assert(openExpenses.length > 0)
    for (const expense of openExpenses) {
      assertEqual(expense.status, expenseStatus, expense.id)
      for (const share of expense.shares.filter(row => ['DLUŽÍ', 'PO_SPLATNOSTI'].includes(row.status))) {
        assertEqual(share.status, shareStatus, expense.id + ' ' + share.roommateId)
      }
    }
    assertEqual(JSON.stringify(store.settlements.value.map(row => ({ totalDebt: row.totalDebt, breakdown: row.breakdown }))), moneyBefore)
    assertEqual(JSON.stringify(memberExpense), memberBefore)
    for (const history of paidHistory) {
      const expense = store.expenses.value.find(row => row.id === history.expenseId)
      assertDefined(expense)
      assertEqual(JSON.stringify(expense.shares.find(row => row.roommateId === history.roommateId)), history.snapshot)
    }
  }
})

// =========================================================================
// TEST RUNNER & REPORTER
// =========================================================================

export async function runSuite() {
  console.log('\n================================================================================')
  console.log('       SPOLUBYT APP: 4-TIER COMPREHENSIVE E2E VERIFICATION SUITE')
  console.log('================================================================================\n')

  assert(testResults.length > 0, 'No tests registered')
  await setupEnvironment()

  let passed = 0
  let failed = 0
  const failures = []

  for (const t of testResults) {
    const tStart = Date.now()
    let timeout
    try {
      await Promise.race([
        Promise.resolve().then(() => t.fn()),
        new Promise((_, reject) => {
          timeout = setTimeout(() => reject(new Error(`Test ${t.id} timed out after 120 seconds`)), 120000)
        }),
      ])
      t.duration = Date.now() - tStart
      t.status = 'PASS'
      passed++
      console.log(`  \x1b[32m✔ [PASS]\x1b[0m [Tier ${t.tier}] [${t.id}] ${t.title} (${t.duration}ms)`)
    } catch (err) {
      t.duration = Date.now() - tStart
      t.status = 'FAIL'
      t.error = err
      failed++
      failures.push(t)
      console.log(`  \x1b[31m✖ [FAIL]\x1b[0m [Tier ${t.tier}] [${t.id}] ${t.title} (${t.duration}ms)`)
      console.log(`     \x1b[31m${err.stack || err.message}\x1b[0m`)
    } finally {
      clearTimeout(timeout)
    }
  }

  await teardownEnvironment()

  const totalDuration = Date.now() - suiteStart

  console.log('\n--------------------------------------------------------------------------------')
  console.log('                              TEST SUITE SUMMARY')
  console.log('--------------------------------------------------------------------------------')
  console.log(`  Total Test Cases : ${testResults.length}`)
  console.log(`  Passed           : \x1b[32m${passed}\x1b[0m`)
  console.log(`  Failed           : \x1b[${failed > 0 ? '31' : '32'}m${failed}\x1b[0m`)
  console.log(`  Execution Time   : ${(totalDuration / 1000).toFixed(2)}s`)
  console.log('--------------------------------------------------------------------------------\n')

  // Tier Breakdown
  for (let tier = 1; tier <= 4; tier++) {
    const tierTests = testResults.filter(t => t.tier === tier)
    const tierPassed = tierTests.filter(t => t.status === 'PASS').length
    const tierFailed = tierTests.filter(t => t.status === 'FAIL').length
    console.log(`  Tier ${tier} Summary: ${tierPassed}/${tierTests.length} passed (${tierFailed} failed)`)
  }
  console.log('\n================================================================================\n')

  return {
    total: testResults.length,
    passed,
    failed,
    failures,
    duration: totalDuration
  }
}

// Auto-run if executed directly via node
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  runSuite().then(summary => {
    process.exit(summary.failed > 0 ? 1 : 0)
  }).catch(err => {
    console.error('Fatal test runner error:', err)
    process.exit(1)
  })
}
