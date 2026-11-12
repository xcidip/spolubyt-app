<template>
  <div class="space-y-6">
    
    <!-- Top Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-white tracking-tight">
          Energie a odečty měřidel
        </h1>
        <p class="text-xs text-slate-400 mt-0.5">
          Zúčtovací rok: <strong class="text-slate-200">2026</strong> • Poslední odečet: <strong class="text-slate-200">{{ lastReadingDate }}</strong>
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <button
          @click="openModal('METER_ADD')"
          class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-all hover:scale-105"
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
      <div
        v-for="meter in meterCards"
        :key="meter.type"
        class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden"
      >
        <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span class="font-bold">{{ meter.label }} ({{ meter.unit }})</span>
          <span :class="meter.color" class="font-bold">{{ meter.icon }}</span>
        </div>
        <div class="text-2xl font-mono font-extrabold text-white">
          {{ latestMeters[meter.type]?.value.toLocaleString('cs-CZ') || '—' }} {{ meter.unit }}
        </div>
        <div class="text-xs text-emerald-400 mt-2 flex items-center justify-between font-mono">
          <span>{{ latestMeters[meter.type] ? `+${latestMeters[meter.type].delta} ${meter.unit} za měsíc` : 'Bez odečtu' }}</span>
          <span class="text-xs text-slate-400 font-sans">{{ latestMeters[meter.type] ? formatDate(latestMeters[meter.type].date) : '—' }}</span>
        </div>
      </div>
    </div>

    <!-- Chart & Prediction Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- Interactive SVG Chart (8 cols) -->
      <div class="lg:col-span-8 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
        
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
          <div>
            <h2 class="text-sm font-bold text-slate-100">
              Monitoring spotřeby v čase (měsíční trendy)
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

        <!-- Accessible chart with visible scale and table fallback -->
        <div class="h-64 w-full flex flex-col justify-end pt-4 pb-2" role="img" :aria-label="chartAriaLabel">
          <div class="flex justify-between px-4 text-xs text-slate-400 pb-1">
            <span>0</span>
            <span>{{ Math.round(currentConfig.maxScale / 2) }}</span>
            <span>{{ currentConfig.maxScale }} {{ currentConfig.unit }}</span>
          </div>

          <div class="relative flex-1 flex items-end justify-between gap-4 px-4 border-b border-l border-slate-700">
            <div class="absolute inset-0 flex flex-col justify-between pointer-events-none" aria-hidden="true">
              <div class="border-t border-slate-700/40"></div>
              <div class="border-t border-slate-700/40"></div>
              <div class="border-t border-slate-700/40"></div>
              <div class="border-t border-slate-700/40"></div>
              <div class="border-t border-slate-700/40"></div>
            </div>

            <!-- Reference Allowance line (Zálohová hranice) -->
            <div 
              class="absolute left-0 right-0 border-b border-dashed border-amber-400/80 flex items-center justify-end pr-2 z-20 transition-opacity duration-200 pointer-events-auto cursor-default before:content-[''] before:absolute before:-top-2.5 before:-bottom-2.5 before:left-0 before:right-0"
              :class="hasValueAboveAllowance ? 'opacity-40 hover:opacity-100' : 'opacity-100'"
              :style="{ bottom: `${(currentConfig.allowance / currentConfig.maxScale) * 100}%` }"
            >
              <span class="text-xs font-mono font-bold text-amber-300 bg-slate-900/80 px-2 py-0.5 rounded border border-amber-400/50 shadow-md backdrop-blur-sm whitespace-nowrap">
                Zálohová hranice: {{ currentConfig.allowance }} {{ currentConfig.unit }}
              </span>
            </div>

            <!-- Bars -->
            <div 
              v-for="bar in chartData" 
              :key="bar.month"
              class="flex-1 flex flex-col items-center h-full justify-end relative"
              :title="`${bar.month}: ${bar.value} ${currentConfig.unit}`"
              aria-hidden="true"
            >
              <span class="text-xs font-mono text-slate-300 mb-1 font-bold relative">
                {{ bar.value }}
              </span>

              <div 
                class="w-full max-w-[42px] rounded-t-lg transition-all duration-300 relative"
                :class="bar.value > currentConfig.allowance ? 'bg-gradient-to-t from-amber-600 to-amber-400' : 'bg-gradient-to-t from-emerald-600 to-teal-400'"
                :style="{ height: `${(bar.value / currentConfig.maxScale) * 100}%` }"
              ></div>
            </div>

          </div>

          <!-- X Axis Labels -->
          <div class="flex items-center justify-between gap-4 px-4 pt-2 text-xs font-mono text-slate-400">
            <span v-for="bar in chartData" :key="bar.month" class="flex-1 text-center">
              {{ bar.month }}
            </span>
          </div>

          <table class="sr-only">
            <caption>Měsíční spotřeba – {{ activeChartMedium }} ({{ currentConfig.unit }})</caption>
            <thead>
              <tr><th>Měsíc</th><th>Spotřeba</th><th>Zálohová hranice</th></tr>
            </thead>
            <tbody>
              <tr v-for="bar in chartData" :key="bar.month">
                <td>{{ bar.month }}</td>
                <td>{{ bar.value }} {{ currentConfig.unit }}</td>
                <td>{{ currentConfig.allowance }} {{ currentConfig.unit }}</td>
              </tr>
            </tbody>
          </table>
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
          <span class="font-mono text-xs text-slate-400">
            Záloha: <strong class="text-amber-300 font-semibold">{{ currentConfig.allowance }} {{ currentConfig.unit }}</strong> • Jednotky: {{ currentConfig.unit }}
          </span>
        </div>

      </div>

      <!-- Prediction & Financial Safety Widget (4 cols) -->
      <div class="lg:col-span-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4 flex flex-col justify-between">
        
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold text-slate-100">
              Predikce ročního vyúčtování
            </h2>
            <span 
              class="text-xs px-2 py-0.5 rounded-full font-bold border"
              :class="[
                annualEnergyPrediction.riskLevel === 'Nízké riziko'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : annualEnergyPrediction.riskLevel === 'Mírné překročení'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              ]"
            >
              {{ annualEnergyPrediction.riskLevel }}
            </span>
          </div>

          <p class="text-xs text-slate-400 leading-relaxed">
            {{ annualEnergyPrediction.isSurplus 
                ? `Na základě dosavadního vývoje spotřeby v roce 2026 kryjí nastavené měsíční zálohy (${Math.round(annualEnergyPrediction.annualAdvances / 12).toLocaleString('cs-CZ')} CZK/měsíc) reálnou spotřebu domácnosti.`
                : `Pozor: Aktuální predikce indikuje překročení záloh (${Math.round(annualEnergyPrediction.annualAdvances / 12).toLocaleString('cs-CZ')} CZK/měsíc). Zvažte navýšení záloh pro topnou sezónu.`
            }}
          </p>

          <!-- Expected Outcome Card -->
          <div class="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-2">
            <div class="text-xs text-slate-400">Očekávaný stav k 31. 12. 2026:</div>
            <div 
              class="text-xl font-mono font-extrabold"
              :class="annualEnergyPrediction.isSurplus ? 'text-emerald-400' : 'text-rose-400'"
            >
              {{ annualEnergyPrediction.isSurplus ? 'ODHADOVANÝ PŘEPLATEK' : 'ODHADOVANÝ NEDOPLATEK' }} {{ annualEnergyPrediction.formattedDelta }}
            </div>
            <div class="text-xs text-slate-400">
              {{ annualEnergyPrediction.isSurplus ? 'Předpokládaná vratka na účet správce bytu.' : 'Předpokládaný nedoplatek k rozpočítání mezi spolubydlící.' }}
            </div>
          </div>

          <!-- Drawdown Progress Bar -->
          <div class="space-y-1.5 pt-1">
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-400 font-medium">Čerpání rozpočtu záloh:</span>
              <span class="font-mono font-bold" :class="annualEnergyPrediction.isSurplus ? 'text-emerald-400' : 'text-amber-400'">
                {{ annualEnergyPrediction.drawdownPct }} %
              </span>
            </div>
            <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700/60 p-0.5">
              <div 
                class="h-full rounded-full transition-all duration-500"
                :class="annualEnergyPrediction.drawdownPct > 100 ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'"
                :style="{ width: `${Math.min(annualEnergyPrediction.drawdownPct, 100)}%` }"
              ></div>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 text-slate-300">
            <div class="flex justify-between">
              <span class="text-slate-400">Fixní roční zálohy (12 měsíců):</span>
              <span class="font-mono font-semibold">{{ annualEnergyPrediction.annualAdvances.toLocaleString('cs-CZ') }} CZK</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Projektované roční náklady:</span>
              <span class="font-mono">{{ annualEnergyPrediction.projectedAnnualCost.toLocaleString('cs-CZ') }} CZK</span>
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
        <h2 class="text-sm font-bold text-slate-100">
          Historie zaznamenaných odečtů měřidel
        </h2>
        <span class="text-xs text-slate-400">Archiv fyzických stavů počítadel</span>
      </div>

      <div class="border border-slate-800 rounded-xl overflow-x-auto bg-slate-850" tabindex="0" role="region" aria-label="Historie odečtů měřidel">
        <p class="px-3 pt-2 text-xs text-slate-400 md:hidden">Tabulku lze posouvat vodorovně →</p>
        <table class="w-full min-w-[760px] text-left text-xs">
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
              <td class="py-2.5 px-3 font-semibold text-slate-200">{{ METER_TYPE_LABELS[m.type] }}</td>
              <td class="py-2.5 px-3 font-mono font-bold text-slate-100">
                {{ m.value.toLocaleString('cs-CZ') }} {{ m.unit }}
              </td>
              <td class="py-2.5 px-3 font-mono text-emerald-400 font-bold">
                +{{ m.delta }} {{ m.unit }}
              </td>
              <td class="py-2.5 px-3 text-slate-300">{{ m.recordedBy }}</td>
              <td class="py-2.5 px-3 text-slate-400 text-xs">{{ m.note || '—' }}</td>
            </tr>
            <tr v-if="meters.length === 0">
              <td colspan="6" class="py-10 text-center text-slate-400">
                <div class="space-y-2">
                  <p class="font-medium text-slate-300">Zatím nejsou zaznamenány žádné odečty.</p>
                  <button @click="openModal('METER_ADD')" class="text-xs text-emerald-400 underline font-semibold">Zadat první odečet</button>
                </div>
              </td>
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
import { METER_TYPE_LABELS } from '../utils/labels'

