/**
 * Milestone 1 Empirical Challenger Harness
 * Thoroughly stress-tests:
 * 1. Cart purchased toggle & expense conversion flow
 * 2. Auto-removal of converted cart items upon addExpense
 * 3. Shift swap state machine (request -> pending -> accept -> assigned / reject / cancel)
 * 4. Dynamic reactivity of annualEnergyPrediction across utility rates & consumption parameters
 */

import { pathToFileURL } from 'node:url'

// Minimal DOM / storage mocks for Node runtime
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
  scrollTo: () => {},
  addEventListener: () => {},
  removeEventListener: () => {}
}

let passedTests = 0
let failedTests = 0
const failures = []

function assert(condition, desc) {
  if (!condition) {
    throw new Error(desc || 'Assertion failed')
  }
}

function normalizeNbsp(str) {
  return typeof str === 'string' ? str.replace(/[\u00A0\u202F]/g, ' ') : str
}

function assertEqual(actual, expected, desc) {
  const normActual = normalizeNbsp(actual)
  const normExpected = normalizeNbsp(expected)
  if (normActual !== normExpected) {
    throw new Error(`${desc ? desc + ' — ' : ''}Expected ${JSON.stringify(normExpected)}, got ${JSON.stringify(normActual)}`)
  }
}

async function runTest(name, fn) {
  try {
    await fn()
    passedTests++
    console.log(`  ✔ [PASS] ${name}`)
  } catch (err) {
    failedTests++
    failures.push({ name, error: err })
    console.error(`  ✖ [FAIL] ${name}`)
    console.error(`     ${err.message}`)
  }
}

