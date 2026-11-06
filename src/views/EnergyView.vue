<template>
  <div class="space-y-6">
    
    <!-- Top Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-white tracking-tight">
          Energie a odečty měřidel
        </h1>
        <p class="text-xs text-slate-400 mt-0.5">
          Zúčtovací rok: <strong class="text-slate-200">2026</strong> (zbývají 2 měsíce do ročního vyúčtování) • Další odečet: 30. 11. 2026
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <button
          @click="openModal('METER_ADD')"
          class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-all hover:scale-102"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>Zadat nový odečet</span>
        </button>
      </div>
    </div>

    <!-- 4 Cards for Physical Meters -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      <!-- Electricity -->
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
        <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span class="font-bold uppercase tracking-wider">Elektřina (kWh)</span>
          <span class="text-amber-400 font-bold">⚡</span>
        </div>
        <div class="text-2xl font-mono font-extrabold text-white">
          {{ latestMeters['ELEKTŘINA']?.value.toLocaleString('cs-CZ') || '14 820' }} kWh
        </div>
        <div class="text-xs text-emerald-400 mt-2 flex items-center justify-between font-mono">
          <span>+{{ latestMeters['ELEKTŘINA']?.delta || 185 }} kWh za měsíc</span>
          <span class="text-[10px] text-slate-500 font-sans">31. 10.</span>
        </div>
      </div>

      <!-- Gas -->
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
        <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span class="font-bold uppercase tracking-wider">Plyn (m³)</span>
          <span class="text-sky-400 font-bold">🔥</span>
        </div>
        <div class="text-2xl font-mono font-extrabold text-white">
          {{ latestMeters['PLYN']?.value.toLocaleString('cs-CZ') || '3 410' }} m³
        </div>
        <div class="text-xs text-emerald-400 mt-2 flex items-center justify-between font-mono">
          <span>+{{ latestMeters['PLYN']?.delta || 28 }} m³ za měsíc</span>
          <span class="text-[10px] text-slate-500 font-sans">31. 10.</span>
        </div>
      </div>

      <!-- Cold Water -->
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
        <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span class="font-bold uppercase tracking-wider">Studená voda (m³)</span>
          <span class="text-blue-400 font-bold">💧</span>
        </div>
        <div class="text-2xl font-mono font-extrabold text-white">
          {{ latestMeters['STUDENÁ_VODA']?.value.toLocaleString('cs-CZ') || '284' }} m³
        </div>
        <div class="text-xs text-emerald-400 mt-2 flex items-center justify-between font-mono">
          <span>+{{ latestMeters['STUDENÁ_VODA']?.delta || 6 }} m³ za měsíc</span>
          <span class="text-[10px] text-slate-500 font-sans">31. 10.</span>
        </div>
      </div>

      <!-- Hot Water -->
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
        <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span class="font-bold uppercase tracking-wider">Teplá voda (TUV)</span>
          <span class="text-rose-400 font-bold">♨</span>
        </div>
        <div class="text-2xl font-mono font-extrabold text-white">
          {{ latestMeters['TEPLÁ_VODA']?.value.toLocaleString('cs-CZ') || '142' }} m³
        </div>
        <div class="text-xs text-emerald-400 mt-2 flex items-center justify-between font-mono">
          <span>+{{ latestMeters['TEPLÁ_VODA']?.delta || 4 }} m³ za měsíc</span>
          <span class="text-[10px] text-slate-500 font-sans">31. 10.</span>
        </div>
      </div>

    </div>

    <!-- Chart & Prediction Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- Interactive SVG Chart (8 cols) -->
      <div class="lg:col-span-8 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
        
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
          <div>
            <h2 class="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Monitoring spotřeby v čase (Měsíční trendy)
            </h2>
            <p class="text-xs text-slate-400">
              Porovnání reálné spotřeby vůči fixní hranici měsíčních záloh
              <span class="text-slate-300 font-mono">({{ currentConfig.allowance }} {{ currentConfig.unit }}/měs.)</span>
            </p>
          </div>

          <!-- Medium selector pills -->
          <div class="flex items-center gap-1 bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              v-for="med in ['Elektřina', 'Plyn', 'Voda']"
              :key="med"
              @click="activeChartMedium = med"
              class="px-2.5 py-1 rounded-lg transition-colors"
              :class="activeChartMedium === med ? 'bg-slate-900 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'"
            >
              {{ med }}
            </button>
          </div>
        </div>

        <!-- SVG Chart container -->
        <div class="h-64 w-full flex flex-col justify-end pt-4 pb-2">
          
          <div class="relative flex-1 flex items-end justify-between gap-4 px-4 border-b border-l border-slate-700">
            
            <!-- Reference Allowance line (Zálohová hranice) -->
            <div 
              class="absolute left-0 right-0 border-b border-dashed border-amber-400/80 flex items-center justify-end pr-2 z-20 transition-opacity duration-200 pointer-events-auto cursor-default before:content-[''] before:absolute before:-top-2.5 before:-bottom-2.5 before:left-0 before:right-0"
              :class="hasValueAboveAllowance ? 'opacity-40 hover:opacity-100' : 'opacity-100'"
              :style="{ bottom: `${(currentConfig.allowance / currentConfig.maxScale) * 100}%` }"
            >
              <span class="text-[10px] font-mono font-bold text-amber-300 bg-slate-900/80 px-2 py-0.5 rounded border border-amber-400/50 shadow-md backdrop-blur-sm whitespace-nowrap">
                Zálohová hranice: {{ currentConfig.allowance }} {{ currentConfig.unit }}
              </span>
            </div>

            <!-- Bars -->
            <div 
              v-for="bar in chartData" 
              :key="bar.month"
              class="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
            >
              <!-- Bar value tooltip on hover -->
              <span class="text-[10px] font-mono text-slate-300 mb-1 group-hover:text-emerald-400 font-bold transition-all group-hover:scale-110 group-hover:z-30 relative">
                {{ bar.value }}
              </span>

              <!-- Visual Bar -->
              <div 
                class="w-full max-w-[42px] rounded-t-lg transition-all duration-300 group-hover:opacity-90 relative"
                :class="bar.value > currentConfig.allowance ? 'bg-gradient-to-t from-amber-600 to-amber-400' : 'bg-gradient-to-t from-emerald-600 to-teal-400'"
                :style="{ height: `${(bar.value / currentConfig.maxScale) * 100}%` }"
              ></div>
            </div>

          </div>

          <!-- X Axis Labels -->
          <div class="flex items-center justify-between gap-4 px-4 pt-2 text-[11px] font-mono text-slate-400">
            <span v-for="bar in chartData" :key="bar.month" class="flex-1 text-center">
              {{ bar.month }}
            </span>
          </div>

        </div>

        <div class="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
          <div class="flex items-center gap-3">
            <span class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded bg-emerald-500"></span>
              <span>Pod zálohovou hranicí</span>
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded bg-amber-500"></span>
              <span>Nad zálohovou hranicí</span>
            </span>
          </div>
          <span class="font-mono text-[11px] text-slate-400">
            Záloha: <strong class="text-amber-300 font-semibold">{{ currentConfig.allowance }} {{ currentConfig.unit }}</strong> • Jednotky: {{ currentConfig.unit }}
          </span>
        </div>

      </div>

      <!-- Prediction & Financial Safety Widget (4 cols) -->
      <div class="lg:col-span-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4 flex flex-col justify-between">
        
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Predikce ročního vyúčtování
            </h2>
            <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              Nízké riziko
            </span>
          </div>

          <p class="text-xs text-slate-400 leading-relaxed">
            Na základě dosavadního vývoje spotřeby v roce 2026 kryjí nastavené měsíční zálohy (8 600 Kč/měsíc) reálnou spotřebu domácnosti.
          </p>

          <!-- Expected Outcome Card -->
          <div class="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-2">
            <div class="text-[11px] text-slate-400">Očekávaný stav k 31. 12. 2026:</div>
            <div class="text-xl font-mono font-extrabold text-emerald-400">
              PŘEPLATEK cca +1 200 CZK
            </div>
            <div class="text-[11px] text-slate-400">
              Předpokládaná vratka na účet správce bytu.
            </div>
          </div>

          <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 text-slate-300">
            <div class="flex justify-between">
              <span class="text-slate-400">Fixní měsíční zálohy:</span>
              <span class="font-mono font-semibold">8 600 CZK</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Zúčtovací perioda:</span>
              <span class="font-mono">01.01. – 31.12.2026</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Dodavatel elektřiny:</span>
              <span>ČEZ Prodej a.s.</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Dodavatel plynu:</span>
              <span>innogy Energie</span>
            </div>
          </div>
        </div>

        <button
          @click="openModal('METER_ADD')"
          class="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold border border-slate-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Zadat nový odečet měřidla</span>
        </button>

      </div>

    </div>

    <!-- Meter Readings History Table -->
    <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-slate-100 uppercase tracking-wider">
          Historie zaznamenaných odečtů měřidel
        </h2>
        <span class="text-xs text-slate-400">Archiv fyzických stavů počítadel</span>
      </div>

      <div class="border border-slate-800 rounded-xl overflow-hidden bg-slate-850">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-800/80 text-slate-300 border-b border-slate-700">
            <tr>
              <th class="py-2.5 px-3">Datum odečtu</th>
              <th class="py-2.5 px-3">Médium</th>
              <th class="py-2.5 px-3">Stav počítadla</th>
              <th class="py-2.5 px-3">Rozdíl / Spotřeba</th>
              <th class="py-2.5 px-3">Zapsal</th>
              <th class="py-2.5 px-3">Poznámka</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            <tr v-for="m in meters" :key="m.id" class="hover:bg-slate-800/60 transition-colors">
              <td class="py-2.5 px-3 font-mono text-slate-400">{{ formatDate(m.date) }}</td>
              <td class="py-2.5 px-3 font-semibold text-slate-200">{{ m.type }}</td>
              <td class="py-2.5 px-3 font-mono font-bold text-slate-100">
                {{ m.value.toLocaleString('cs-CZ') }} {{ m.unit }}
              </td>
              <td class="py-2.5 px-3 font-mono text-emerald-400 font-bold">
                +{{ m.delta }} {{ m.unit }}
              </td>
              <td class="py-2.5 px-3 text-slate-300">{{ m.recordedBy }}</td>
              <td class="py-2.5 px-3 text-slate-400 text-[11px]">{{ m.note || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSpolubyt } from '../composables/useSpolubyt'
import { ENERGY_MONTHLY_HISTORY } from '../data/mockData'

const { meters, latestMeters, openModal } = useSpolubyt()

const activeChartMedium = ref('Elektřina')

interface MediumConfig {
  unit: string
  allowance: number
  maxScale: number
  data: { month: string; value: number }[]
}

const MEDIUM_CONFIGS: Record<string, MediumConfig> = {
  'Elektřina': {
    unit: 'kWh',
    allowance: 160,
    maxScale: 220,
    data: ENERGY_MONTHLY_HISTORY.map(item => ({ month: item.month, value: item.value })),
  },
  'Plyn': {
    unit: 'm³',
    allowance: 22,
    maxScale: 32,
    data: [
      { month: '05/26', value: 20 },
      { month: '06/26', value: 18 },
      { month: '07/26', value: 14 },
      { month: '08/26', value: 16 },
      { month: '09/26', value: 24 },
      { month: '10/26', value: 28 },
    ],
  },
  'Voda': {
    unit: 'm³',
    allowance: 9,
    maxScale: 12,
    data: [
      { month: '05/26', value: 8 },
      { month: '06/26', value: 9 },
      { month: '07/26', value: 7 },
      { month: '08/26', value: 8 },
      { month: '09/26', value: 9 },
      { month: '10/26', value: 10 },
    ],
  },
}

const currentConfig = computed(() => {
  return MEDIUM_CONFIGS[activeChartMedium.value] || MEDIUM_CONFIGS['Elektřina']
})

const chartData = computed(() => {
  return currentConfig.value.data
})

const hasValueAboveAllowance = computed(() => {
  return chartData.value.some(bar => bar.value > currentConfig.value.allowance)
})

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}. ${parts[1]}. ${parts[0]}`
  }
  return dateStr
}
</script>

