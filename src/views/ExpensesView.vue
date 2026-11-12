<template>
  <div class="space-y-6">
    
    <!-- Top Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-white tracking-tight">
          Výpis výdajů a plateb
        </h1>
        <p class="text-xs text-slate-400 mt-0.5">
          Zobrazeno <strong class="text-slate-200">{{ filteredExpenses.length }}</strong> z {{ expenses.length }} záznamů • 
          Součet vyfiltrovaných nákladů: <strong class="text-emerald-400 font-mono">{{ filteredExpensesSum.toLocaleString('cs-CZ') }} CZK</strong> •
          Váš podíl: <strong class="text-sky-300 font-mono">{{ Math.round(myFilteredShareSum).toLocaleString('cs-CZ') }} CZK</strong>
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <button
          @click="exportExpensesCsv"
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          title="Exportovat vyfiltrovaný seznam do formátu CSV"
        >
          <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Export CSV</span>
        </button>

        <button
          @click="openModal('EXP_ADD')"
          class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-all hover:scale-105"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>Zadat nový výdaj</span>
        </button>
      </div>
    </div>

    <!-- Filter & Search Bar -->
    <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
      
      <!-- Top Row: Search input & Period & Category -->
      <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
        
        <!-- Search -->
        <div class="sm:col-span-5 relative">
          <input
            v-model="expenseFilters.search"
            type="text"
            placeholder="Hledat výdaj dle názvu, kódu či plátce..."
            aria-label="Hledat výdaj dle názvu, kódu či plátce"
            class="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500/40 focus:outline-none transition-colors"
          />
          <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <!-- Period selector -->
        <div class="sm:col-span-3">
          <select
            v-model="expenseFilters.period"
            aria-label="Období výdajů"
            class="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/40 focus:outline-none transition-colors"
          >
            <option value="ALL">Všechna období</option>
            <option value="11/2026">Listopad 2026</option>
            <option value="10/2026">Říjen 2026</option>
            <option value="09/2026">Září 2026</option>
          </select>
        </div>

        <!-- Category selector -->
        <div class="sm:col-span-2">
          <select
            v-model="expenseFilters.category"
            aria-label="Kategorie výdajů"
            class="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/40 focus:outline-none transition-colors"
          >
            <option value="ALL">Všechny kategorie</option>
            <option value="Bydlení">Bydlení a nájem</option>
            <option value="Energie">Energie a voda</option>
            <option value="Drogerie">Drogerie a úklid</option>
            <option value="Služby">Služby a internet</option>
            <option value="Údržba">Údržba a opravy</option>
            <option value="Jídlo">Společné jídlo</option>
          </select>
        </div>

        <!-- Payer selector -->
        <div class="sm:col-span-2">
          <select
            v-model="expenseFilters.payer"
            aria-label="Plátce výdajů"
            class="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/40 focus:outline-none transition-colors"
          >
            <option value="ALL">Všichni plátci</option>
            <option v-for="r in roommates" :key="r.id" :value="r.id">
              {{ r.name.split(' ')[0] }} {{ r.id === currentUser.id ? '(Vy)' : '' }}
            </option>
          </select>
        </div>

      </div>

      <!-- Bottom Row: Status pills & Reset button -->
      <div class="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
        
        <div class="flex items-center gap-2">
          <span class="text-slate-400 font-medium">Stav:</span>
          <button
            @click="expenseFilters.status = 'ALL'"
            class="px-2.5 py-1 rounded-lg transition-colors font-medium"
            :class="expenseFilters.status === 'ALL' ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30' : 'bg-slate-800 text-slate-400 hover:text-slate-200'"
          >
            Všechny transakce
          </button>
          <button
            @click="expenseFilters.status = 'UNPAID'"
            class="px-2.5 py-1 rounded-lg transition-colors font-medium"
            :class="expenseFilters.status === 'UNPAID' ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30' : 'bg-slate-800 text-slate-400 hover:text-slate-200'"
          >
            Pouze neuhrazené dluhy
          </button>
          <button
            @click="expenseFilters.status = 'PAID'"
            class="px-2.5 py-1 rounded-lg transition-colors font-medium"
            :class="expenseFilters.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30' : 'bg-slate-800 text-slate-400 hover:text-slate-200'"
          >
            Kompletně vyrovnané
          </button>
        </div>

        <button
          @click="resetExpenseFilters"
          class="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors px-2 py-1"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>Resetovat filtry</span>
        </button>

      </div>

    </div>

    <!-- Expenses Table -->
    <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
      
      <div class="overflow-x-auto border border-slate-800 rounded-xl bg-slate-850" tabindex="0" role="region" aria-label="Výpis výdajů a plateb">
        <p class="px-3 pt-2 text-xs text-slate-400 md:hidden">Tabulku lze posouvat vodorovně →</p>
        <table class="w-full min-w-[960px] text-left text-xs">
          <thead class="bg-slate-800/80 text-slate-300 border-b border-slate-700 select-none">
            <tr>
              <!-- Sortable Date -->
              <th 
                @click="toggleSort('date')"
                :aria-sort="expenseFilters.sortBy === 'date' ? (expenseFilters.sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'"
                class="py-3 px-3.5 font-semibold"
              >
                <button type="button" class="flex items-center gap-1.5 hover:text-emerald-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 rounded">
                  <span>Datum</span>
                  <span v-if="expenseFilters.sortBy === 'date'" class="text-emerald-400 font-bold">
                    {{ expenseFilters.sortOrder === 'asc' ? '▲' : '▼' }}
                  </span>
                </button>
              </th>

              <!-- Sortable Title -->
              <th 
                @click="toggleSort('title')"
                :aria-sort="expenseFilters.sortBy === 'title' ? (expenseFilters.sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'"
                class="py-3 px-3.5 font-semibold"
              >
                <button type="button" class="flex items-center gap-1.5 hover:text-emerald-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 rounded">
                  <span>Název výdaje</span>
                  <span v-if="expenseFilters.sortBy === 'title'" class="text-emerald-400 font-bold">
                    {{ expenseFilters.sortOrder === 'asc' ? '▲' : '▼' }}
                  </span>
                </button>
              </th>

              <th class="py-3 px-3.5 font-semibold">Kategorie</th>
              <th class="py-3 px-3.5 font-semibold">Plátce</th>

              <!-- Sortable Amount -->
              <th 
                @click="toggleSort('amount')"
                :aria-sort="expenseFilters.sortBy === 'amount' ? (expenseFilters.sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'"
                class="py-3 px-3.5 font-semibold text-right"
              >
                <div class="flex items-center justify-end gap-1.5">
                  <button type="button" class="flex items-center gap-1.5 hover:text-emerald-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 rounded">
                    <span>Celkem CZK</span>
                    <span v-if="expenseFilters.sortBy === 'amount'" class="text-emerald-400 font-bold">
                      {{ expenseFilters.sortOrder === 'asc' ? '▲' : '▼' }}
                    </span>
                  </button>
                </div>
              </th>

              <th class="py-3 px-3.5 font-semibold text-right">Můj podíl</th>
              <th class="py-3 px-3.5 font-semibold text-center">Doklad</th>
              <th class="py-3 px-3.5 font-semibold text-center">Stav</th>
              <th class="py-3 px-3.5 font-semibold text-right">Akce</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-800">
            <tr 
              v-for="exp in filteredExpenses" 
              :key="exp.id"
              class="hover:bg-slate-800/60 transition-colors group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              @click="openModal('EXP_DETAIL', exp)"
              tabindex="0"
              role="button"
              @keydown.enter="openModal('EXP_DETAIL', exp)"
              @keydown.space.prevent="openModal('EXP_DETAIL', exp)"
            >
              <!-- Date -->
              <td class="py-3 px-3.5 font-mono text-slate-400 whitespace-nowrap">
                {{ formatDate(exp.date) }}
              </td>

              <!-- Title & Code -->
              <td class="py-3 px-3.5">
                <div class="font-medium text-slate-100 group-hover:text-emerald-300 transition-colors">
                  {{ exp.title }}
                </div>
                <div class="text-xs font-mono text-slate-400 mt-0.5">
                  {{ exp.code }}
                </div>
              </td>

              <!-- Category -->
              <td class="py-3 px-3.5 whitespace-nowrap">
                <span class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs border border-slate-700">
                  {{ exp.category }}
                </span>
              </td>

              <!-- Payer -->
              <td class="py-3 px-3.5 whitespace-nowrap text-slate-300">
                <span :class="exp.payerId === currentUser.id ? 'font-semibold text-emerald-400' : ''">
                  {{ exp.payerName }}
                </span>
              </td>

              <!-- Total Amount -->
              <td class="py-3 px-3.5 font-mono font-bold text-slate-100 text-right whitespace-nowrap">
                {{ exp.totalAmount.toLocaleString('cs-CZ') }} CZK
              </td>

              <!-- My Share -->
              <td class="py-3 px-3.5 font-mono text-slate-300 text-right whitespace-nowrap">
                {{ getMyShareText(exp) }}
              </td>

              <!-- Receipt Badge -->
              <td class="py-3 px-3.5 text-center whitespace-nowrap">
                <div v-if="exp.receiptName" class="inline-flex flex-col items-center gap-0.5">
                  <span
                    class="px-2 py-0.5 rounded text-xs font-mono font-semibold"
                    :class="exp.receiptType === 'PDF' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'"
                    :title="exp.receiptName"
                  >
                    📎 {{ exp.receiptType || 'Scan' }}
                  </span>
                  <span class="max-w-[120px] truncate text-xs text-slate-400" :title="exp.receiptName">{{ exp.receiptName }}</span>
                </div>
                <span v-else class="text-xs text-slate-400">Bez dokladu</span>
              </td>

              <!-- Status Badge -->
              <td class="py-3 px-3.5 text-center whitespace-nowrap">
                <span 
                  class="px-2 py-0.5 rounded text-xs font-bold"
                  :class="[
                    exp.status === 'UHRAZENO' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    exp.status === 'PO_SPLATNOSTI' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  ]"
                >
                  {{ EXPENSE_STATUS_LABELS[exp.status] }}
                </span>
              </td>

              <!-- Action buttons -->
              <td class="py-3 px-3.5 text-right whitespace-nowrap" @click.stop>
                <div class="flex items-center justify-end">
                  <button
                    @click="deleteExpense(exp.id)"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Smazat výdaj"
                    aria-label="Smazat výdaj"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>

            <!-- Empty state -->
            <tr v-if="filteredExpenses.length === 0">
              <td colspan="9" class="py-10 text-center text-slate-400">
                <div class="space-y-2">
                  <p class="font-medium text-slate-300">Nenalezen žádný výdaj odpovídající zadaným filtrům.</p>
                  <button 
                    @click="resetExpenseFilters"
                    class="text-xs text-emerald-400 underline font-semibold"
                  >
                    Resetovat všechny filtry
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Summary Footer -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800">
        <div>
          Celkem záznamů v databázi: <strong class="text-slate-200">{{ expenses.length }}</strong>
        </div>
        <div>
          Zobrazeno: <strong class="text-slate-200">{{ filteredExpenses.length }}</strong>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSpolubyt } from '../composables/useSpolubyt'
