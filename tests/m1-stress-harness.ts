/**
 * Milestone 1 Stress and Edge-Case Challenge Harness
 * Author: m1_challenger_2
 * Scope: Independent stress, concurrency, authorization, and edge-case testing
 */

// Run with: node tests/m1-challenger.mjs --stress
// The Node entry initializes browser mocks and loads this module via Vite SSR.
import type { Expense, CartItem } from '../src/types/index'

interface TestResult {
  name: string
  category: string
  status: 'PASS' | 'FAIL'
  details: string
  error?: unknown
}

const results: TestResult[] = []

function assert(condition: boolean, testName: string, category: string, details: string) {
  if (condition) {
    results.push({ name: testName, category, status: 'PASS', details })
    console.log(`  [PASS] ${category} > ${testName}: ${details}`)
  } else {
    results.push({ name: testName, category, status: 'FAIL', details: `FAILED: ${details}` })
    console.error(`  [FAIL] ${category} > ${testName}: ${details}`)
  }
}

export async function runAllTests(): Promise<boolean> {
  results.length = 0
  console.log('===============================================================')
  console.log('   M1 ADVERSARIAL STRESS & EDGE-CASE CHALLENGE HARNESS')
  console.log('===============================================================\n')

  // Dynamic import to guarantee globalThis.localStorage is populated
  const { useSpolubyt } = await import('../src/composables/useSpolubyt')
  const store = useSpolubyt()

  // Helper to reset store state cleanly before each suite
  const resetStore = () => {
    store.resetDemoData()
    if (store.confirmModal.value.isOpen) {
      store.confirmModal.value.onConfirm()
    }
    store.toasts.value = []
  }

  // =========================================================================
  // SUITE 1: Cart Edge Cases & Concurrency
  // =========================================================================
  console.log('--- SUITE 1: Cart Edge Cases & Concurrency ---')
  resetStore()

  // 1.1 Empty Cart Operations
  store.cartItems.value = [] // Force empty cart
  assert(store.cartItems.value.length === 0, '1.1.1 Empty cart initial state', 'Cart', 'Cart items array is empty')

  // Attempt convertCartToExpense on empty cart
  store.convertCartToExpense()
  assert(
    store.activeModal.value !== 'EXP_ADD',
    '1.1.2 Empty cart conversion modal guard',
    'Cart',
    'Modal EXP_ADD must not open when converting empty cart'
  )
  const emptyCartToast = store.toasts.value.find(t => t.title === 'Košík je prázdný')
  assert(
    !!emptyCartToast && emptyCartToast.type === 'warning',
    '1.1.3 Empty cart warning toast',
    'Cart',
    'Warning toast "Košík je prázdný" emitted'
  )

  // 1.2 Convert Cart Item to Expense with Empty Cart
  const dummyItem: CartItem = {
    id: 'cart-dummy-999',
    name: 'Ekologický saponát',
    category: 'Drogerie',
    unitPrice: 120,
    qty: 2,
    addedBy: 'Tomáš Beránek',
    addedAt: 'Dnes'
  }
  store.convertCartItemToExpense(dummyItem)
  assert(
    store.activeModal.value === 'EXP_ADD',
    '1.2.1 Convert item opens EXP_ADD modal',
    'Cart',
    'Modal activeModal set to EXP_ADD'
  )
  assert(
    store.expensePrefill.value?.cartItemId === 'cart-dummy-999' &&
    store.expensePrefill.value?.totalAmount === 240 &&
    store.expensePrefill.value?.title === 'Ekologický saponát',
    '1.2.2 Expense prefill correctly populated',
    'Cart',
    `Prefill title="${store.expensePrefill.value?.title}", total=${store.expensePrefill.value?.totalAmount}`
  )

  // 1.3 Add Expense when Cart Item does not exist in cartItems (Empty Cart / Item Not Found)
  const dummyExpense: Omit<Expense, 'id' | 'code' | 'audit'> = {
    title: 'Ekologický saponát',
    totalAmount: 240,
    category: 'Drogerie',
    date: '2026-11-06',
    payerId: 'user-tomas',
    payerName: 'Tomáš Beránek',
    status: 'ČÁSTEČNĚ',
    calculationKey: 'EQUAL',
    shares: [
      { roommateId: 'user-tomas', roommateName: 'Tomáš Beránek', amount: 80, status: 'PLÁTCE' },
      { roommateId: 'user-eliska', roommateName: 'Eliška Malá', amount: 80, status: 'DLUŽÍ' },
      { roommateId: 'user-martin', roommateName: 'Martin Pospíšil', amount: 80, status: 'DLUŽÍ' }
    ]
  }

  // Should succeed without throw even though cart-dummy-999 is not in cartItems.value
  let addExpError = null
  try {
    store.addExpense(dummyExpense, { cartItemIds: ['cart-dummy-999'] })
    assert(store.activeModal.value === 'EXP_ADD', '1.3.0 store preserves modal', 'Cart', 'Caller controls modal close')
    store.closeModal()
  } catch (e) {
    addExpError = e
  }
  assert(addExpError === null, '1.3.1 addExpense succeeds with missing cartItemId', 'Cart', 'No exception thrown')
  assert(store.expensePrefill.value === null, '1.3.2 prefill reset after addExpense', 'Cart', 'expensePrefill reset to null')
  assert(store.activeModal.value === null, '1.3.3 modal closed after addExpense', 'Cart', 'activeModal is null')
  assert(store.expenses.value[0].title === 'Ekologický saponát', '1.3.4 expense unshifted', 'Cart', 'Expense prepended to list')

  // 1.4 Item Not Found Edge Cases
  resetStore()
  const initialCartCount = store.cartItems.value.length

  // toggleCartItemPurchased with non-existent ID
  let toggleError = null
  try {
    store.toggleCartItemPurchased('non-existent-item-id')
  } catch (e) {
    toggleError = e
  }
  assert(toggleError === null, '1.4.1 toggle non-existent item no-throw', 'Cart', 'Safe no-op when item ID not found')
  assert(store.cartItems.value.length === initialCartCount, '1.4.2 cart items count unchanged', 'Cart', `Count remains ${initialCartCount}`)

  // updateCartItemQty with non-existent ID
  let updateQtyError = null
  try {
    store.updateCartItemQty('non-existent-item-id', 10)
  } catch (e) {
    updateQtyError = e
  }
  assert(updateQtyError === null, '1.4.3 updateQty non-existent item no-throw', 'Cart', 'Safe no-op')

  // removeCartItem with non-existent ID
  let removeError = null
  try {
    store.removeCartItem('non-existent-item-id')
  } catch (e) {
    removeError = e
  }
  assert(removeError === null, '1.4.4 remove non-existent item no-throw', 'Cart', 'Safe no-op')

  // 1.5 Valid Cart Item Conversion & Automatic Removal
  const itemToConvert = store.cartItems.value[0]
  const targetId = itemToConvert.id
  store.convertCartItemToExpense(itemToConvert)
  assert(store.expensePrefill.value?.cartItemId === targetId, '1.5.1 convertCartItem sets prefill', 'Cart', `cartItemId=${targetId}`)
  
  store.addExpense({
    title: itemToConvert.name,
    totalAmount: itemToConvert.unitPrice * itemToConvert.qty,
    category: itemToConvert.category,
    date: '2026-11-06',
    payerId: 'user-tomas',
    payerName: 'Tomáš Beránek',
    status: 'ČÁSTEČNĚ',
    calculationKey: 'EQUAL',
    shares: [{ roommateId: 'user-tomas', roommateName: 'Tomáš Beránek', amount: itemToConvert.unitPrice * itemToConvert.qty, status: 'PLÁTCE' }]
  }, { cartItemIds: [targetId] })
  store.closeModal()
  const itemStillInCart = store.cartItems.value.some(i => i.id === targetId)
  assert(!itemStillInCart, '1.5.2 converted item removed from cart', 'Cart', `Item ${targetId} removed from cartItems`)
  assert(store.cartItems.value.length === initialCartCount - 1, '1.5.3 cart length decremented', 'Cart', `Length is now ${initialCartCount - 1}`)

  // 1.6 Invalid/Boundary Input Handling in addCartItem
  const countBeforeBadAdds = store.cartItems.value.length
  store.addCartItem({ name: '   ', category: 'Drogerie', unitPrice: 100, qty: 1 })
  store.addCartItem({ name: 'Test', category: 'Drogerie', unitPrice: 0, qty: 1 })
  store.addCartItem({ name: 'Test', category: 'Drogerie', unitPrice: -50, qty: 1 })
  store.addCartItem({ name: 'Test', category: 'Drogerie', unitPrice: 50, qty: 0 })
  store.addCartItem({ name: 'Test', category: 'Drogerie', unitPrice: 50, qty: -2 })
  assert(store.cartItems.value.length === countBeforeBadAdds, '1.6.1 invalid cart items rejected', 'Cart', 'Zero invalid items added')

  // =========================================================================
  // SUITE 2: Shift Swap Edge Cases & Concurrency / Authorization
  // =========================================================================
  console.log('\n--- SUITE 2: Shift Swap Edge Cases & Concurrency / Authorization ---')
  resetStore()

  // 2.1 Invalid Shift ID Handling
  let swapErr = null
  try {
    store.requestShiftSwap('non-existent-shift-id', 'user-eliska')
    store.acceptShiftSwap('non-existent-shift-id')
    store.rejectShiftSwap('non-existent-shift-id')
    store.cancelShiftSwap('non-existent-shift-id')
  } catch (e) {
    swapErr = e
  }
  assert(swapErr === null, '2.1.1 invalid shift ID handles gracefully', 'ShiftSwap', 'No exceptions thrown on non-existent shift ID')

  // 2.2 Swap Request with Self
  const shiftWeek45 = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-tomas')!
  assert(!!shiftWeek45, '2.2.0 find week 45 shift for user-tomas', 'ShiftSwap', `Found shift ${shiftWeek45.id}`)

  store.setCurrentUser('user-tomas') // role: Správce
  store.toggleShiftStatus(shiftWeek45.id) // Reopen the completed shift before requesting a transfer.
  store.requestShiftSwap(shiftWeek45.id, 'user-tomas')
  assert(shiftWeek45.swapRequest === undefined, '2.2.1 cannot swap shift with self', 'ShiftSwap', 'swapRequest not created')
  const selfSwapToast = store.toasts.value.at(-1)
  assert(selfSwapToast?.type === 'warning', '2.2.2 warning toast on self swap', 'ShiftSwap', 'Self-takeover is rejected with a warning')

  // 2.3 Swap Request targeting Non-Existent User
  store.requestShiftSwap(shiftWeek45.id, 'user-ghost-404')
  assert(shiftWeek45.swapRequest === undefined, '2.3.1 non-existent target user rejected', 'ShiftSwap', 'swapRequest not created')
  const ghostUserToast = store.toasts.value.find(t => t.message.includes('Cílový spolubydlící nebyl nalezen'))
  assert(!!ghostUserToast, '2.3.2 error toast on ghost user target', 'ShiftSwap', 'Toast emitted: Cílový spolubydlící nebyl nalezen')

  // 2.4 Unauthorized Shift Swap Request (Member requesting on another Member's shift)
  const martinShift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-martin')!
  assert(!!martinShift, '2.4.0 find shift assigned to user-martin', 'ShiftSwap', `Shift ${martinShift.id} assigned to user-martin`)

  store.setCurrentUser('user-eliska') // Eliška is a regular member ('Člen')
  assert(!store.isMasterTenant.value, '2.4.1 Eliška is not master tenant', 'ShiftSwap', 'Role is Člen')

  store.requestShiftSwap(martinShift.id, 'user-jakub')
  assert(martinShift.swapRequest === undefined, '2.4.2 unauthorized member cannot request swap for others', 'ShiftSwap', 'swapRequest not created')
  const deniedReqToast = store.toasts.value.find(t => t.title === 'Přístup odepřen')
  assert(!!deniedReqToast, '2.4.3 access denied toast emitted', 'ShiftSwap', 'Toast emitted: Přístup odepřen')

  // 2.5 Unauthorized Acceptance / Rejection / Cancellation by Third Party
  // Now legitimate request created: Martin requests swap with Eliška
  store.setCurrentUser('user-martin')
  store.toggleShiftStatus(martinShift.id) // Reopen Martin's completed shift.
  store.requestShiftSwap(martinShift.id, 'user-eliska', 'Nestíhám kvůli zkoušce')
  assert(martinShift.swapRequest?.status === 'PENDING', '2.5.1 legitimate swap request created', 'ShiftSwap', 'status is PENDING')
  assert(martinShift.swapRequest?.targetRoommateId === 'user-eliska', '2.5.2 target is Eliška', 'ShiftSwap', 'target is user-eliska')
  assert(martinShift.swapRequest?.note === 'Nestíhám kvůli zkoušce', '2.5.3 note preserved', 'ShiftSwap', 'note matches')

  // Third party (Jakub, regular member) tries to accept
  store.setCurrentUser('user-jakub') // regular member
  store.toasts.value = []
  store.acceptShiftSwap(martinShift.id)
  assert(martinShift.swapRequest?.status === 'PENDING', '2.5.4 third-party accept rejected', 'ShiftSwap', 'status remains PENDING')
  assert(martinShift.roommateId === 'user-martin', '2.5.5 shift assignee unchanged after third-party accept', 'ShiftSwap', 'roommateId is still user-martin')
  assert(store.toasts.value.some(t => t.title === 'Přístup odepřen'), '2.5.6 toast: Přístup odepřen', 'ShiftSwap', 'Denied toast emitted')

  // Third party (Jakub) tries to reject
  store.toasts.value = []
  store.rejectShiftSwap(martinShift.id)
  assert(martinShift.swapRequest?.status === 'PENDING', '2.5.7 third-party reject rejected', 'ShiftSwap', 'status remains PENDING')
  assert(store.toasts.value.some(t => t.title === 'Přístup odepřen'), '2.5.8 toast: Přístup odepřen', 'ShiftSwap', 'Denied toast emitted')

  // Target flatmate (Eliška) tries to cancel (only requester or master tenant may cancel)
  store.setCurrentUser('user-eliska')
  store.toasts.value = []
  store.cancelShiftSwap(martinShift.id)
  assert(martinShift.swapRequest?.status === 'PENDING', '2.5.9 target flatmate cannot cancel request', 'ShiftSwap', 'status remains PENDING')
  assert(store.toasts.value.some(t => t.title === 'Přístup odepřen'), '2.5.10 toast: Přístup odepřen', 'ShiftSwap', 'Denied toast emitted')

  // 2.6 Legitimate Acceptance & Double Accept Concurrency
  store.setCurrentUser('user-eliska') // Target flatmate
  store.toasts.value = []
  store.acceptShiftSwap(martinShift.id)
  assert(martinShift.swapRequest?.status === 'ACCEPTED', '2.6.1 target flatmate successfully accepts', 'ShiftSwap', 'status is ACCEPTED')
  assert(martinShift.roommateId === 'user-eliska', '2.6.2 shift reassigned to target', 'ShiftSwap', 'roommateId is user-eliska')
  assert(martinShift.roommateName === 'Eliška Malá', '2.6.3 roommateName updated', 'ShiftSwap', 'roommateName updated')

  // DOUBLE ACCEPT: call acceptShiftSwap AGAIN
  const toastCountBeforeSecondAccept = store.toasts.value.length
  store.acceptShiftSwap(martinShift.id)
  assert(martinShift.swapRequest?.status === 'ACCEPTED', '2.6.4 double accept is no-op', 'ShiftSwap', 'status remains ACCEPTED')
  assert(store.toasts.value.length === toastCountBeforeSecondAccept, '2.6.5 no duplicate toast emitted', 'ShiftSwap', 'Double accept no side effects')

  // Reject or cancel on ALREADY ACCEPTED shift
  store.rejectShiftSwap(martinShift.id)
  assert(martinShift.swapRequest?.status === 'ACCEPTED', '2.6.6 reject after accept is no-op', 'ShiftSwap', 'status stays ACCEPTED')
  store.cancelShiftSwap(martinShift.id)
  assert(martinShift.swapRequest?.status === 'ACCEPTED', '2.6.7 cancel after accept is no-op', 'ShiftSwap', 'status stays ACCEPTED')

  // 2.7 Legitimate Rejection & Double Reject
  // Create another shift swap on Jakub's shift
  const jakubShift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-jakub')!
  store.setCurrentUser('user-jakub')
  store.requestShiftSwap(jakubShift.id, 'user-martin', 'Nestíhám')
  assert(jakubShift.swapRequest?.status === 'PENDING', '2.7.1 pending swap created for Jakub', 'ShiftSwap', 'status PENDING')

  // Target Martin rejects
  store.setCurrentUser('user-martin')
  store.toasts.value = []
  store.rejectShiftSwap(jakubShift.id)
  assert(jakubShift.swapRequest?.status === 'REJECTED', '2.7.2 target successfully rejects', 'ShiftSwap', 'status is REJECTED')
  assert(jakubShift.roommateId === 'user-jakub', '2.7.3 shift remains with original assignee', 'ShiftSwap', 'roommateId is user-jakub')

  // DOUBLE REJECT
  const toastCountBeforeSecondReject = store.toasts.value.length
  store.rejectShiftSwap(jakubShift.id)
  assert(jakubShift.swapRequest?.status === 'REJECTED', '2.7.4 double reject is no-op', 'ShiftSwap', 'status remains REJECTED')
  assert(store.toasts.value.length === toastCountBeforeSecondReject, '2.7.5 no duplicate toast emitted', 'ShiftSwap', 'Double reject no side effects')

  // Accept on ALREADY REJECTED shift
  store.acceptShiftSwap(jakubShift.id)
  assert(jakubShift.swapRequest?.status === 'REJECTED', '2.7.6 accept after reject is no-op', 'ShiftSwap', 'status stays REJECTED')

  // 2.8 Legitimate Cancellation & Double Cancel
  const tomasShift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-tomas')!
  store.setCurrentUser('user-tomas')
  store.requestShiftSwap(tomasShift.id, 'user-eliska')
  assert(tomasShift.swapRequest?.status === 'PENDING', '2.8.1 pending swap created by Tomáš', 'ShiftSwap', 'status PENDING')

  // Requester Tomáš cancels
  store.toasts.value = []
  store.cancelShiftSwap(tomasShift.id)
  assert(tomasShift.swapRequest?.status === 'CANCELLED', '2.8.2 requester successfully cancels', 'ShiftSwap', 'status is CANCELLED')

  // DOUBLE CANCEL
  const toastCountBeforeSecondCancel = store.toasts.value.length
  store.cancelShiftSwap(tomasShift.id)
  assert(tomasShift.swapRequest?.status === 'CANCELLED', '2.8.3 double cancel is no-op', 'ShiftSwap', 'status remains CANCELLED')
  assert(store.toasts.value.length === toastCountBeforeSecondCancel, '2.8.4 no duplicate toast emitted', 'ShiftSwap', 'Double cancel no side effects')

  // Accept or reject on ALREADY CANCELLED shift
  store.setCurrentUser('user-eliska')
  store.acceptShiftSwap(tomasShift.id)
  assert(tomasShift.swapRequest?.status === 'CANCELLED', '2.8.5 accept after cancel is no-op', 'ShiftSwap', 'status stays CANCELLED')
  store.rejectShiftSwap(tomasShift.id)
  assert(tomasShift.swapRequest?.status === 'CANCELLED', '2.8.6 reject after cancel is no-op', 'ShiftSwap', 'status stays CANCELLED')

  // 2.9 Master Tenant (Správce) Super-user Privileges
  // Správce can request, accept, reject, or cancel on any shift
  resetStore()
  const s1 = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-eliska')!
  store.setCurrentUser('user-tomas') // Správce
  assert(store.isMasterTenant.value, '2.9.1 Tomáš is Master Tenant', 'ShiftSwap', 'isMasterTenant is true')

  // Správce requests swap on Eliška's shift
  store.requestShiftSwap(s1.id, 'user-jakub', 'Správce přesunul směnu')
  assert(s1.swapRequest?.status === 'PENDING', '2.9.2 Správce can request swap on any shift', 'ShiftSwap', 'status PENDING')

  // Správce accepts swap on behalf of Jakub
  store.acceptShiftSwap(s1.id)
  assert(s1.swapRequest?.status === 'ACCEPTED', '2.9.3 Správce can accept swap on behalf of recipient', 'ShiftSwap', 'status ACCEPTED')
  assert(s1.roommateId === 'user-jakub', '2.9.4 shift reassigned to Jakub', 'ShiftSwap', 'roommateId is user-jakub')

  // =========================================================================
  // SUITE 3: Energy Prediction Edge Cases & Boundary Conditions
  // =========================================================================
  console.log('\n--- SUITE 3: Energy Prediction Edge Cases & Boundary Conditions ---')
  resetStore()

  // 3.1 Baseline Calibration Check
  const predBaseline = store.annualEnergyPrediction.value
  assert(predBaseline.annualAdvances === 103200, '3.1.1 baseline annualAdvances', 'Energy', `annualAdvances = ${predBaseline.annualAdvances}`)
  assert(predBaseline.projectedAnnualCost === 101750, '3.1.2 baseline projectedAnnualCost', 'Energy', `projectedAnnualCost = ${predBaseline.projectedAnnualCost}`)
  assert(predBaseline.netDelta === 1450, '3.1.3 baseline netDelta', 'Energy', `netDelta = ${predBaseline.netDelta}`)
  assert(predBaseline.isSurplus === true, '3.1.4 baseline isSurplus', 'Energy', `isSurplus = true`)
  const norm = (s: string) => s.replace(/\u00a0/g, ' ')
  assert(norm(predBaseline.formattedDelta) === '+1 450 CZK', '3.1.5 baseline formattedDelta', 'Energy', `formattedDelta = "${predBaseline.formattedDelta}"`)
  assert(predBaseline.drawdownPct === 99, '3.1.6 baseline drawdownPct', 'Energy', `drawdownPct = ${predBaseline.drawdownPct}%`)
  assert(predBaseline.riskLevel === 'Nízké riziko', '3.1.7 baseline riskLevel', 'Energy', `riskLevel = "${predBaseline.riskLevel}"`)

  // 3.2 Exact Boundary Condition: 100% Drawdown Threshold
  // When annualAdvances === projectedAnnualCost (101 750)
  // 101750 / 12 = 8479.166666666666
  store.settings.value.monthlyUtilities = 101750 / 12
  const pred100 = store.annualEnergyPrediction.value
  assert(Math.round(pred100.annualAdvances) === 101750, '3.2.1 100% threshold annualAdvances', 'Energy', `annualAdvances = ${pred100.annualAdvances}`)
  assert(pred100.drawdownPct === 100, '3.2.2 100% threshold drawdownPct', 'Energy', `drawdownPct = ${pred100.drawdownPct}%`)
  assert(pred100.isSurplus === true, '3.2.3 100% threshold isSurplus is true at netDelta=0', 'Energy', `isSurplus = ${pred100.isSurplus}`)
  assert(pred100.riskLevel === 'Nízké riziko', '3.2.4 100% threshold riskLevel', 'Energy', `riskLevel = "${pred100.riskLevel}"`)

  // 3.3 Boundary Condition: 101% Drawdown (Mírné překročení)
  // Projected cost 101750, advances 100680 -> 101750 / 100680 * 100 = 101.06% -> round: 101%
  store.settings.value.monthlyUtilities = 8390 // 8390 * 12 = 100680
  const pred101 = store.annualEnergyPrediction.value
  assert(pred101.drawdownPct === 101, '3.3.1 101% boundary drawdownPct', 'Energy', `drawdownPct = ${pred101.drawdownPct}%`)
  assert(pred101.riskLevel === 'Mírné překročení', '3.3.2 101% boundary riskLevel', 'Energy', `riskLevel = "${pred101.riskLevel}"`)
  assert(pred101.isSurplus === false, '3.3.3 101% boundary isSurplus is false', 'Energy', `isSurplus = false`)
  assert(pred101.netDelta === -1070, '3.3.4 101% boundary netDelta', 'Energy', `netDelta = ${pred101.netDelta}`)
  assert(norm(pred101.formattedDelta) === '-1 070 CZK', '3.3.5 101% boundary formattedDelta format', 'Energy', `formattedDelta = "${pred101.formattedDelta}"`)

  // 3.4 Boundary Condition: 108% Drawdown (Upper limit of Mírné překročení)
  // 101750 / 94200 = 1.0801 -> round: 108%
  store.settings.value.monthlyUtilities = 7850 // 7850 * 12 = 94200
  const pred108 = store.annualEnergyPrediction.value
  assert(pred108.drawdownPct === 108, '3.4.1 108% boundary drawdownPct', 'Energy', `drawdownPct = ${pred108.drawdownPct}%`)
  assert(pred108.riskLevel === 'Mírné překročení', '3.4.2 108% boundary riskLevel', 'Energy', `riskLevel = "${pred108.riskLevel}"`)

  // 3.5 Boundary Condition: 109% Drawdown (Transition to Vysoké riziko)
  // 101750 / 93360 = 1.0898 -> round: 109%
  store.settings.value.monthlyUtilities = 7780 // 7780 * 12 = 93360
  const pred109 = store.annualEnergyPrediction.value
  assert(pred109.drawdownPct === 109, '3.5.1 109% boundary drawdownPct', 'Energy', `drawdownPct = ${pred109.drawdownPct}%`)
  assert(pred109.riskLevel === 'Vysoké riziko', '3.5.2 109% boundary riskLevel', 'Energy', `riskLevel = "${pred109.riskLevel}"`)

  // 3.6 Very High Deficit / Negative Net Delta
  store.settings.value.monthlyUtilities = 5000 // 5000 * 12 = 60000
  const predDeficit = store.annualEnergyPrediction.value
  assert(predDeficit.annualAdvances === 60000, '3.6.1 large deficit annualAdvances', 'Energy', `annualAdvances = 60000`)
  assert(predDeficit.netDelta === -41750, '3.6.2 large deficit netDelta', 'Energy', `netDelta = -41750`)
  assert(predDeficit.drawdownPct === 170, '3.6.3 large deficit drawdownPct', 'Energy', `drawdownPct = 170%`)
  assert(predDeficit.riskLevel === 'Vysoké riziko', '3.6.4 large deficit riskLevel', 'Energy', `riskLevel = "Vysoké riziko"`)
  assert(norm(predDeficit.formattedDelta) === '-41 750 CZK', '3.6.5 large deficit formattedDelta', 'Energy', `formattedDelta = "${predDeficit.formattedDelta}"`)

  // 3.7 Very High Advances (Massive Surplus)
  store.settings.value.monthlyUtilities = 100000 // 100 000 * 12 = 1 200 000
  const predMassiveSurplus = store.annualEnergyPrediction.value
  assert(predMassiveSurplus.annualAdvances === 1200000, '3.7.1 massive surplus advances', 'Energy', `advances = 1 200 000`)
  assert(predMassiveSurplus.netDelta === 1098250, '3.7.2 massive surplus netDelta', 'Energy', `netDelta = +1 098 250`)
  assert(predMassiveSurplus.isSurplus === true, '3.7.3 massive surplus isSurplus', 'Energy', `isSurplus = true`)
  assert(predMassiveSurplus.drawdownPct === 8, '3.7.4 massive surplus drawdownPct', 'Energy', `drawdownPct = 8%`)
  assert(predMassiveSurplus.riskLevel === 'Nízké riziko', '3.7.5 massive surplus riskLevel', 'Energy', `riskLevel = "Nízké riziko"`)

  // Even higher: 1,000,000 CZK/month
  store.settings.value.monthlyUtilities = 1000000
  const predExtreme = store.annualEnergyPrediction.value
  assert(predExtreme.annualAdvances === 12000000, '3.7.6 extreme surplus advances', 'Energy', `advances = 12 000 000`)
  assert(predExtreme.drawdownPct === 1, '3.7.7 extreme surplus drawdownPct', 'Energy', `drawdownPct = 1%`)
  assert(!isNaN(predExtreme.drawdownPct) && !isNaN(predExtreme.netDelta), '3.7.8 no NaN in extreme calculations', 'Energy', 'Numeric values stable')

  // 3.8–3.10 Invalid advances must be rejected by the settings operation.
  resetStore()
  const settingsBefore = JSON.stringify(store.settings.value)
  for (const value of [0, -5000, NaN, Infinity]) {
    const saved = store.saveApartmentSettings({ ...store.settings.value, monthlyUtilities: value })
    assert(saved === false, `3.8 invalid advances rejected (${value})`, 'Energy', 'saveApartmentSettings returns false')
    assert(JSON.stringify(store.settings.value) === settingsBefore, `3.9 settings unchanged (${value})`, 'Energy', 'Invalid input does not mutate settings')
    assert(store.annualEnergyPrediction.value.annualAdvances === 103200, `3.10 prediction stable (${value})`, 'Energy', 'Rejected input preserves valid prediction')
  }

  // =========================================================================
  // SUITE 4: Randomized Fuzzing & Type Invariance Stress Test (1000 ops)
  // =========================================================================
  console.log('\n--- SUITE 4: Randomized Fuzzing & Invariant Stress (1,000 Operations) ---')
  resetStore()

  let fuzzErrors = 0
  const users = ['user-tomas', 'user-eliska', 'user-jakub', 'user-martin', 'user-unknown']
  const randomShiftIds = ['shift-w45-kitchen', 'shift-w45-bathroom', 'shift-w45-corridor', 'shift-w45-trash', 'invalid-shift', '']

  for (let i = 0; i < 1000; i++) {
    const op = Math.floor(Math.random() * 8)
    const randomUser = users[Math.floor(Math.random() * users.length)]
    const randomShift = randomShiftIds[Math.floor(Math.random() * randomShiftIds.length)]
    store.setCurrentUser(randomUser)

    try {
      switch (op) {
        case 0: {
          // Cart toggle
          const randCart = store.cartItems.value[Math.floor(Math.random() * (store.cartItems.value.length + 2))]
          store.toggleCartItemPurchased(randCart ? randCart.id : 'unknown-id')
          break
        }
        case 1: {
          // Cart convert item
          const randCart = store.cartItems.value[Math.floor(Math.random() * store.cartItems.value.length)]
          if (randCart) {
            store.convertCartItemToExpense(randCart)
          }
          break
        }
        case 2: {
          // Shift swap request
          const target = users[Math.floor(Math.random() * users.length)]
          store.requestShiftSwap(randomShift, target, 'Fuzz note')
          break
        }
        case 3: {
          // Shift swap accept
          store.acceptShiftSwap(randomShift)
          break
        }
        case 4: {
          // Shift swap reject
          store.rejectShiftSwap(randomShift)
          break
        }
        case 5: {
          // Shift swap cancel
          store.cancelShiftSwap(randomShift)
          break
        }
        case 6: {
          // Random settings utility mutation
          const randUtilities = [0, -100, 1000, 8600, 25000, 500000, 101750 / 12][Math.floor(Math.random() * 7)]
          store.saveApartmentSettings({ ...store.settings.value, monthlyUtilities: randUtilities })
          // Read prediction to trigger computed reactivity
          const p = store.annualEnergyPrediction.value
          if (isNaN(p.drawdownPct) || isNaN(p.netDelta) || !p.formattedDelta) {
            fuzzErrors++
          }
          break
        }
        case 7: {
          // Add expense while prefill may or may not be active
          store.addExpense({
            title: `Fuzz Expense ${i}`,
            totalAmount: Math.floor(Math.random() * 1000) + 10,
            category: 'Drogerie',
            date: '2026-11-06',
            payerId: randomUser,
            payerName: 'Fuzz User',
            status: 'ČÁSTEČNĚ',
            calculationKey: 'EQUAL',
            shares: []
          })
          break
        }
      }
    } catch (err) {
      console.error(`Fuzzing exception at iteration ${i}, op ${op}:`, err)
      fuzzErrors++
    }
  }

  assert(
    fuzzErrors === 0,
    '4.1 1,000 randomized operations zero exceptions',
    'Fuzzing',
    `Executed 1,000 randomized concurrent operations with ${fuzzErrors} errors`
  )

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n===============================================================')
  console.log('   STRESS TEST RESULTS SUMMARY')
  console.log('===============================================================')
  const totalTests = results.length
  const passedTests = results.filter(r => r.status === 'PASS').length
  const failedTests = results.filter(r => r.status === 'FAIL').length
  console.log(`Total tests run: ${totalTests}`)
  console.log(`Passed:         ${passedTests}`)
  console.log(`Failed:         ${failedTests}`)

  if (failedTests > 0) {
    console.error(`\nVerdict: REJECT / REQUEST_CHANGES (${failedTests} tests failed)`)
    return false
  } else {
    console.log(`\nVerdict: APPROVE (All ${passedTests} test scenarios PASSED with 0 exceptions)`)
    return true
  }
}