export async function runM1Challenger() {
  passedTests = 0
  failedTests = 0
  failures.length = 0

  console.log('================================================================');
  console.log('       MILESTONE 1 EMPIRICAL VERIFICATION & STRESS HARNESS       ');
  console.log('================================================================\n');

  const { useSpolubyt } = await import('../src/composables/useSpolubyt.ts')
  const store = useSpolubyt()

  function resetState() {
    globalThis.localStorage.clear()
    store.resetDemoData()
    if (store.confirmModal.value?.onConfirm) {
      store.confirmModal.value.onConfirm()
    }
  }

  // Helper to create a valid dummy Expense object
  function makeDummyExpense(overrides = {}) {
    return {
      title: 'Zkušební nákup',
      totalAmount: 300,
      category: 'Drogerie',
      payerId: 'user-tomas',
      payerName: 'Tomáš Beránek',
      date: '2026-11-06',
      calculationKey: 'EQUAL',
      shares: [
        { roommateId: 'user-tomas', roommateName: 'Tomáš Beránek', amount: 75, status: 'PLÁTCE' },
        { roommateId: 'user-jakub', roommateName: 'Jakub Kovář', amount: 75, status: 'DLUŽÍ' },
        { roommateId: 'user-eliska', roommateName: 'Eliška Malá', amount: 75, status: 'DLUŽÍ' },
        { roommateId: 'user-martin', roommateName: 'Martin Kučera', amount: 75, status: 'DLUŽÍ' }
      ],
      status: 'ČÁSTEČNĚ',
      ...overrides
    }
  }

  console.log('--- CATEGORY 1: Cart Purchased Toggle & Conversion Flow ---');

  await runTest('1.1 Initial cart mock fixtures verify isPurchased metadata', async () => {
    resetState()
    const cart1 = store.cartItems.value.find(i => i.id === 'cart-1')
    const cart2 = store.cartItems.value.find(i => i.id === 'cart-2')
    assert(cart1, 'cart-1 must exist')
    assertEqual(cart1.isPurchased, true, 'cart-1 must be initial purchased')
    assertEqual(cart1.purchasedBy, 'Jakub Kovář')
    assertEqual(cart1.purchasedAt, 'Včera')
    assert(cart2, 'cart-2 must exist')
    assertEqual(cart2.isPurchased, false, 'cart-2 must be initial unpurchased')
  })

  await runTest('1.2 toggleCartItemPurchased toggles unpurchased -> purchased with user attribution', async () => {
    resetState()
    store.setCurrentUser('user-eliska')
    const cart2 = store.cartItems.value.find(i => i.id === 'cart-2')
    assert(!cart2.isPurchased)

    store.toggleCartItemPurchased('cart-2')
    assertEqual(cart2.isPurchased, true, 'isPurchased should be true')
    assertEqual(cart2.purchasedBy, 'Eliška Malá', 'purchasedBy must be current user')
    assertEqual(cart2.purchasedAt, 'Právě teď', 'purchasedAt must be timestamp')
  })

  await runTest('1.3 toggleCartItemPurchased toggles purchased -> unpurchased and clears attribution', async () => {
    resetState()
    const cart1 = store.cartItems.value.find(i => i.id === 'cart-1')
    assertEqual(cart1.isPurchased, true)

    store.toggleCartItemPurchased('cart-1')
    assertEqual(cart1.isPurchased, false, 'isPurchased should revert to false')
    assertEqual(cart1.purchasedBy, undefined, 'purchasedBy must be cleared')
    assertEqual(cart1.purchasedAt, undefined, 'purchasedAt must be cleared')
  })

  await runTest('1.4 toggleCartItemPurchased with non-existent item id safely no-ops', async () => {
    resetState()
    const initialLen = store.cartItems.value.length
    store.toggleCartItemPurchased('non-existent-id')
    assertEqual(store.cartItems.value.length, initialLen, 'cart count unchanged')
  })

  await runTest('1.5 convertCartItemToExpense sets modal to EXP_ADD and populates expensePrefill payload', async () => {
    resetState()
    const item = store.cartItems.value.find(i => i.id === 'cart-2') // unitPrice: 189, qty: 2
    assert(item)
    store.convertCartItemToExpense(item)

    assertEqual(store.activeModal.value, 'EXP_ADD', 'activeModal must be EXP_ADD')
    assert(store.expensePrefill.value !== null, 'expensePrefill must be populated')
    assertEqual(store.expensePrefill.value.title, item.name)
    assertEqual(store.expensePrefill.value.totalAmount, 189 * 2)
    assertEqual(store.expensePrefill.value.category, item.category)
    assertEqual(store.expensePrefill.value.cartItemId, item.id)
    assertEqual(store.expensePrefill.value.items.length, 1)
    assertEqual(store.expensePrefill.value.items[0].price, 378)
  })

  await runTest('1.6 closeModal clears activeModal and resets expensePrefill to null', async () => {
    resetState()
    const item = store.cartItems.value[0]
    store.convertCartItemToExpense(item)
    assert(store.expensePrefill.value !== null)

    store.closeModal()
    assertEqual(store.activeModal.value, null)
    assertEqual(store.expensePrefill.value, null, 'expensePrefill must be null after closeModal')
  })

  console.log('\n--- CATEGORY 2: Auto-removal of Converted Cart Items upon addExpense ---');

  await runTest('2.1 addExpense removes the converted cart item referenced by expensePrefill.cartItemId', async () => {
    resetState()
    const initialCount = store.cartItems.value.length
    const targetItem = store.cartItems.value.find(i => i.id === 'cart-1')
    assert(targetItem)

    store.convertCartItemToExpense(targetItem)
    assertEqual(store.expensePrefill.value.cartItemId, 'cart-1')

    const exp = makeDummyExpense({ title: targetItem.name, totalAmount: targetItem.unitPrice * targetItem.qty })
    store.addExpense(exp)

    // Item must be removed from cart
    assertEqual(store.cartItems.value.length, initialCount - 1)
    assert(!store.cartItems.value.some(i => i.id === 'cart-1'), 'cart-1 must no longer be in cartItems')
    // expensePrefill must be reset
    assertEqual(store.expensePrefill.value, null, 'expensePrefill reset to null')
    assertEqual(store.activeModal.value, null, 'modal closed')
    // New expense added
    assertEqual(store.expenses.value[0].title, targetItem.name)
  })

  await runTest('2.2 Regular manual addExpense (without conversion) does NOT remove any cart items', async () => {
    resetState()
    const initialCartCount = store.cartItems.value.length
    assertEqual(store.expensePrefill.value, null)

    const exp = makeDummyExpense({ title: 'Ruční výdaj mimo košík' })
    store.addExpense(exp)

    assertEqual(store.cartItems.value.length, initialCartCount, 'Cart items must remain unchanged')
  })

  await runTest('2.3 Conversion opened, cancelled, then manual expense added does NOT remove cart item', async () => {
    resetState()
    const targetItem = store.cartItems.value.find(i => i.id === 'cart-2')
    assert(targetItem)

    // User starts conversion
    store.convertCartItemToExpense(targetItem)
    // User cancels modal
    store.closeModal()
    assertEqual(store.expensePrefill.value, null)

    // User later adds an unrelated manual expense
    const exp = makeDummyExpense({ title: 'Nákup něčeho jiného' })
    store.addExpense(exp)

    assert(store.cartItems.value.some(i => i.id === 'cart-2'), 'cart-2 must NOT be deleted after cancelled conversion')
  })

  await runTest('2.4 Converted cart item pre-deleted before addExpense completes safely without throwing', async () => {
    resetState()
    const targetItem = store.cartItems.value.find(i => i.id === 'cart-1')
    assert(targetItem, 'cart-1 must exist')
    store.convertCartItemToExpense(targetItem)

    // Simulate external deletion of cart-1
    store.removeCartItem('cart-1')
    if (store.confirmModal.value?.onConfirm) {
      store.confirmModal.value.onConfirm()
    }
    assert(!store.cartItems.value.some(i => i.id === 'cart-1'), 'cart-1 must be deleted')

    // Submitting expense now must not throw error
    const exp = makeDummyExpense()
    store.addExpense(exp)
    assertEqual(store.expensePrefill.value, null)
  })

  await runTest('2.5 Sequential conversions of multiple items removes each successively and cleanly', async () => {
    resetState()
    const item1 = store.cartItems.value[0]
    store.convertCartItemToExpense(item1)
    store.addExpense(makeDummyExpense({ title: item1.name }))

    const item2 = store.cartItems.value[0]
    store.convertCartItemToExpense(item2)
    store.addExpense(makeDummyExpense({ title: item2.name }))

    assert(!store.cartItems.value.some(i => i.id === item1.id))
    assert(!store.cartItems.value.some(i => i.id === item2.id))
  })

  console.log('\n--- CATEGORY 3: Shift Swap State Machine ---');

  await runTest('3.1 Full Lifecycle: request -> PENDING -> accept -> ACCEPTED + shift reassigned', async () => {
    resetState()
    // Week 45 shifts
    const shift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-jakub')
    assert(shift, 'Shift for Jakub must exist in week 45')
    assertEqual(shift.swapRequest, undefined)

    // Jakub requests swap with Eliška
    store.setCurrentUser('user-jakub')
    store.requestShiftSwap(shift.id, 'user-eliska', 'Nestíhám kvůli zkoušce')

    assert(shift.swapRequest, 'swapRequest must be created')
    assertEqual(shift.swapRequest.status, 'PENDING')
    assertEqual(shift.swapRequest.targetRoommateId, 'user-eliska')
    assertEqual(shift.swapRequest.targetRoommateName, 'Eliška Malá')
    assertEqual(shift.swapRequest.requestedByRoommateId, 'user-jakub')
    assertEqual(shift.swapRequest.requestedByRoommateName, 'Jakub Kovář')
    assertEqual(shift.swapRequest.note, 'Nestíhám kvůli zkoušce')
    assertEqual(shift.roommateId, 'user-jakub', 'Shift assignee not changed yet')

    // Eliška logs in and accepts swap
    store.setCurrentUser('user-eliska')
    store.acceptShiftSwap(shift.id)

    assertEqual(shift.swapRequest.status, 'ACCEPTED')
    assertEqual(shift.roommateId, 'user-eliska', 'Shift must now be assigned to Eliška Malá')
    assertEqual(shift.roommateName, 'Eliška Malá')
  })

  await runTest('3.2 Rejection Lifecycle: request -> PENDING -> reject -> REJECTED (assignee unchanged)', async () => {
    resetState()
    const shift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-jakub')
    assert(shift, 'Shift for Jakub must exist in week 45')

    store.setCurrentUser('user-jakub')
    store.requestShiftSwap(shift.id, 'user-eliska')
    assertEqual(shift.swapRequest.status, 'PENDING')

    // Eliška rejects
    store.setCurrentUser('user-eliska')
    store.rejectShiftSwap(shift.id)

    assertEqual(shift.swapRequest.status, 'REJECTED')
    assertEqual(shift.roommateId, 'user-jakub', 'Shift assignee must remain Jakub')
  })

  await runTest('3.3 Cancellation Lifecycle: request -> PENDING -> cancel -> CANCELLED (assignee unchanged)', async () => {
    resetState()
    const shift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-jakub')
    assert(shift, 'Shift for Jakub must exist in week 45')

    store.setCurrentUser('user-jakub')
    store.requestShiftSwap(shift.id, 'user-martin', 'Zruším to později')
    assertEqual(shift.swapRequest.status, 'PENDING')

    // Jakub cancels his own request
    store.cancelShiftSwap(shift.id)
    assertEqual(shift.swapRequest.status, 'CANCELLED')
    assertEqual(shift.roommateId, 'user-jakub', 'Shift assignee must remain Jakub')
  })

  await runTest('3.4 Security: Non-assigned regular tenant cannot initiate swap for someone else', async () => {
    resetState()
    const shift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-jakub')
    assert(shift)

    // Martin tries to swap Jakub's shift
    store.setCurrentUser('user-martin')
    store.requestShiftSwap(shift.id, 'user-eliska')
    assertEqual(shift.swapRequest, undefined, 'Swap request must NOT be created')
  })

  await runTest('3.5 Security: Unrelated third party cannot accept or reject swap request', async () => {
    resetState()
    const shift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-jakub')
    assert(shift)
    store.setCurrentUser('user-jakub')
    store.requestShiftSwap(shift.id, 'user-eliska')

    // Martin (not target) tries to accept
    store.setCurrentUser('user-martin')
    store.acceptShiftSwap(shift.id)
    assertEqual(shift.swapRequest.status, 'PENDING', 'Accept must be blocked')

    // Martin tries to reject
    store.rejectShiftSwap(shift.id)
    assertEqual(shift.swapRequest.status, 'PENDING', 'Reject must be blocked')
  })

  await runTest('3.6 Security: Správce (master tenant) has administrative authority over swaps', async () => {
    resetState()
    const shift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-jakub')
    assert(shift)
    // Jakub requests to Eliška
    store.setCurrentUser('user-jakub')
    store.requestShiftSwap(shift.id, 'user-eliska')

    // Správce Tomáš accepts on behalf
    store.setCurrentUser('user-tomas')
    store.acceptShiftSwap(shift.id)
    assertEqual(shift.swapRequest.status, 'ACCEPTED')
    assertEqual(shift.roommateId, 'user-eliska')
  })

  await runTest('3.7 Edge Case: Self-swap request is rejected', async () => {
    resetState()
    const shift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-jakub')
    assert(shift)
    store.setCurrentUser('user-jakub')
    store.requestShiftSwap(shift.id, 'user-jakub')
    assertEqual(shift.swapRequest, undefined, 'Cannot swap shift with oneself')
  })

  await runTest('3.8 State Invariant: Cannot accept or cancel already ACCEPTED / REJECTED swap', async () => {
    resetState()
    const shift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-jakub')
    assert(shift)
    store.setCurrentUser('user-jakub')
    store.requestShiftSwap(shift.id, 'user-eliska')

    store.setCurrentUser('user-eliska')
    store.acceptShiftSwap(shift.id)
    assertEqual(shift.swapRequest.status, 'ACCEPTED')

    // Attempting to reject already accepted swap
    store.rejectShiftSwap(shift.id)
    assertEqual(shift.swapRequest.status, 'ACCEPTED', 'Status must remain ACCEPTED')

    // Attempting to cancel already accepted swap
    store.setCurrentUser('user-jakub')
    store.cancelShiftSwap(shift.id)
    assertEqual(shift.swapRequest.status, 'ACCEPTED', 'Status must remain ACCEPTED')
  })

  console.log('\n--- CATEGORY 4: Dynamic Reactivity of annualEnergyPrediction ---');

  await runTest('4.1 Baseline calculation produces expected surplus and low risk', async () => {
    resetState()
    const pred = store.annualEnergyPrediction.value

    assertEqual(pred.annualAdvances, 103200, 'Default advances 8600 * 12 = 103 200')
    assertEqual(pred.projectedAnnualCost, 101750, 'Baseline projected annual cost is 101 750')
    assertEqual(pred.netDelta, 1450, '103200 - 101750 = +1450')
    assertEqual(pred.isSurplus, true)
    assertEqual(pred.formattedDelta, '+1 450 CZK')
    assertEqual(pred.drawdownPct, 99)
    assertEqual(pred.riskLevel, 'Nízké riziko')
  })

  await runTest('4.2 Dynamic updates: Lowering monthlyUtilities to 8 000 CZK yields moderate overrun', async () => {
    resetState()
    store.settings.value.monthlyUtilities = 8000

    const pred = store.annualEnergyPrediction.value
    assertEqual(pred.annualAdvances, 96000)
    assertEqual(pred.projectedAnnualCost, 101750)
    assertEqual(pred.netDelta, -5750)
    assertEqual(pred.isSurplus, false)
    assertEqual(pred.formattedDelta, '-5 750 CZK')
    assertEqual(pred.drawdownPct, 106)
    assertEqual(pred.riskLevel, 'Mírné překročení')
  })

  await runTest('4.3 Dynamic updates: Lowering monthlyUtilities to 7 000 CZK yields high risk', async () => {
    resetState()
    store.settings.value.monthlyUtilities = 7000

    const pred = store.annualEnergyPrediction.value
    assertEqual(pred.annualAdvances, 84000)
    assertEqual(pred.projectedAnnualCost, 101750)
    assertEqual(pred.netDelta, -17750)
    assertEqual(pred.isSurplus, false)
    assertEqual(pred.formattedDelta, '-17 750 CZK')
    assertEqual(pred.drawdownPct, 121)
    assertEqual(pred.riskLevel, 'Vysoké riziko')
  })

  await runTest('4.4 Dynamic updates: Increasing monthlyUtilities to 12 000 CZK yields large surplus', async () => {
    resetState()
    store.settings.value.monthlyUtilities = 12000

    const pred = store.annualEnergyPrediction.value
    assertEqual(pred.annualAdvances, 144000)
    assertEqual(pred.netDelta, 42250)
    assertEqual(pred.isSurplus, true)
    assertEqual(pred.formattedDelta, '+42 250 CZK')
    assertEqual(pred.drawdownPct, 71)
    assertEqual(pred.riskLevel, 'Nízké riziko')
  })

  await runTest('4.5 saveApartmentSettings updates trigger reactive re-computation', async () => {
    resetState()
    const current = store.settings.value
    store.saveApartmentSettings({ ...current, monthlyUtilities: 9000 })

    const pred = store.annualEnergyPrediction.value
    assertEqual(pred.annualAdvances, 108000)
    assertEqual(pred.netDelta, 6250)
    assertEqual(pred.isSurplus, true)
    assertEqual(pred.formattedDelta, '+6 250 CZK')
    assertEqual(pred.drawdownPct, 94)
  })

  await runTest('4.6 Boundary condition: exact breakeven advances', async () => {
    resetState()
    store.settings.value.monthlyUtilities = 101750 / 12

    const pred = store.annualEnergyPrediction.value
    assertEqual(pred.annualAdvances, 101750)
    assertEqual(pred.netDelta, 0)
    assertEqual(pred.isSurplus, true)
    assertEqual(pred.formattedDelta, '+0 CZK')
    assertEqual(pred.drawdownPct, 100)
    assertEqual(pred.riskLevel, 'Nízké riziko')
  })

  console.log('\n--- CATEGORY 5: Adversarial Stress Tests & Boundary Mining ---');

  await runTest('5.1 Multiple concurrent swap requests on different shifts remain completely isolated', async () => {
    resetState()
    const shiftJakub = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-jakub')
    const shiftTomas = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-tomas')
    assert(shiftJakub && shiftTomas)

    // Jakub requests to Eliška
    store.setCurrentUser('user-jakub')
    store.requestShiftSwap(shiftJakub.id, 'user-eliska', 'Jakub note')

    // Tomáš requests to Martin
    store.setCurrentUser('user-tomas')
    store.requestShiftSwap(shiftTomas.id, 'user-martin', 'Tomas note')

    assertEqual(shiftJakub.swapRequest.targetRoommateId, 'user-eliska')
    assertEqual(shiftJakub.swapRequest.note, 'Jakub note')
    assertEqual(shiftTomas.swapRequest.targetRoommateId, 'user-martin')
    assertEqual(shiftTomas.swapRequest.note, 'Tomas note')

    // Eliška accepts Jakub's swap
    store.setCurrentUser('user-eliska')
    store.acceptShiftSwap(shiftJakub.id)

    assertEqual(shiftJakub.swapRequest.status, 'ACCEPTED')
    assertEqual(shiftJakub.roommateId, 'user-eliska')
    assertEqual(shiftTomas.swapRequest.status, 'PENDING', 'Tomas shift must remain PENDING')
    assertEqual(shiftTomas.roommateId, 'user-tomas')
  })

  await runTest('5.2 Note with whitespace trims to undefined; emojis and quotes are preserved', async () => {
    resetState()
    const shift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-jakub')
    assert(shift)

    // Blank note
    store.setCurrentUser('user-jakub')
    store.requestShiftSwap(shift.id, 'user-eliska', '     ')
    assertEqual(shift.swapRequest.note, undefined)

    // Emoji and quotes note
    store.requestShiftSwap(shift.id, 'user-eliska', 'Díky moc! 🙏 "Vezmu ti to příště"')
    assertEqual(shift.swapRequest.note, 'Díky moc! 🙏 "Vezmu ti to příště"')
  })

  await runTest('5.3 Overwriting a pending swap request with a new one updates target and note cleanly', async () => {
    resetState()
    const shift = store.cleaningShifts.value.find(s => s.weekNumber === 45 && s.roommateId === 'user-jakub')
    assert(shift)

    store.setCurrentUser('user-jakub')
    store.requestShiftSwap(shift.id, 'user-eliska', 'První pokus')
    assertEqual(shift.swapRequest.targetRoommateId, 'user-eliska')

    // Re-request to Martin
    store.requestShiftSwap(shift.id, 'user-martin', 'Změna na Martina')
    assertEqual(shift.swapRequest.targetRoommateId, 'user-martin')
    assertEqual(shift.swapRequest.targetRoommateName, 'Martin Pospíšil')
    assertEqual(shift.swapRequest.status, 'PENDING')
    assertEqual(shift.swapRequest.note, 'Změna na Martina')
  })

  await runTest('5.4 Extreme monthlyUtilities: 0 falls back to 8600; large value handles low drawdown', async () => {
    resetState()
    // 0 falls back to default 8600
    store.settings.value.monthlyUtilities = 0
    let pred = store.annualEnergyPrediction.value
    assertEqual(pred.annualAdvances, 103200, '0 falls back to 8600 * 12 = 103200')
    assertEqual(pred.drawdownPct, 99)

    // 50 000 CZK / mo
    store.settings.value.monthlyUtilities = 50000
    pred = store.annualEnergyPrediction.value
    assertEqual(pred.annualAdvances, 600000)
    assertEqual(pred.drawdownPct, 17)
    assertEqual(pred.riskLevel, 'Nízké riziko')
    assertEqual(pred.isSurplus, true)
  })

  await runTest('5.5 addExpense with nonexistent cartItemId leaves existing cart items untouched', async () => {
    resetState()
    const initialIds = store.cartItems.value.map(i => i.id)

    // Manually force an invalid cartItemId in prefill
    store.openModal('EXP_ADD', { title: 'Ghost item', cartItemId: 'nonexistent-cart-999' })
    store.addExpense(makeDummyExpense({ title: 'Ghost item' }))

    const remainingIds = store.cartItems.value.map(i => i.id)
    assertEqual(JSON.stringify(remainingIds), JSON.stringify(initialIds), 'Cart items must not be altered')
  })

  await runTest('5.6 Non-existent shiftId passed to swap methods safely no-ops without throwing', async () => {
    resetState()
    store.requestShiftSwap('bogus-shift-id', 'user-eliska')
    store.acceptShiftSwap('bogus-shift-id')
    store.rejectShiftSwap('bogus-shift-id')
    store.cancelShiftSwap('bogus-shift-id')
  })

  await runTest('5.7 Rapid toggling (100x) of toggleCartItemPurchased retains deterministic boolean state', async () => {
    resetState()
    const item = store.cartItems.value.find(i => i.id === 'cart-2')
    assert(item)
    assertEqual(item.isPurchased, false)

    for (let i = 0; i < 100; i++) {
      store.toggleCartItemPurchased('cart-2')
    }
    // 100 toggles from false -> even number -> should be false
    assertEqual(item.isPurchased, false)
    assertEqual(item.purchasedBy, undefined)

    // 1 more toggle -> 101 toggles -> should be true
    store.toggleCartItemPurchased('cart-2')
    assertEqual(item.isPurchased, true)
    assertEqual(item.purchasedBy, 'Tomáš Beránek')
  })

  console.log('\n================================================================');
  console.log(`Summary: Total ${passedTests + failedTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    console.error('Failure Details:');
    failures.forEach((f, i) => {
      console.error(`${i + 1}. ${f.name}`);
      console.error(`   ${f.error.stack || f.error.message}\n`);
    });
    return false
  }
  return true
}

// Auto-run if executed directly
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runM1Challenger().then(success => {
    process.exit(success ? 0 : 1)
  }).catch(err => {
    console.error('Fatal test error:', err)
    process.exit(1)
  })
}