import { Expense } from '../types'
import { EXPENSE_STATUS_LABELS } from '../utils/labels'

const { 
  expenses, 
  expenseFilters, 
  filteredExpenses, 
  filteredExpensesSum, 
  roommates, 
  currentUser, 
  resetExpenseFilters, 
  openModal, 
  deleteExpense, 
  exportExpensesCsv 
} = useSpolubyt()

const myFilteredShareSum = computed(() => {
  return filteredExpenses.value.reduce((sum, e) => {
    const s = e.shares.find(sh => sh.roommateId === currentUser.value.id)
    return sum + (s ? s.amount : 0)
  }, 0)
})

const toggleSort = (col: 'date' | 'amount' | 'title') => {
  if (expenseFilters.value.sortBy === col) {
    expenseFilters.value.sortOrder = expenseFilters.value.sortOrder === 'asc' ? 'desc' : 'asc'
  } else {
    expenseFilters.value.sortBy = col
    expenseFilters.value.sortOrder = 'desc'
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}. ${parts[1]}. ${parts[0].slice(2)}`
  }
  return dateStr
}

const getMyShareText = (exp: Expense) => {
  const share = exp.shares.find(s => s.roommateId === currentUser.value.id)
  if (!share) return '0 CZK'
  if (share.status === 'PLÁTCE') return 'Plátce — 0 Kč k doplacení'
  return `${Math.round(share.amount).toLocaleString('cs-CZ')} CZK`
}
</script>

