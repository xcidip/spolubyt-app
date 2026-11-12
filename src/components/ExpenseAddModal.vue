<template>
  <teleport to="body">
    <div 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-add-title"
      @keydown.esc="closeModal"
      @click.self="closeModal"
    >
      <div 
        class="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-8"
        ref="dialogPanel"
        tabindex="-1"
        @click.stop
      >
        <!-- Modal Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div>
            <h2 id="modal-add-title" class="text-lg font-bold text-white tracking-tight">
              {{ t('expenseAdd.title', 'Zaevidovat nový výdaj domácnosti') }}
            </h2>
            <p class="text-xs text-slate-400">
              {{ t('expenseAdd.subtitle', 'Systém automaticky rozpočítá náklad a aktualizuje dlužné pohledávky spolubydlících.') }}
            </p>
          </div>
          <button type="button"
            @click="closeModal"
            class="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            :aria-label="t('expenseAdd.close', 'Zavřít')"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Body (Scrollable) -->
        <form @submit.prevent="handleSubmit" class="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          <!-- Section 1: Basic Parameters -->
          <div class="space-y-4">
            <div class="flex items-center gap-2 pb-1 border-b border-slate-800">
              <span class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">1</span>
              <h3 class="text-sm font-semibold text-slate-200">{{ t('expenseAdd.sectionBasic', 'Základní parametry transakce') }}</h3>
            </div>

            <div>
              <label for="expenseaddmodal-field-1" class="block text-xs font-medium text-slate-300 mb-1.5">
                {{ t('expenseAdd.labelTitle', 'Název výdaje či služby *') }}
              </label>
              <input id="expenseaddmodal-field-1"
                v-model="form.title"
                type="text"
                required
                :placeholder="t('expenseAdd.placeholderTitle', 'např. Nákup čistících prostředků, internet, oprava myčky...')"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="expenseaddmodal-field-2" class="block text-xs font-medium text-slate-300 mb-1.5">
                  {{ t('expenseAdd.labelAmount', 'Celková finanční částka *') }}
                </label>
                <div class="relative">
                  <input id="expenseaddmodal-field-2"
                    v-model.number="form.totalAmount"
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="0"
                    class="w-full pl-3.5 pr-12 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm font-semibold focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                  <span class="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">CZK</span>
                </div>
              </div>

              <div>
                <label for="expenseaddmodal-field-3" class="block text-xs font-medium text-slate-300 mb-1.5">
                  {{ t('expenseAdd.labelDate', 'Datum úhrady *') }}
                </label>
                <input id="expenseaddmodal-field-3"
                  v-model="form.date"
                  type="date"
                  required
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="expenseaddmodal-field-4" class="block text-xs font-medium text-slate-300 mb-1.5">
                  {{ t('expenseAdd.labelCategory', 'Věcná kategorie *') }}
                </label>
                <select id="expenseaddmodal-field-4"
                  v-model="form.category"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:outline-none transition-colors"
                >
                  <option value="Drogerie">{{ t('expenseAdd.categoryDrogerie', 'Drogerie a úklid') }}</option>
                  <option value="Bydlení">{{ t('expenseAdd.categoryBydleni', 'Bydlení a nájem') }}</option>
                  <option value="Energie">{{ t('expenseAdd.categoryEnergie', 'Energie a voda') }}</option>
                  <option value="Služby">{{ t('expenseAdd.categorySluzby', 'Služby a internet') }}</option>
                  <option value="Údržba">{{ t('expenseAdd.categoryUdrzba', 'Údržba a opravy') }}</option>
                  <option value="Jídlo">{{ t('expenseAdd.categoryJidlo', 'Společné jídlo a káva') }}</option>
                </select>
              </div>

              <div>
                <label for="expenseaddmodal-field-5" class="block text-xs font-medium text-slate-300 mb-1.5">
                  {{ t('expenseAdd.labelPayer', 'Kdo výdaj zaplatil (Plátce) *') }}
                </label>
                <select id="expenseaddmodal-field-5"
                  v-model="form.payerId"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:outline-none transition-colors"
                >
                  <option v-for="r in roommates" :key="r.id" :value="r.id">
                    {{ r.name }} ({{ t('roles.' + r.role, r.role) }})
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Section 2: Calculation Key & Split -->
          <div class="space-y-4">
            <div class="flex items-center gap-2 pb-1 border-b border-slate-800">
              <span class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">2</span>
              <h3 class="text-sm font-semibold text-slate-200">{{ t('expenseAdd.sectionCalc', 'Kalkulační klíč a zúčastněné osoby') }}</h3>
            </div>

            <!-- Key radio buttons -->
            <fieldset class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <legend class="sr-only">Kalkulační klíč výdaje</legend>
              <label 
                class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
                :class="form.calculationKey === 'EQUAL' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-200' : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'"
              >
                <input type="radio" v-model="form.calculationKey" value="EQUAL" class="text-emerald-500 focus:ring-emerald-400" />
                <div class="text-xs">
                  <div class="font-semibold">{{ t('expenseAdd.equalTitle', 'Rovným dílem') }}</div>
                  <div class="text-slate-400 text-xs">{{ t('expenseAdd.equalDesc', 'Stejná částka mezi vybrané členy') }}</div>
                </div>
              </label>

              <label 
                class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
                :class="form.calculationKey === 'BY_AREA' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-200' : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'"
              >
                <input type="radio" v-model="form.calculationKey" value="BY_AREA" class="text-emerald-500 focus:ring-emerald-400" />
                <div class="text-xs">
                  <div class="font-semibold">{{ t('expenseAdd.byAreaTitle', 'Poměrem dle m² pokoje') }}</div>
                  <div class="text-slate-400 text-xs">{{ t('expenseAdd.byAreaDesc', 'Dle podlahové plochy z nastavení bytu') }}</div>
                </div>
              </label>
            </fieldset>

            <!-- Roommate selection and live calculated shares -->
            <div class="space-y-2 bg-slate-850 p-4 rounded-xl border border-slate-800">
              <div class="text-xs font-medium text-slate-400 mb-2">
                {{ t('expenseAdd.participantsHint', 'Zúčastnění spolubydlící (vyškrtněte, koho se nákup netýká):') }}
              </div>

              <div 
                v-for="r in roommates" 
                :key="r.id"
                class="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60"
              >
                <label class="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="participantMap[r.id]"
                    class="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 border-slate-600 bg-slate-900"
                  />
                  <div class="flex items-center gap-2">
                    <div 
                      class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      :class="r.avatarColor"
                    >
                      {{ r.avatarInitial }}
                    </div>
                    <div>
                      <div class="text-xs font-medium text-slate-200">
                        {{ r.name }}
                        <span v-if="r.id === form.payerId" class="text-xs text-emerald-400 font-semibold ml-1">{{ t('expenseAdd.payerBadge', '[Plátce]') }}</span>
                      </div>
                      <div class="text-xs text-slate-400">{{ r.roomName }} ({{ r.roomAreaM2 }} m²)</div>
                    </div>
                  </div>
                </label>

                <!-- Calculated share -->
                <div class="text-right">
                  <div class="text-xs font-mono font-bold text-slate-100">
                    {{ participantMap[r.id] ? (computedShares[r.id] || 0).toLocaleString('cs-CZ') + ' CZK' : t('expenseAdd.excluded', 'Vyloučen') }}
                  </div>
                  <div v-if="participantMap[r.id]" class="text-xs text-slate-400">
                    {{ form.calculationKey === 'BY_AREA' ? t('expenseAdd.areaShare', '{pct} % plochy', { pct: r.areaSharePct }) : t('expenseAdd.equalShare', 'Rovný podíl') }}
                  </div>
                </div>
              </div>

              <!-- Checksum status bar -->
              <div class="flex items-center justify-between pt-3 mt-2 border-t border-slate-800 text-xs">
                <span class="text-slate-400">
                  {{ t('expenseAdd.checksumLabel', 'Kontrolní součet podílů:') }}
                  <strong class="font-mono text-slate-200">{{ totalAllocatedShares.toLocaleString('cs-CZ') }} CZK</strong> {{ t('expenseAdd.of', 'z') }}
                  <strong class="font-mono text-slate-200">{{ (form.totalAmount || 0).toLocaleString('cs-CZ') }} CZK</strong>
                </span>
                <span 
                  class="font-semibold px-2 py-0.5 rounded text-xs"
                  :class="isShareSumValid ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'"
                >
                  {{ isShareSumValid ? t('expenseAdd.sumValid', '✓ Součet je v pořádku') : t('expenseAdd.sumInvalid', '⚠ Zvolte alespoň 1 osobu') }}
                </span>
              </div>
            </div>
          </div>

          <!-- Section 3: Receipt upload / Document -->
          <div class="space-y-3">
            <div class="flex items-center gap-2 pb-1 border-b border-slate-800">
              <span class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">3</span>
              <h3 class="text-sm font-semibold text-slate-200">{{ t('expenseAdd.sectionReceipt', 'Příloha / Doklad o nákupu') }}</h3>
            </div>

            <!-- Dropzone simulator -->
            <div 
              class="border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors"
              :class="hasUploadedReceipt ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-700 bg-slate-800/40 hover:bg-slate-800'"
              @click="toggleSimulatedReceipt"
            >
              <div v-if="hasUploadedReceipt" class="flex items-center justify-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div class="text-left">
                  <div class="text-xs font-semibold text-emerald-300">{{ receiptFilename }}</div>
                  <div class="text-xs text-slate-400">{{ t('expenseAdd.receiptAttached', 'Digitalizovaný daňový doklad připojen (JPG, 412 KB)') }}</div>
                </div>
                <button 
                  type="button" 
                  @click.stop="hasUploadedReceipt = false"
                  class="ml-auto text-xs text-rose-400 hover:text-rose-300 p-1"
                >
                  {{ t('expenseAdd.remove', 'Odebrat') }}
                </button>
              </div>

              <div v-else class="space-y-1.5">
                <svg class="mx-auto w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div class="text-xs font-medium text-slate-300">
                  {{ t('expenseAdd.dropPrefix', 'Přetáhněte sem soubor účtenky nebo ') }}<span class="text-emerald-400 font-semibold underline">{{ t('expenseAdd.browse', 'vyberte z disku') }}</span>
                </div>
                <div class="text-xs text-slate-400">
                  {{ t('expenseAdd.formats', 'Podporované formáty: PDF, JPG, PNG (max. 10 MB)') }}
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Buttons -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 rounded-xl border border-slate-700 transition-colors"
            >
              {{ t('expenseAdd.cancel', 'Zrušit / Zavřít') }}
            </button>
            <button
              type="submit"
              :disabled="!isShareSumValid || form.totalAmount <= 0"
              class="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-lg shadow-emerald-950/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:ring-2 focus:ring-emerald-400 focus:outline-none"
            >
              {{ t('expenseAdd.submit', 'Uložit a rozpočítat výdaj') }}
            </button>
          </div>

        </form>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { DEMO_TODAY } from '../data/mockData'
