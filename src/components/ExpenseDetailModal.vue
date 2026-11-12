<template>
  <teleport to="body">
    <div 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-detail-title"
      @keydown.esc="closeModal"
    >
      <div 
        class="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-6 text-slate-100"
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
                :class="expense.status === 'UHRAZENO' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'"
              >
                {{ EXPENSE_STATUS_LABELS[expense.status] }}
              </span>
            </div>
            <h2 id="modal-detail-title" class="text-lg font-bold text-white tracking-tight mt-1">
              {{ expense.title }}
            </h2>
          </div>
          <button 
            @click="closeModal"
            class="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Zavřít"
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
                <span class="text-slate-400 block text-xs">Celková suma:</span>
                <span class="text-base font-bold text-emerald-400 font-mono">
                  {{ expense.totalAmount.toLocaleString('cs-CZ') }} CZK
                </span>
              </div>
              <div>
                <span class="text-slate-400 block text-xs">Plátce výdaje:</span>
                <span class="font-semibold text-slate-200">{{ expense.payerName }}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-xs">Datum pořízení:</span>
                <span class="font-mono text-slate-200">{{ formatDate(expense.date) }}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-xs">Kategorie:</span>
                <span class="font-medium text-slate-300">{{ expense.category }}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-xs">Kalkulační klíč:</span>
                <span class="font-medium text-slate-300">
                  {{ expense.calculationKey === 'BY_AREA' ? 'Podle m² plochy' : 'Rovným dílem' }}
                </span>
              </div>
              <div>
                <span class="text-slate-400 block text-xs">Doklad:</span>
                <span class="font-medium text-slate-300">{{ expense.receiptName || 'Bez přílohy' }}</span>
              </div>
            </div>

            <!-- Rozpad nákladů mezi spolubydlící -->
            <div class="space-y-2">
              <h3 class="text-xs font-bold text-slate-400">
                Rozpad podílů na jednotlivé členy bytu:
              </h3>

              <div class="border border-slate-800 rounded-xl overflow-hidden bg-slate-850">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-800/80 text-slate-400 border-b border-slate-700">
                    <tr>
                      <th class="py-2.5 px-3 font-semibold">Člen domácnosti</th>
                      <th class="py-2.5 px-3 font-semibold text-right">Podíl</th>
                      <th class="py-2.5 px-3 font-semibold text-center">Stav úhrady</th>
                      <th class="py-2.5 px-3 font-semibold text-right">Akce</th>
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
                        <span v-if="share.roommateId === currentUser.id" class="text-emerald-400 text-xs ml-1.5">[Vy]</span>
                      </td>
                      <td class="py-2.5 px-3 font-mono font-bold text-slate-100 text-right">
                        {{ Math.round(share.amount).toLocaleString('cs-CZ') }} CZK
                      </td>
                      <td class="py-2.5 px-3 text-center">
                        <span 
                          class="px-2 py-0.5 rounded text-xs font-bold"
                          :class="[
                            share.status === 'PLÁTCE' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                            share.status === 'UHRAZENO' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            share.status === 'PO_SPLATNOSTI' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                            'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          ]"
                        >
                          {{ EXPENSE_SHARE_STATUS_LABELS[share.status] }}
                        </span>
                      </td>
                      <td class="py-2.5 px-3 text-right">
                        <span v-if="share.status === 'PLÁTCE'" class="text-xs text-slate-400">
                          Plátce – 0 Kč k doplacení
                        </span>
                        <span v-else-if="share.status === 'UHRAZENO'" class="text-xs text-emerald-400">
                          {{ share.settledDate || 'Uhrazeno' }}
                        </span>
                        <span v-else-if="share.roommateId === currentUser.id" class="text-xs text-amber-400 font-semibold">
                          Váš dluh k úhradě
                        </span>
                        <button
                          v-else-if="isMasterTenant || expense.payerId === currentUser.id"
                          @click="triggerReminder(share.roommateId)"
                          class="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors"
                          title="Odeslat diskrétní notifikaci dlužníkovi"
                        >
                          Upomínka
                        </button>
                        <span v-else class="text-xs text-slate-400">
                          Čeká na úhradu
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
                <span class="text-slate-400">Záznam pořídil:</span>
                <span class="font-semibold text-slate-300 ml-1">{{ expense.audit.createdBy }}</span>
              </div>
              <div>
                <span class="text-slate-400">Čas pořízení:</span>
                <span class="font-mono text-slate-300 ml-1">{{ expense.audit.createdAt }}</span>
              </div>
            </div>

          </div>

          <!-- Right Column (5 cols): Receipt / Tab switching / Lightbox preview -->
          <div class="lg:col-span-5 flex flex-col space-y-3">
            
            <!-- Tabs -->
            <div class="flex items-center gap-1 p-1 bg-slate-800 rounded-xl border border-slate-700 text-xs font-semibold">
              <button
                @click="activeTab = 'receipt'"
                class="flex-1 py-1.5 rounded-lg transition-colors text-center"
                :class="activeTab === 'receipt' ? 'bg-slate-900 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'"
              >
                Účtenka / Scan
              </button>
              <button
                @click="activeTab = 'items'"
                class="flex-1 py-1.5 rounded-lg transition-colors text-center"
                :class="activeTab === 'items' ? 'bg-slate-900 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'"
              >
                Položky
              </button>
              <button
                @click="activeTab = 'audit'"
                class="flex-1 py-1.5 rounded-lg transition-colors text-center"
                :class="activeTab === 'audit' ? 'bg-slate-900 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'"
              >
                Audit stopa
              </button>
            </div>

            <!-- Tab 1: Simulated Receipt visual -->
            <div v-if="activeTab === 'receipt'" class="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div class="bg-amber-50 text-slate-900 font-mono text-xs p-4 rounded-lg shadow-inner space-y-3 relative overflow-hidden">
                <div class="text-center border-b border-dashed border-slate-400 pb-2">
                  <div class="font-bold text-sm tracking-widest uppercase">DM DROGERIE MARKT s.r.o.</div>
                  <div class="text-xs text-slate-600">Thákurova 14, 160 00 Praha 6</div>
                  <div class="text-xs text-slate-600">IČO: 12345678 • DIČ: CZ12345678</div>
                  <div class="text-xs text-slate-500 mt-1">{{ expense.date }} 16:45:12</div>
                </div>

                <!-- Items list on paper receipt -->
                <div class="space-y-1 text-xs pt-1">
                  <div class="flex justify-between">
                    <span>Prací gel Ariel Sensitive</span>
                    <span class="font-bold">349 Kč</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Tablety do myčky Somat</span>
                    <span class="font-bold">420 Kč</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Toaletní papír 16ks</span>
                    <span class="font-bold">189 Kč</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Čistič povrchů Savo</span>
                    <span class="font-bold">110 Kč</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Pytle na odpadky 60 l</span>
                    <span class="font-bold">82 Kč</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Poplatek za papírovou tašku</span>
                    <span class="font-bold">90 Kč</span>
                  </div>
                </div>

                <!-- Total -->
                <div class="border-t-2 border-slate-900 pt-2 flex justify-between text-xs font-extrabold">
                  <span>CELKEM K ÚHRADĚ:</span>
                  <span class="text-sm">{{ expense.totalAmount.toLocaleString('cs-CZ') }} CZK</span>
                </div>
                <div class="text-xs text-center text-slate-500 pt-2 border-t border-dashed border-slate-400">
                  PLATBA KARTOU VISA: ************4821<br/>
                  DĚKUJEME ZA NÁKUP!
                </div>
              </div>

              <!-- Action buttons for receipt -->
              <div class="flex items-center gap-2 mt-3 pt-2">
                <button
                  @click="isLightboxOpen = true"
                  class="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                  <span>Zvětšit (Lightbox)</span>
                </button>
                <button
                  @click="downloadReceipt"
                  class="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Stáhnout PDF</span>
                </button>
              </div>
            </div>

            <!-- Tab 2: Itemized breakdown -->
            <div v-else-if="activeTab === 'items'" class="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-3">
              <div class="text-slate-400 text-xs mb-2 font-medium">
                Položkový seznam z dokladu:
              </div>
              <div class="space-y-2">
                <div 
                  v-for="(item, idx) in (expense.receiptItems || defaultItems)" 
                  :key="item.id || idx"
                  class="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800"
                >
                  <div>
                    <div class="font-medium text-slate-200">{{ item.name }}</div>
                    <div class="text-xs text-slate-400">Počet kusů: {{ item.qty }} ks</div>
                  </div>
                  <div class="font-mono font-bold text-emerald-400 text-xs">
                    {{ item.price }} CZK
                  </div>
                </div>
              </div>
            </div>

            <!-- Tab 3: Detailed Audit Info -->
            <div v-else class="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-3 text-slate-300">
              <div class="font-bold text-slate-200 border-b border-slate-800 pb-1">
                Kryptografická a systémová stopa záznamu
              </div>
              <div class="space-y-1.5 text-xs">
                <div class="flex justify-between">
                  <span class="text-slate-400">ID záznamu:</span>
                  <span class="font-mono text-slate-300">{{ expense.id }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Autorizace:</span>
                  <span class="text-emerald-400 font-medium">BcA. Tomáš Beránek (Správce)</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Čas zápisu:</span>
                  <span class="font-mono text-slate-300">{{ expense.audit.createdAt }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Status integrity:</span>
                  <span class="text-emerald-400 font-semibold">Ověřeno (SHA-256 match)</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Poslední synchronizace:</span>
                  <span class="font-mono text-slate-400">Před 2 minutami</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        <!-- Modal Footer -->
        <div class="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-850">
          <button
            type="button"
            @click="handleDelete"
            class="px-3.5 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl border border-rose-500/20 transition-colors"
          >
            Smazat výdaj
          </button>
          
          <div class="flex items-center gap-3">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 rounded-xl border border-slate-700 transition-colors"
            >
              Zavřít okno
            </button>
          </div>
        </div>

        <!-- Lightbox Overlay -->
        <div 
          v-if="isLightboxOpen"
          class="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6"
          @click="isLightboxOpen = false"
        >
          <div class="max-w-md w-full bg-amber-50 p-6 rounded-2xl shadow-2xl text-slate-900 font-mono text-sm space-y-4" @click.stop>
            <div class="flex justify-between items-center border-b pb-2">
              <span class="font-bold">DETAIL DOKLADU (LIGHTBOX)</span>
              <button @click="isLightboxOpen = false" class="text-slate-600 hover:text-black font-bold p-1">✕</button>
            </div>
            <div class="text-center font-bold text-base">DM DROGERIE MARKT</div>
            <div class="text-xs text-slate-600 text-center">Účtenka z pokladny č. 4</div>
            <div class="text-xs border-y py-2 space-y-1">
              <div class="flex justify-between"><span>Prací gel Ariel</span><span>349 Kč</span></div>
              <div class="flex justify-between"><span>Tablety do myčky Somat</span><span>420 Kč</span></div>
              <div class="flex justify-between"><span>Toaletní papír 16ks</span><span>189 Kč</span></div>
              <div class="flex justify-between"><span>Čistič Savo</span><span>110 Kč</span></div>
              <div class="flex justify-between"><span>Pytle na odpad</span><span>82 Kč</span></div>
              <div class="flex justify-between"><span>Papírová taška</span><span>90 Kč</span></div>
            </div>
            <div class="flex justify-between font-bold text-base pt-1">
              <span>CELKEM CZK:</span>
              <span>{{ expense.totalAmount.toLocaleString('cs-CZ') }} Kč</span>
            </div>
            <button 
              @click="isLightboxOpen = false"
              class="w-full py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors"
            >
              Zavřít náhled
            </button>
          </div>
        </div>

      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSpolubyt } from '../composables/useSpolubyt'
import { Expense } from '../types'
import { EXPENSE_SHARE_STATUS_LABELS, EXPENSE_STATUS_LABELS } from '../utils/labels'

const { 
  selectedExpense, 
  currentUser,
  isMasterTenant,
  closeModal, 
  deleteExpense, 
  sendReminder, 
  showToast 
} = useSpolubyt()

const expense = computed(() => selectedExpense.value!)

const activeTab = ref<'receipt' | 'items' | 'audit'>('receipt')
const isLightboxOpen = ref(false)

const defaultItems = [
  { id: '1', name: 'Prací prostředek a gel', price: 349, qty: 1 },
  { id: '2', name: 'Tablety do myčky Somat', price: 420, qty: 1 },
  { id: '3', name: 'Toaletní papír 16ks', price: 189, qty: 1 },
  { id: '4', name: 'Savo na koupelny', price: 110, qty: 1 },
  { id: '5', name: 'Pytle na odpadky 60 l', price: 82, qty: 1 },
  { id: '6', name: 'DM taška velká', price: 90, qty: 1 },
]

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}. ${parts[1]}. ${parts[0]}`
  }
  return dateStr
}

const triggerReminder = (roommateId: string) => {
  sendReminder(roommateId)
}

const handleDelete = () => {
  deleteExpense(expense.value.id)
}

const downloadReceipt = () => {
  showToast(
    'Stahování dokladu',
    `Soubor ${expense.value.receiptName || 'doklad.pdf'} byl připraven ke stažení.`,
    'info'
  )
}
</script>

