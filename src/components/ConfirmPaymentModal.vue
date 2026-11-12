<template>
  <teleport to="body">
    <div 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-confirm-pay-title"
      @keydown.esc="closeModal"
      @click.self="closeModal"
    >
      <div 
        class="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-6 text-slate-100"
        ref="dialogPanel"
        tabindex="-1"
        @click.stop
      >
        <!-- Modal Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div>
            <h2 id="modal-confirm-pay-title" class="text-lg font-bold text-white tracking-tight">
              {{ t('confirmPayment.title', 'Potvrdit přijetí finanční úhrady') }}
            </h2>
            <p class="text-xs text-slate-400">
              {{ t('confirmPayment.subtitle', 'Spárování došlé platby a vyrovnání dlužného závazku spolubydlícího.') }}
            </p>
          </div>
          <button type="button"
            @click="closeModal"
            class="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            :aria-label="t('confirmPayment.close', 'Zavřít')"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Form Body -->
        <form @submit.prevent="handleConfirm" class="p-6 space-y-5">
          
          <!-- Rekapitulace pohledávky -->
          <div class="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div class="text-xs font-bold text-slate-400">
              {{ t('confirmPayment.recapTitle', 'Rekapitulace pohledávky k zaúčtování:') }}
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-400">{{ t('confirmPayment.debtor', 'Plátce dluhu:') }}</span>
              <span class="font-bold text-slate-200">{{ settlement.roommateName }} ({{ settlement.roomName }})</span>
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-400">{{ t('confirmPayment.matchedItem', 'Párovaná položka:') }}</span>
              <span class="text-slate-300">{{ t('confirmPayment.matchedItemValue', 'Nájemné & zálohy (Listopad 2026)') }}</span>
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-400">{{ t('confirmPayment.variableSymbol', 'Variabilní symbol:') }}</span>
              <span class="font-mono text-slate-300">20261101</span>
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-slate-800 text-sm">
              <span class="font-bold text-slate-300">{{ t('confirmPayment.confirmedAmount', 'Potvrzovaná částka:') }}</span>
              <span class="font-mono font-extrabold text-emerald-400 text-base">
                {{ settlement.totalDebt.toLocaleString('cs-CZ') }} CZK
              </span>
            </div>
          </div>

          <!-- Formulářová pole pro audit -->
          <div class="space-y-3 text-xs">
            
            <div>
              <label for="confirmpaymentmodal-field-1" class="block font-medium text-slate-300 mb-1">
                {{ t('confirmPayment.dateLabel', 'Reálné datum připsání na účet *') }}
              </label>
              <input id="confirmpaymentmodal-field-1"
                v-model="date"
                type="date"
                required
                :max="todayStr"
                class="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
              />
            </div>

            <fieldset>
              <legend class="block font-medium text-slate-300 mb-1">
                {{ t('confirmPayment.methodLabel', 'Forma úhrady *') }}
              </legend>
              <div class="grid grid-cols-2 gap-3">
                <label 
                  class="flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors"
                  :class="method === 'BANK' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200' : 'bg-slate-850 border-slate-700 text-slate-300'"
                >
                  <input type="radio" v-model="method" value="BANK" class="text-emerald-500" />
                  <span>{{ t('confirmPayment.bankTransfer', 'Bankovní převod') }}</span>
                </label>
                <label 
                  class="flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors"
                  :class="method === 'CASH' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200' : 'bg-slate-850 border-slate-700 text-slate-300'"
                >
                  <input type="radio" v-model="method" value="CASH" class="text-emerald-500" />
                  <span>{{ t('confirmPayment.cash', 'Hotovost') }}</span>
                </label>
              </div>
            </fieldset>

            <div>
              <label for="confirmpaymentmodal-field-2" class="block font-medium text-slate-300 mb-1">
                {{ t('confirmPayment.noteLabel', 'Doplňující poznámka (volitelné)') }}
              </label>
              <input id="confirmpaymentmodal-field-2"
                v-model="note"
                type="text"
                :placeholder="t('confirmPayment.notePlaceholder', 'např. Okamžitá platba z účtu Air Bank bez poplatku...')"
                class="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
              />
            </div>

            <!-- Notify Roommate checkbox -->
            <label class="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-850 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                v-model="notifyMember"
                class="mt-0.5 rounded text-emerald-500 focus:ring-emerald-400 border-slate-700 bg-slate-900"
              />
              <span class="text-xs text-slate-300 leading-tight">
                {{ t('confirmPayment.notifyPrefix', 'Odeslat uživateli') }} <strong>{{ settlement.roommateName }}</strong> {{ t('confirmPayment.notifySuffix', 'automatické potvrzení o zaúčtování platby (in-app notifikace a e-mail).') }}
              </span>
            </label>

          </div>

          <!-- Bezpečnostní upozornění -->
          <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2">
            <svg class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>
              <strong>{{ t('confirmPayment.warningLabel', 'Upozornění:') }}</strong> {{ t('confirmPayment.warningText', 'Potvrzením bude otevřený dluh označen jako vyrovnaný a částka se okamžitě promítne do celkové likvidity bytu.') }}
            </span>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 rounded-xl border border-slate-700 transition-colors"
            >
              {{ t('confirmPayment.cancel', 'Zrušit / Storno') }}
            </button>
            <button
              type="submit"
              class="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-lg shadow-emerald-950/40 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
            >
              {{ t('confirmPayment.confirmButton', 'Potvrdit přijetí {amount} CZK', { amount: settlement.totalDebt.toLocaleString('cs-CZ') }) }}
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
import { ref, computed } from 'vue'
import { useSpolubyt } from '../composables/useSpolubyt'
import { t } from '../i18n'

const { selectedSettlement, closeModal, confirmPayment } = useSpolubyt()

const settlement = computed(() => selectedSettlement.value!)
const todayStr = DEMO_TODAY

const date = ref(todayStr)
const method = ref<'BANK' | 'CASH'>('BANK')
const note = ref(t('confirmPayment.noteDefault', 'Okamžitá platba přes QR kód'))
const notifyMember = ref(true)

const handleConfirm = () => {
  confirmPayment(settlement.value.roommateId, {
    date: date.value,
    method: method.value,
    note: note.value,
    notifyMember: notifyMember.value
  })
}
const dialogPanel = ref<HTMLElement | null>(null)
useDialog(dialogPanel, closeModal)
</script>

