<template>
  <div class="space-y-6">
    
    <!-- Top Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-white tracking-tight">
          Vyrovnání a matice vzájemných závazků
        </h1>
        <p class="text-xs text-slate-400 mt-0.5">
          Zúčtovací období: <strong class="text-slate-200">Listopad 2026</strong> • Bankovní účet správce: <span class="font-mono text-emerald-400">{{ settings.accountNumber }}</span>
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <button
          @click="showExportToast"
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>Export přehledu (PDF)</span>
        </button>
      </div>
    </div>

    <!-- 3 KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      
      <!-- Card 1: Receivables -->
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
        <div class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
          Celkové pohledávky za bytem
        </div>
        <div class="text-2xl font-mono font-extrabold text-emerald-400">
          {{ totalReceivables.toLocaleString('cs-CZ') }} CZK
        </div>
        <div class="text-xs text-slate-400 mt-2">
          Celkem {{ debtorsCount }} otevřené platební předpisy
        </div>
      </div>

      <!-- Card 2: My Obligations -->
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
        <div class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
          Moje závazky vůči ostatním
        </div>
        <div class="text-2xl font-mono font-extrabold text-white">
          0 CZK
        </div>
        <div class="text-xs text-emerald-400 mt-2 font-medium">
          ✓ Všechny vaše závazky jsou vyrovnány
        </div>
      </div>

      <!-- Card 3: Payment Discipline -->
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
        <div class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
          Stav platební morálky
        </div>
        <div class="text-xl font-bold tracking-tight" :class="overdueDebtorsCount > 0 ? 'text-rose-400' : 'text-emerald-400'">
          {{ overdueDebtorsCount > 0 ? `${overdueDebtorsCount} z 3 členů po splatnosti` : 'Všichni členové bez prodlení' }}
        </div>
        <div class="text-xs text-slate-400 mt-2">
          Termín splatnosti nájmu: <strong>10. 11. 2026</strong>
        </div>
      </div>

    </div>

    <!-- Settlement Cards for Each Roommate -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-slate-200 uppercase tracking-wider">
          Přehled závazků jednotlivých členů domácnosti:
        </h2>
        <span class="text-xs text-slate-400">Automatický propočet dle m² a spotřeby</span>
      </div>

      <div class="space-y-3">
        <div
          v-for="s in settlements"
          :key="s.roommateId"
          class="p-5 rounded-2xl bg-slate-900 border transition-all"
          :class="[
            s.status === 'PO_SPLATNOSTI' ? 'border-rose-500/40 bg-gradient-to-r from-slate-900 to-rose-950/10' :
            s.status === 'VYROVNÁNO' ? 'border-slate-800 opacity-90' :
            'border-slate-800'
          ]"
        >
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            <!-- Roommate identity & room -->
            <div class="flex items-start gap-3.5">
              <div 
                class="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-extrabold text-white shrink-0 shadow-md"
                :class="getRoommateColor(s.roommateId)"
              >
                {{ s.roommateName.charAt(0) }}
              </div>
              
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-base font-bold text-white">{{ s.roommateName }}</h3>
                  <span 
                    class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                    :class="[
                      s.status === 'VYROVNÁNO' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      s.status === 'PO_SPLATNOSTI' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse' :
                      'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    ]"
                  >
                    {{ s.status === 'PO_SPLATNOSTI' ? 'PO SPLATNOSTI (4 DNY)' : (s.status === 'VYROVNÁNO' ? 'VYROVNÁNO - V POŘÁDKU' : 'PŘED SPLATNOSTÍ') }}
                  </span>
                </div>

                <div class="text-xs text-slate-400 mt-0.5">
                  {{ s.roomName }} • Plocha: {{ s.roomAreaM2 }} m² (podíl {{ s.areaSharePct }} %)
                </div>

                <!-- Cost Breakdown text -->
                <div v-if="s.totalDebt > 0" class="text-xs text-slate-300 mt-2 flex flex-wrap items-center gap-2 font-mono">
                  <span class="bg-slate-800 px-2 py-0.5 rounded text-[11px] border border-slate-700">Nájem: {{ s.breakdown.rent }} Kč</span>
                  <span class="bg-slate-800 px-2 py-0.5 rounded text-[11px] border border-slate-700">Energie: {{ s.breakdown.energy }} Kč</span>
                  <span v-if="s.breakdown.wifi" class="bg-slate-800 px-2 py-0.5 rounded text-[11px] border border-slate-700">WiFi: {{ s.breakdown.wifi }} Kč</span>
                  <span v-if="s.breakdown.drogerie" class="bg-slate-800 px-2 py-0.5 rounded text-[11px] border border-slate-700">Drogerie: {{ s.breakdown.drogerie }} Kč</span>
                </div>
                <div v-else class="text-xs text-emerald-400/90 mt-1">
                  Všechny pohledávky za měsíc Listopad 2026 byly kompletně vypořádány převodem na účet.
                </div>

                <!-- Upomínka Timestamp info -->
                <div v-if="s.lastReminderSent" class="text-[11px] text-amber-400/90 mt-2 flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Poslední upomínka odeslána: {{ s.lastReminderSent }}</span>
                </div>
              </div>
            </div>

            <!-- Total Debt & Action Buttons -->
            <div class="flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
              
              <div class="text-left sm:text-right">
                <span class="text-[11px] text-slate-400 block">Dlužná částka celkem:</span>
                <span 
                  class="text-2xl font-mono font-extrabold"
                  :class="s.totalDebt > 0 ? (s.status === 'PO_SPLATNOSTI' ? 'text-rose-400' : 'text-amber-400') : 'text-emerald-400'"
                >
                  {{ s.totalDebt.toLocaleString('cs-CZ') }} CZK
                </span>
              </div>

              <!-- Actions -->
              <div class="flex flex-wrap items-center gap-2">
                
                <!-- Odeslat upomínku button (prominent if overdue) -->
                <button
                  v-if="s.status === 'PO_SPLATNOSTI'"
                  @click="sendReminder(s.roommateId)"
                  class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-md shadow-rose-950/40 transition-all flex items-center gap-1.5"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span>Odeslat upomínku</span>
                </button>

                <!-- SPAYD QR Platba -->
                <button
                  v-if="s.totalDebt > 0"
                  @click="openModal('QR_MODAL', s)"
                  class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <span>Platební QR</span>
                </button>

                <!-- Označit jako zaplaceno -->
                <button
                  v-if="s.totalDebt > 0"
                  @click="openModal('CONFIRM_MODAL', s)"
                  class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40"
                >
                  Označit jako zaplaceno
                </button>

                <!-- When paid: show detail -->
                <span 
                  v-else 
                  class="px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20"
                >
                  ✓ Uhrazeno
                </span>

              </div>

            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- Debt Matrix Summary -->
    <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
      <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">
        Matice vzájemného vyrovnání správce vs. spolubydlící:
      </h3>
      <div class="border border-slate-800 rounded-xl overflow-hidden bg-slate-850">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-800/80 text-slate-400 border-b border-slate-700">
            <tr>
              <th class="py-2.5 px-3">Člen bytu</th>
              <th class="py-2.5 px-3">Předpis nájmu</th>
              <th class="py-2.5 px-3">Zálohy energie</th>
              <th class="py-2.5 px-3">Ostatní nákupy</th>
              <th class="py-2.5 px-3 text-right">K úhradě správci</th>
              <th class="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            <tr v-for="s in settlements" :key="s.roommateId">
              <td class="py-2.5 px-3 font-semibold text-slate-200">{{ s.roommateName }}</td>
              <td class="py-2.5 px-3 font-mono text-slate-300">{{ s.breakdown.rent }} CZK</td>
              <td class="py-2.5 px-3 font-mono text-slate-300">{{ s.breakdown.energy }} CZK</td>
              <td class="py-2.5 px-3 font-mono text-slate-300">{{ (s.breakdown.drogerie || 0) + (s.breakdown.wifi || 0) }} CZK</td>
              <td class="py-2.5 px-3 font-mono font-bold text-right" :class="s.totalDebt > 0 ? 'text-amber-400' : 'text-emerald-400'">
                {{ s.totalDebt.toLocaleString('cs-CZ') }} CZK
              </td>
              <td class="py-2.5 px-3 text-center">
                <span 
                  class="px-2 py-0.5 rounded text-[10px] font-bold"
                  :class="s.status === 'VYROVNÁNO' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'"
                >
                  {{ s.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { useSpolubyt } from '../composables/useSpolubyt'

const { 
  settlements, 
  settings, 
  totalReceivables, 
  debtorsCount, 
  overdueDebtorsCount, 
  openModal, 
  sendReminder, 
  showToast 
} = useSpolubyt()

const getRoommateColor = (roommateId: string) => {
  if (roommateId === 'user-jakub') return 'bg-blue-600'
  if (roommateId === 'user-eliska') return 'bg-purple-600'
  if (roommateId === 'user-martin') return 'bg-amber-600'
  return 'bg-emerald-600'
}

const showExportToast = () => {
  showToast('Generování PDF', 'Měsíční protokol vyrovnání byl vygenerován a připraven k tisku.', 'success')
}
</script>