import { useDialog } from '../composables/useDialog'
import { reactive, ref, computed, watch } from 'vue'
import { useSpolubyt } from '../composables/useSpolubyt'
import { CalculationKey, ExpenseCategory, ExpenseShare } from '../types'
import { t } from '../i18n'
import { roundMoney, splitAmount } from '../utils/money'

const { roommates, currentUser, expensePrefill, closeModal, addExpense, settings } = useSpolubyt()

const todayStr = DEMO_TODAY

const form = reactive({
  title: expensePrefill.value?.title || '',
  totalAmount: expensePrefill.value?.totalAmount ?? 100,
  date: todayStr,
  category: expensePrefill.value?.category || ('Drogerie' as ExpenseCategory),
  payerId: currentUser.value.id,
  calculationKey: 'EQUAL' as CalculationKey
})

watch(() => form.category, category => {
  form.calculationKey = category === 'Bydlení' ? settings.value.rules.rentKey
    : category === 'Energie' ? settings.value.rules.energyKey : settings.value.rules.suppliesKey
}, { immediate: true })

// Reactively update form fields when expensePrefill changes
watch(
  () => expensePrefill.value,
  (prefill) => {
    if (prefill) {
      form.title = prefill.title || ''
      form.totalAmount = prefill.totalAmount ?? 100
      form.category = prefill.category || ('Drogerie' as ExpenseCategory)
    }
  },
  { immediate: true }
)

