<template>
  <teleport to="body">
    <div 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-detail-title"
      @keydown.esc="closeModal"
      @click.self="closeModal"
    >
      <div 
        class="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-6 text-slate-100"
        ref="dialogPanel"
        tabindex="-1"
        @click.stop
      >
        <!-- Modal Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {{ expense.code }}
              </span>
              <span 
                class="text-xs font-semibold px-2 py-0.5 rounded"
                :class="EXPENSE_BADGE_CLASSES[expense.status]"
              >
                {{ t('expenseStatus.' + expense.status, expense.status) }}
              </span>
            </div>
            <h2 id="modal-detail-title" class="text-lg font-bold text-white tracking-tight mt-1">
              {{ expense.title }}
            </h2>
          </div>
          <button type="button"
            @click="closeModal"
            class="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            :aria-label="t('expenseDetail.close', 'Zavřít')"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Body (Two-column layout) -->
        <div class="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[75vh] overflow-y-auto">
          
          <!-- Left Column (7 cols): Metadata & Breakdown table -->
          <div class="lg:col-span-7 space-y-6">
            
            <!-- Metadata Cards -->
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-850 border border-slate-800 text-xs">
              <div>
                <span class="text-slate-400 block text-xs">{{ t('expenseDetail.totalLabel', 'Celková suma:') }}</span>
                <span class="text-base font-bold text-emerald-400 font-mono">
                  {{ expense.totalAmount.toLocaleString('cs-CZ') }} CZK
                </span>
              </div>
              <div>
                <span class="text-slate-400 block text-xs">{{ t('expenseDetail.payerLabel', 'Plátce výdaje:') }}</span>
                <span class="font-semibold text-slate-200">{{ expense.payerName }}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-xs">{{ t('expenseDetail.dateLabel', 'Datum pořízení:') }}</span>
                <span class="font-mono text-slate-200">{{ formatDate(expense.date) }}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-xs">{{ t('expenseDetail.categoryLabel', 'Kategorie:') }}</span>
                <span class="font-medium text-slate-300">{{ t('categories.' + expense.category, expense.category) }}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-xs">{{ t('expenseDetail.calcKeyLabel', 'Kalkulační klíč:') }}</span>
                <span class="font-medium text-slate-300">
                  {{ expense.calculationKey === 'BY_AREA' ? t('expenseDetail.calcByArea', 'Podle m² plochy') : expense.calculationKey === 'CUSTOM' ? t('expenseDetail.calcCustom', 'Vlastní rozdělení') : t('expenseDetail.calcEqual', 'Rovným dílem') }}
                </span>
              </div>
              <div>
                <span class="text-slate-400 block text-xs">{{ t('expenseDetail.receiptLabel', 'Doklad:') }}</span>
                <span class="font-medium text-slate-300">{{ expense.receiptName || t('expenseDetail.noReceipt', 'Bez přílohy') }}</span>
              </div>
            </div>

            <!-- Rozpad nákladů mezi spolubydlící -->
            <div class="space-y-2">
              <h3 class="text-xs font-bold text-slate-400">
                {{ t('expenseDetail.breakdownTitle', 'Rozpad podílů na jednotlivé členy bytu:') }}
              </h3>

              <div v-if="canConfirmMemberPayment && expense.status !== 'UHRAZENO'" class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-850 border border-slate-800 text-xs">
                <label class="space-y-1">{{ t('confirmPayment.dateLabel', 'Reálné datum připsání na účet *') }}<input v-model="memberPaymentDate" type="date" :min="expense.date" :max="DEMO_TODAY" class="block w-full rounded-lg bg-slate-800 border border-slate-700 p-2" /></label>
                <label class="space-y-1">{{ t('confirmPayment.methodLabel', 'Forma úhrady *') }}<select v-model="memberPaymentMethod" class="block w-full rounded-lg bg-slate-800 border border-slate-700 p-2"><option value="BANK">{{ t('confirmPayment.bankTransfer', 'Bankovní převod') }}</option><option value="CASH">{{ t('confirmPayment.cash', 'Hotovost') }}</option></select></label>
                <label class="space-y-1 sm:col-span-2">{{ t('confirmPayment.noteLabel', 'Doplňující poznámka (volitelné)') }}<input v-model="memberPaymentNote" type="text" class="block w-full rounded-lg bg-slate-800 border border-slate-700 p-2" /></label>
                <label class="flex items-center gap-2 sm:col-span-2"><input v-model="memberPaymentNotify" type="checkbox" />{{ t('expenseDetail.notifySharePayment', 'Připravit simulované potvrzení pro člena') }}</label>
              </div>

              <div class="border border-slate-800 rounded-xl overflow-hidden bg-slate-850">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-800/80 text-slate-400 border-b border-slate-700">
                    <tr>
                      <th class="py-2.5 px-3 font-semibold">{{ t('expenseDetail.thMember', 'Člen domácnosti') }}</th>
                      <th class="py-2.5 px-3 font-semibold text-right">{{ t('expenseDetail.thShare', 'Podíl') }}</th>
                      <th class="py-2.5 px-3 font-semibold text-center">{{ t('expenseDetail.thStatus', 'Stav úhrady') }}</th>
                      <th class="py-2.5 px-3 font-semibold text-right">{{ t('expenseDetail.thActions', 'Akce') }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800">
                    <tr 
                      v-for="share in expense.shares" 
                      :key="share.roommateId" 
                      :class="share.roommateId === currentUser.id ? 'bg-emerald-500/10 font-bold' : 'hover:bg-slate-800/50 transition-colors'"
                    >
                      <td class="py-2.5 px-3 font-medium text-slate-200">
                        <span>{{ share.roommateName }}</span>
                        <span v-if="share.roommateId === currentUser.id" class="text-emerald-400 text-xs ml-1.5">{{ t('expenseDetail.you', '[Vy]') }}</span>
                      </td>
                      <td class="py-2.5 px-3 font-mono font-bold text-slate-100 text-right">
                        {{ share.amount.toLocaleString('cs-CZ') }} CZK
                      </td>
                      <td class="py-2.5 px-3 text-center">
                        <span 
                          class="px-2 py-0.5 rounded text-xs font-bold"
                          :class="EXPENSE_SHARE_BADGE_CLASSES[share.status]"
                        >
                          {{ t('shareStatus.' + share.status, share.status) }}
                        </span>
                      </td>
                      <td class="py-2.5 px-3 text-right">
                        <span v-if="share.status === 'PLÁTCE'" class="text-xs text-slate-400">
                          {{ t('expenseDetail.payerZero', 'Plátce – 0 Kč k doplacení') }}
                        </span>
                        <span v-else-if="share.status === 'UHRAZENO'" class="text-xs text-emerald-400">
                          {{ share.settledDate ? formatDate(share.settledDate) : t('expenseDetail.settled', 'Uhrazeno') }}
                          <span v-if="share.payment" class="block">{{ share.payment.method === 'CASH' ? t('confirmPayment.cash', 'Hotovost') : t('confirmPayment.bankTransfer', 'Bankovní převod') }}<span v-if="share.payment.note"> · {{ share.payment.note }}</span><span class="block">{{ t('expenseDetail.paymentRecorder', 'Potvrdil(a): {name}', { name: roommates.find(person => person.id === share.payment?.recordedBy)?.name || '—' }) }}</span></span>
                        </span>
                        <button v-else-if="canConfirmMemberPayment" type="button" @click="confirmMemberShare(share.roommateId)" class="px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/40">
                          {{ t('expenseDetail.confirmSharePayment', 'Potvrdit úhradu') }}
                        </button>
                        <span v-else-if="share.roommateId === currentUser.id" class="text-xs text-amber-400 font-semibold">
                          {{ t('expenseDetail.yourDebt', 'Váš dluh k úhradě') }}
                        </span>
                        <button type="button"
                          v-else-if="isMasterTenant && expense.payerId === managerRoommate.id"
                      @click="triggerReminder(share.roommateId)"
                          class="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors"
                          :title="t('expenseDetail.reminderTitle', 'Odeslat diskrétní notifikaci dlužníkovi')"
                        >
                          {{ t('expenseDetail.reminder', 'Upomínka') }}
                        </button>
                        <span v-else class="text-xs text-slate-400">
                          {{ t('expenseDetail.awaiting', 'Čeká na úhradu') }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Audit Trail -->
            <div class="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <div>
                <span class="text-slate-400">{{ t('expenseDetail.auditCreatedBy', 'Záznam pořídil:') }}</span>
                <span class="font-semibold text-slate-300 ml-1">{{ expense.audit.createdBy }}</span>
              </div>
              <div>
                <span class="text-slate-400">{{ t('expenseDetail.auditCreatedAt', 'Čas pořízení:') }}</span>
                <span class="font-mono text-slate-300 ml-1">{{ expense.audit.createdAt }}</span>
              </div>
            </div>

          </div>

          <!-- Right Column (5 cols): Receipt / Tab switching / Lightbox preview -->
          <div class="lg:col-span-5 flex flex-col space-y-3">
            
            <!-- Tabs -->
            <div class="flex items-center gap-1 p-1 bg-slate-800 rounded-xl border border-slate-700 text-xs font-semibold">
              <button type="button"
                @click="activeTab = 'receipt'"
                class="flex-1 py-1.5 rounded-lg transition-colors text-center"
                :class="activeTab === 'receipt' ? 'bg-slate-900 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'"
              >
                {{ t('expenseDetail.tabReceipt', 'Účtenka / Scan') }}
              </button>
              <button type="button"
                @click="activeTab = 'items'"
                class="flex-1 py-1.5 rounded-lg transition-colors text-center"
                :class="activeTab === 'items' ? 'bg-slate-900 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'"
              >
                {{ t('expenseDetail.tabItems', 'Položky') }}
              </button>
              <button type="button"
                @click="activeTab = 'audit'"
                class="flex-1 py-1.5 rounded-lg transition-colors text-center"
                :class="activeTab === 'audit' ? 'bg-slate-900 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'"
              >
                {{ t('expenseDetail.tabAudit', 'Audit stopa') }}
              </button>
            </div>

            <!-- Tab 1: Simulated Receipt visual -->
            <div v-if="activeTab === 'receipt'" class="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div class="text-sm text-slate-300 space-y-3">
                <p class="font-semibold">{{ expense.receiptName || t('expenseDetail.noReceiptAttached', 'K výdaji není přiložen doklad.') }}</p>
                <p>{{ expense.title }} · {{ formatDate(expense.date) }}</p>
                <p>{{ expense.totalAmount.toLocaleString('cs-CZ') }} Kč</p>
                <img v-if="expense.receiptUrl && expense.receiptType !== 'PDF'" :src="expense.receiptUrl" :alt="t('expenseDetail.receiptAlt', 'Přiložený doklad výdaje')" class="max-w-full rounded-lg" />
                <p v-else-if="expense.receiptName" class="text-xs text-slate-400">{{ t('expenseDetail.simulatedReceipt', 'Simulovaná příloha; soubor není součástí prototypu.') }}</p>
              </div>
            </div>

            <!-- Tab 2: Itemized breakdown -->
            <div v-else-if="activeTab === 'items'" class="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-3">
              <div class="text-slate-400 text-xs mb-2 font-medium">
                {{ t('expenseDetail.itemsHint', 'Položkový seznam z dokladu:') }}
              </div>
              <div class="space-y-2">
                <p v-if="!expense.receiptItems?.length" class="text-slate-400">{{ t('expenseDetail.noItems', 'Položkový rozpis není k dispozici.') }}</p>
                <div 
                  v-for="(item, idx) in (expense.receiptItems || [])"
                  :key="item.id || idx"
                  class="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800"
                >
                  <div>
                    <div class="font-medium text-slate-200">{{ item.name }}</div>
                    <div class="text-xs text-slate-400">{{ t('expenseDetail.qty', 'Počet kusů: {qty} ks', { qty: item.qty }) }}</div>
                  </div>
                  <div class="font-mono font-bold text-emerald-400 text-xs">
                    {{ (item.price * item.qty).toLocaleString('cs-CZ') }} Kč
                  </div>
                </div>
              </div>
            </div>

            <!-- Tab 3: Detailed Audit Info -->
            <div v-else class="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-3 text-slate-300">
              <div class="font-bold text-slate-200 border-b border-slate-800 pb-1">
                {{ t('expenseDetail.auditTitle', 'Historie záznamu') }}
              </div>
              <div class="space-y-1.5 text-xs">
                <div class="flex justify-between">
                  <span class="text-slate-400">{{ t('expenseDetail.recordId', 'ID záznamu:') }}</span>
                  <span class="font-mono text-slate-300">{{ expense.id }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">{{ t('expenseDetail.authorization', 'Autorizace:') }}</span>
                  <span class="text-emerald-400 font-medium">{{ expense.audit.createdBy }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">{{ t('expenseDetail.writeTime', 'Čas zápisu:') }}</span>
                  <span class="font-mono text-slate-300">{{ expense.audit.createdAt }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">{{ t('expenseDetail.integrity', 'Status integrity:') }}</span>
                  <span class="text-emerald-400 font-semibold">{{ t('expenseDetail.verified', 'Lokální demo záznam') }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">{{ t('expenseDetail.lastSync', 'Poslední synchronizace:') }}</span>
                  <span class="font-mono text-slate-400">{{ t('expenseDetail.minutesAgo', 'Bez synchronizace – offline prototyp') }}</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        <!-- Modal Footer -->
        <div class="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-850">
          <button
            type="button"
            v-if="canDeleteExpense(expense)"
            @click="handleDelete"
            class="px-3.5 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl border border-rose-500/20 transition-colors"
          >
            {{ t('expenseDetail.delete', 'Smazat výdaj') }}
          </button>
          
          <div class="flex items-center gap-3">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 rounded-xl border border-slate-700 transition-colors"
            >
              {{ t('expenseDetail.closeWindow', 'Zavřít okno') }}
            </button>
          </div>
        </div>

      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { EXPENSE_BADGE_CLASSES, EXPENSE_SHARE_BADGE_CLASSES } from '../utils/labels'
import { formatDateCz } from '../utils/format'
import { useDialog } from '../composables/useDialog'
import { ref, computed } from 'vue'
import { useSpolubyt } from '../composables/useSpolubyt'
import { t } from '../i18n'
import { DEMO_TODAY } from '../data/mockData'

const { 
  selectedExpense, 
  currentUser,
  roommates,
  managerRoommate,
  isMasterTenant,
  closeModal, 
  deleteExpense, 
  canDeleteExpense,
  sendReminder,
  confirmExpenseSharePayment,
} = useSpolubyt()

const expense = computed(() => selectedExpense.value!)

const canConfirmMemberPayment = computed(() => expense.value.payerId !== managerRoommate.value.id && (isMasterTenant.value || expense.value.payerId === currentUser.value.id))
const memberPaymentDate = ref(DEMO_TODAY)
const memberPaymentMethod = ref<'BANK' | 'CASH'>('BANK')
const memberPaymentNote = ref('')
const memberPaymentNotify = ref(true)
const confirmMemberShare = (roommateId: string): void => {
  confirmExpenseSharePayment(expense.value.id, roommateId, { date: memberPaymentDate.value, method: memberPaymentMethod.value, note: memberPaymentNote.value, notifyMember: memberPaymentNotify.value })
}

const activeTab = ref<'receipt' | 'items' | 'audit'>('receipt')

const formatDate = (dateStr: string): string => formatDateCz(dateStr, 'full')

const triggerReminder = (roommateId: string) => {
  sendReminder(roommateId)
}

const handleDelete = () => {
  deleteExpense(expense.value.id)
}

const dialogPanel = ref<HTMLElement | null>(null)
useDialog(dialogPanel, closeModal)
</script>

