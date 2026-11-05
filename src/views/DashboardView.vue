<template>
  <div class="space-y-6">
    
    <!-- Top Hero / Welcome Banner -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
      <div>
        <div class="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Centrální přehled domácnosti</span>
        </div>
        <h1 class="text-2xl font-extrabold text-white tracking-tight">
          Vítej zpět, {{ currentUser.name }}
        </h1>
        <p class="text-xs text-slate-400 mt-1">
          Spravovaný byt: <strong class="text-slate-200">{{ settings.name }}</strong> ({{ settings.address }})
        </p>
      </div>

      <!-- Quick Action Buttons -->
      <div class="flex items-center gap-2.5">
        <button
          @click="openModal('EXP_ADD')"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-all hover:scale-102"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>Zadat nový výdaj</span>
        </button>

        <button
          @click="openModal('METER_ADD')"
          class="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Zapsat odečet</span>
        </button>
      </div>
    </div>

    <!-- 3 Hero KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      
      <!-- Card 1: Monthly Expenses -->
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
        <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span class="font-bold uppercase tracking-wider">Měsíční náklady (Listopad)</span>
          <span class="text-emerald-400 font-mono text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            +2.4 % m/m
          </span>
        </div>
        <div class="text-2xl font-mono font-extrabold text-white tracking-tight">
          {{ monthlyTotalExpenses.toLocaleString('cs-CZ') }} CZK
        </div>
        <div class="text-xs text-slate-400 mt-2 flex items-center justify-between">
          <span>Předchozí měsíc: {{ previousMonthTotalExpenses.toLocaleString('cs-CZ') }} CZK</span>
          <button @click="navigateTo('EXPENSES')" class="text-emerald-400 hover:underline font-medium text-[11px]">
            Výpis →
          </button>
        </div>
      </div>

      <!-- Card 2: Receivables / Debtors -->
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
        <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span class="font-bold uppercase tracking-wider">Moje pohledávky (Dluží nám)</span>
          <span 
            class="text-[11px] font-mono px-2 py-0.5 rounded-full border"
            :class="overdueDebtorsCount > 0 ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' : 'bg-amber-500/10 text-amber-300 border-amber-500/20'"
          >
            {{ debtorsCount }} dlužníci
          </span>
        </div>
        <div class="text-2xl font-mono font-extrabold text-emerald-400 tracking-tight">
          {{ totalReceivables.toLocaleString('cs-CZ') }} CZK
        </div>
        <div class="text-xs text-slate-400 mt-2 flex items-center justify-between">
          <span :class="overdueDebtorsCount > 0 ? 'text-rose-400 font-semibold' : 'text-slate-400'">
            {{ overdueDebtorsCount > 0 ? `1 člen v prodlení se splátkou` : 'Vše před termínem splatnosti' }}
          </span>
          <button @click="navigateTo('SETTLEMENT')" class="text-emerald-400 hover:underline font-medium text-[11px]">
            Vyrovnání →
          </button>
        </div>
      </div>

      <!-- Card 3: Due date to Landlord -->
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
        <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span class="font-bold uppercase tracking-wider">Nájem majiteli (Splatnost)</span>
          <span class="text-amber-400 font-mono text-[11px] bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            Termín: 10. 11.
          </span>
        </div>
        <div class="text-2xl font-extrabold text-amber-300 tracking-tight flex items-baseline gap-2">
          <span>Zbývá 5 dní</span>
          <span class="text-xs font-normal text-slate-400">(28 000 CZK)</span>
        </div>
        <div class="text-xs text-slate-400 mt-2 flex items-center justify-between">
          <span class="text-amber-400/90 font-medium">Čeká na doplacení podílů</span>
          <span class="text-[11px] text-slate-500">Účet: 123456789/0800</span>
        </div>
      </div>

    </div>

    <!-- Content Grid: Asymmetric 2:1 Split -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- Left Column (8 cols): Roommates balance & Recent Expenses -->
      <div class="lg:col-span-8 space-y-6">
        
        <!-- Roommates Balance Widget -->
        <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Aktuální bilance spolubydlících (Kdo dluží)
              </h2>
              <p class="text-xs text-slate-400">Přehled pohledávek za nájem, energie a společné nákupy</p>
            </div>
            <button
              @click="navigateTo('SETTLEMENT')"
              class="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>Celá matice</span>
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div class="space-y-2.5">
            <div
              v-for="s in settlements"
              :key="s.roommateId"
              class="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-850 border border-slate-800 hover:border-slate-700 transition-colors gap-3"
            >
              <!-- Roommate info -->
              <div class="flex items-center gap-3">
                <div 
                  class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm"
                  :class="getRoommateColor(s.roommateId)"
                >
                  {{ s.roommateName.charAt(0) }}
                </div>
                <div>
                  <div class="text-xs font-bold text-slate-100">{{ s.roommateName }}</div>
                  <div class="text-[11px] text-slate-400">{{ s.roomName }}</div>
                </div>
              </div>

              <!-- Debt and status -->
              <div class="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                <div class="text-right">
                  <div class="text-sm font-mono font-bold" :class="s.totalDebt > 0 ? 'text-amber-400' : 'text-emerald-400'">
                    {{ s.totalDebt.toLocaleString('cs-CZ') }} CZK
                  </div>
                  <div class="text-[10px]">
                    <span 
                      class="px-1.5 py-0.5 rounded font-bold uppercase"
                      :class="[
                        s.status === 'VYROVNÁNO' ? 'bg-emerald-500/20 text-emerald-300' :
                        s.status === 'PO_SPLATNOSTI' ? 'bg-rose-500/20 text-rose-300 animate-pulse' :
                        'bg-amber-500/20 text-amber-300'
                      ]"
                    >
                      {{ s.status === 'PO_SPLATNOSTI' ? 'Po splatnosti (4 dny)' : (s.status === 'VYROVNÁNO' ? 'Vyrovnáno' : 'Před splatností') }}
                    </span>
                  </div>
                </div>

                <!-- Quick actions -->
                <div class="flex items-center gap-1.5 shrink-0">
                  <button
                    v-if="s.totalDebt > 0"
                    @click="openModal('QR_MODAL', s)"
                    class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1"
                    title="Zobrazit SPAYD QR kód pro mobilní platbu"
                  >
                    <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    <span>QR</span>
                  </button>

                  <button
                    v-if="s.status === 'PO_SPLATNOSTI'"
                    @click="sendReminder(s.roommateId)"
                    class="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors"
                    title="Odeslat diskrétní upomínku dlužníkovi"
                  >
                    Upomínka
                  </button>

                  <button
                    v-if="s.totalDebt > 0"
                    @click="openModal('CONFIRM_MODAL', s)"
                    class="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-sm"
                    title="Označit platbu jako zaplacenou"
                  >
                    Zaplaceno
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Expenses Widget -->
        <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Poslední výdaje a nákupy
              </h2>
              <p class="text-xs text-slate-400">Chronologický přehled nedávných transakcí</p>
            </div>
            <button
              @click="navigateTo('EXPENSES')"
              class="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>Všechny výdaje</span>
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div class="border border-slate-800 rounded-xl overflow-hidden bg-slate-850">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-800/80 text-slate-400 border-b border-slate-700">
                <tr>
                  <th class="py-2.5 px-3">Datum</th>
                  <th class="py-2.5 px-3">Název výdaje</th>
                  <th class="py-2.5 px-3">Plátce</th>
                  <th class="py-2.5 px-3 text-right">Částka</th>
                  <th class="py-2.5 px-3 text-center">Stav</th>
                  <th class="py-2.5 px-3 text-right">Akce</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800">
                <tr 
                  v-for="exp in recentExpenses" 
                  :key="exp.id" 
                  @click="openModal('EXP_DETAIL', exp)"
                  class="hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <td class="py-2.5 px-3 font-mono text-slate-400">{{ formatDate(exp.date) }}</td>
                  <td class="py-2.5 px-3 font-medium text-slate-200">
                    {{ exp.title }}
                  </td>
                  <td class="py-2.5 px-3 text-slate-400">{{ exp.payerName }}</td>
                  <td class="py-2.5 px-3 font-mono font-bold text-slate-100 text-right">
                    {{ exp.totalAmount.toLocaleString('cs-CZ') }} CZK
                  </td>
                  <td class="py-2.5 px-3 text-center">
                    <span 
                      class="px-2 py-0.5 rounded text-[10px] font-bold"
                      :class="exp.status === 'UHRAZENO' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'"
                    >
                      {{ exp.status }}
                    </span>
                  </td>
                  <td class="py-2.5 px-3 text-right">
                    <span class="text-emerald-400 font-semibold hover:underline">Detail →</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- Right Column (4 cols): Energy status, Cart teaser, Announcements -->
      <div class="lg:col-span-4 space-y-6">
        
        <!-- Energy Quick Widget -->
        <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Energie a měřidla</span>
            </h2>
            <button
              @click="navigateTo('ENERGY')"
              class="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Detail →
            </button>
          </div>

          <!-- Teploměr záloh -->
          <div class="space-y-1.5 p-3 rounded-xl bg-slate-850 border border-slate-800">
            <div class="flex justify-between text-xs">
              <span class="text-slate-400">Čerpání ročních záloh:</span>
              <span class="font-bold text-emerald-400 font-mono">68 % (V normě)</span>
            </div>
            <!-- Progress bar -->
            <div class="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
              <div class="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style="width: 68%;"></div>
            </div>
            <div class="text-[10px] text-slate-500 flex justify-between">
              <span>0 %</span>
              <span>100 % (Zálohová hranice)</span>
            </div>
          </div>

          <!-- Latest readings summary -->
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="p-2.5 rounded-lg bg-slate-850 border border-slate-800">
              <div class="text-[10px] text-slate-400">Elektřina (kWh)</div>
              <div class="font-mono font-bold text-slate-200 mt-0.5">14 820 kWh</div>
              <div class="text-[10px] text-emerald-400">+185 za říjen</div>
            </div>
            <div class="p-2.5 rounded-lg bg-slate-850 border border-slate-800">
              <div class="text-[10px] text-slate-400">Plyn (m³)</div>
              <div class="font-mono font-bold text-slate-200 mt-0.5">3 410 m³</div>
              <div class="text-[10px] text-emerald-400">+28 za říjen</div>
            </div>
          </div>

          <button
            @click="openModal('METER_ADD')"
            class="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Zadat stav měřidla</span>
          </button>
        </div>

        <!-- Shared Cart Teaser -->
        <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Nákupní košík bytu</span>
            </h2>
            <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold">
              {{ cartTotalCount }} ks
            </span>
          </div>

          <p class="text-xs text-slate-400">
            Položky k nákupu: <strong>{{ cartTotalPrice.toLocaleString('cs-CZ') }} CZK</strong>
          </p>

          <div class="space-y-1.5 text-xs">
            <div 
              v-for="item in cartItems.slice(0, 3)" 
              :key="item.id"
              class="flex items-center justify-between p-2 rounded-lg bg-slate-850 border border-slate-800"
            >
              <span class="text-slate-300 truncate max-w-[170px]">{{ item.name }}</span>
              <span class="font-mono text-emerald-400 font-semibold">{{ item.qty }}× {{ item.unitPrice }} Kč</span>
            </div>
          </div>

          <button
            @click="navigateTo('CART')"
            class="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors text-center"
          >
            Otevřít nákupní košík →
          </button>
        </div>

        <!-- Household Announcements -->
        <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3 text-xs">
          <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Oznámení domácnosti
          </h2>
          <div class="space-y-2">
            <div class="p-2.5 rounded-lg bg-slate-850 border border-slate-800 flex items-start gap-2">
              <span class="text-emerald-400 font-bold">•</span>
              <div class="text-slate-300">
                <strong>Úklid:</strong> Eliška potvrdila úklid koupelny a kuchyňské linky dle rozpisu.
              </div>
            </div>
            <div class="p-2.5 rounded-lg bg-slate-850 border border-slate-800 flex items-start gap-2">
              <span class="text-amber-400 font-bold">•</span>
              <div class="text-slate-300">
                <strong>Revize:</strong> Pravidelná revize plynového kotle v bytě proběhne 18. 11. dopoledne.
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSpolubyt } from '../composables/useSpolubyt'

const { 
  currentUser, 
  settings, 
  monthlyTotalExpenses, 
  previousMonthTotalExpenses, 
  totalReceivables, 
  debtorsCount, 
  overdueDebtorsCount, 
  settlements, 
  expenses, 
  cartItems, 
  cartTotalCount, 
  cartTotalPrice, 
  openModal, 
  navigateTo, 
  sendReminder 
} = useSpolubyt()

const recentExpenses = computed(() => {
  return expenses.value.slice(0, 4)
})

const getRoommateColor = (roommateId: string) => {
  if (roommateId === 'user-jakub') return 'bg-blue-600'
  if (roommateId === 'user-eliska') return 'bg-purple-600'
  if (roommateId === 'user-martin') return 'bg-amber-600'
  return 'bg-emerald-600'
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}. ${parts[1]}.`
  }
  return dateStr
}
</script>