const { meters, latestMeters, openModal, annualEnergyPrediction } = useSpolubyt()

const activeChartMedium = ref('Elektřina')

const meterCards = computed(() => [
  { type: 'ELEKTŘINA' as const, label: 'Elektřina', unit: 'kWh', icon: '⚡', color: 'text-amber-400' },
  { type: 'PLYN' as const, label: 'Plyn', unit: 'm³', icon: '🔥', color: 'text-sky-400' },
  { type: 'STUDENÁ_VODA' as const, label: 'Studená voda', unit: 'm³', icon: '💧', color: 'text-blue-400' },
  { type: 'TEPLÁ_VODA' as const, label: 'Teplá voda (TUV)', unit: 'm³', icon: '♨', color: 'text-rose-400' }
])

const lastReadingDate = computed(() => {
  const latest = meters.value.reduce((latestDate, meter) => {
    if (!latestDate) return meter.date
    return new Date(meter.date) > new Date(latestDate) ? meter.date : latestDate
  }, '')
  return latest ? formatDate(latest) : '—'
})

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

const chartAriaLabel = computed(() => {
  const values = chartData.value
    .map(bar => `${bar.month}: ${bar.value} ${currentConfig.value.unit}`)
    .join(', ')
  return `Měsíční spotřeba ${activeChartMedium.value} v ${currentConfig.value.unit}. Zálohová hranice ${currentConfig.value.allowance} ${currentConfig.value.unit}. Hodnoty: ${values}.`
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