// Automatically keep payer in sync with active persona
watch(() => currentUser.value.id, (newId) => {
  if (newId) {
    form.payerId = newId
  }
}, { immediate: true })

// Checkboxes for roommates
const participantMap = reactive<Record<string, boolean>>(
  Object.fromEntries(roommates.value.map(r => [r.id, true]))
)

const hasUploadedReceipt = ref(false)
const receiptFilename = ref('uctenka_nakup_' + todayStr + '.jpg')

const toggleSimulatedReceipt = () => {
  hasUploadedReceipt.value = !hasUploadedReceipt.value
}

const computedShares = computed(() => splitAmount(
  form.totalAmount,
  roommates.value.filter(r => participantMap[r.id]),
  form.calculationKey,
))

const totalAllocatedShares = computed(() => {
  return roundMoney(Object.values(computedShares.value).reduce((sum, val) => sum + val, 0))
})

const isShareSumValid = computed(() => {
  return Number.isFinite(form.totalAmount) && form.totalAmount > 0
    && Object.keys(computedShares.value).length > 0
    && Math.round(totalAllocatedShares.value * 100) === Math.round(form.totalAmount * 100)
})

const handleSubmit = () => {
  if (!isShareSumValid.value || form.totalAmount <= 0) return

  const payer = roommates.value.find(r => r.id === form.payerId)
  const shares: ExpenseShare[] = roommates.value.filter(r => participantMap[r.id]).map(r => {
    const id = r.id
    const amount = computedShares.value[id] || 0
    const isPayer = id === form.payerId
    
    return {
      roommateId: id,
      roommateName: r.name,
      amount,
      status: isPayer ? 'PLÁTCE' : amount > 0 ? 'DLUŽÍ' : 'UHRAZENO'
    }
  })

  const saved = addExpense({
    title: form.title,
    category: form.category,
    payerId: form.payerId,
    payerName: payer ? payer.name : 'Tomáš Beránek',
    date: form.date,
    totalAmount: roundMoney(form.totalAmount),
    calculationKey: form.calculationKey,
    shares,
    receiptName: hasUploadedReceipt.value ? receiptFilename.value : undefined,
    receiptType: hasUploadedReceipt.value ? 'JPG' : undefined,
    receiptItems: expensePrefill.value?.items,
    status: shares.every(share => share.status === 'PLÁTCE' || share.status === 'UHRAZENO') ? 'UHRAZENO' : 'ČÁSTEČNĚ'
  }, { cartItemIds: expensePrefill.value?.cartItemIds ?? (expensePrefill.value?.cartItemId ? [expensePrefill.value.cartItemId] : []) })
  if (saved) closeModal()
}
const dialogPanel = ref<HTMLElement | null>(null)
useDialog(dialogPanel, closeModal)
</script>

