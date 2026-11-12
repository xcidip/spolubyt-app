<template>
  <teleport to="body">
    <div 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-meter-title"
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
            <h2 id="modal-meter-title" class="text-lg font-bold text-white tracking-tight">
              {{ t('meterAdd.title', 'Zadat nový odečet měřidla energií') }}
            </h2>
            <p class="text-xs text-slate-400">
              {{ t('meterAdd.subtitle', 'Pravidelný měsíční odečet pro monitoring spotřeby a prevenci nedoplatků.') }}
            </p>
          </div>
          <button type="button"
            @click="closeModal"
            class="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            :aria-label="t('meterAdd.close', 'Zavřít')"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Form Body -->
        <form @submit.prevent="handleSubmit" class="p-6 space-y-5">
          
          <!-- Section 1: Medium selection -->
          <fieldset>
            <legend class="block text-xs font-bold text-slate-400 mb-2">
              {{ t('meterAdd.mediumLabel', '1. Zvolte měřené médium:') }}
            </legend>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <label 
                v-for="m in mediumOptions" 
                :key="m.type"
                class="flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors"
                :class="selectedType === m.type ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-200' : 'bg-slate-850 border-slate-800 text-slate-300 hover:bg-slate-800'"
              >
                <input type="radio" v-model="selectedType" :value="m.type" class="text-emerald-500" />
                <span class="font-medium">{{ t('meterTypes.' + m.type, m.label) }} ({{ m.unit }})</span>
              </label>
            </div>
          </fieldset>

          <!-- Section 2: Reference & Input -->
          <div class="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            
            <!-- Reference box -->
            <div class="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
              <span class="text-slate-400">{{ t('meterAdd.previousReading', 'Předchozí zapsaný stav:') }}</span>
              <span class="font-mono font-bold text-slate-200">
                {{ previousReading ? `${previousReading.value.toLocaleString('cs-CZ')} ${previousReading.unit}` : t('meterAdd.noRecord', 'Žádný záznam') }}
              </span>
            </div>

            <!-- New value input -->
            <div>
              <label for="meteraddmodal-field-1" class="block text-xs font-medium text-slate-300 mb-1">
                {{ t('meterAdd.currentValueLabel', 'Aktuální stav číselníku z počítadla *') }}
              </label>
              <div class="relative">
                <input id="meteraddmodal-field-1"
                  v-model.number="newValue"
                  type="number"
                  required
                  step="1"
                  class="w-full pl-3.5 pr-14 py-2.5 rounded-xl bg-slate-800 border text-slate-100 text-sm font-bold font-mono focus:ring-2 focus:ring-emerald-500/40 focus:outline-none transition-colors"
                  :class="isInputValid ? 'border-slate-700' : 'border-rose-500 bg-rose-950/20 text-rose-200'"
                />
                <span class="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">
                  {{ currentUnit }}
                </span>
              </div>
            </div>

            <!-- Calculated delta indicator -->
            <div class="flex items-center justify-between text-xs pt-1">
              <span class="text-slate-400">{{ t('meterAdd.consumptionSinceLast', 'Spotřeba od minulého měření:') }}</span>
              <span 
                class="font-mono font-bold px-2 py-0.5 rounded text-xs"
                :class="delta >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'"
              >
                {{ delta >= 0 ? `+${delta} ${currentUnit}` : `${delta} ${currentUnit} ${t('meterAdd.errorSuffix', '(Chyba!)')}` }}
              </span>
            </div>

            <!-- Validation Error Alert -->
            <div v-if="!isInputValid" class="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
              {{ t('meterAdd.validationError', 'Hodnota nesmí být nižší než předchozí stav ({value} {unit})!', { value: previousReading?.value ?? '', unit: currentUnit }) }}
            </div>

            <!-- Date -->
            <div>
              <label for="meteraddmodal-field-2" class="block text-xs font-medium text-slate-300 mb-1">
                {{ t('meterAdd.dateLabel', 'Datum provedení odečtu *') }}
              </label>
              <input id="meteraddmodal-field-2"
                v-model="date"
                :min="previousReading?.date"
                :max="DEMO_TODAY"
                type="date"
                required
                class="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
              />
            </div>

          </div>

          <!-- Section 3: Note -->
          <div>
            <label for="meteraddmodal-field-3" class="block text-xs font-medium text-slate-300 mb-1">
              {{ t('meterAdd.noteLabel', 'Poznámka k odečtu (volitelné)') }}
            </label>
            <input id="meteraddmodal-field-3"
              v-model="note"
              type="text"
              :placeholder="t('meterAdd.notePlaceholder', 'např. Běžný měsíční odečet před zahájením topné sezóny...')"
              class="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
            />
          </div>

          <!-- Action buttons -->
          <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 rounded-xl border border-slate-700 transition-colors"
            >
              {{ t('meterAdd.cancel', 'Zrušit / Storno') }}
            </button>
            <button
              type="submit"
              :disabled="!isInputValid"
              class="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none"
            >
              {{ t('meterAdd.submit', 'Uložit nový odečet') }}
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
import { ref, computed, watch } from 'vue'
import { useSpolubyt } from '../composables/useSpolubyt'
import { MeterType } from '../types'
import { t } from '../i18n'

const { latestMeters, closeModal, addMeterReading } = useSpolubyt()

const mediumOptions: { type: MeterType; label: string; unit: string }[] = [
  { type: 'ELEKTŘINA', label: 'Elektroměr', unit: 'kWh' },
  { type: 'PLYN', label: 'Plynoměr', unit: 'm³' },
  { type: 'STUDENÁ_VODA', label: 'Studená voda', unit: 'm³' },
  { type: 'TEPLÁ_VODA', label: 'Teplá voda', unit: 'm³' }
]

const selectedType = ref<MeterType>('ELEKTŘINA')
const previousReading = computed(() => latestMeters.value[selectedType.value])
const currentUnit = computed(() => selectedType.value === 'ELEKTŘINA' ? 'kWh' : 'm³')

const newValue = ref<number>(14950)
const date = ref(DEMO_TODAY)
const note = ref(t('meterAdd.noteDefault', 'Pravidelný odečet na konci měsíce'))

// Sync default new value with previous reading + estimated delta
watch(selectedType, (type) => {
  const prev = latestMeters.value[type]
  if (prev) {
    const estDelta = type === 'ELEKTŘINA' ? 150 : (type === 'PLYN' ? 25 : 5)
    newValue.value = prev.value + estDelta
  } else {
    newValue.value = 100
  }
}, { immediate: true })

const delta = computed(() => {
  if (!previousReading.value) return 0
  return (newValue.value || 0) - previousReading.value.value
})

const isInputValid = computed(() => {
  if (!Number.isFinite(newValue.value) || !date.value || date.value > DEMO_TODAY || (previousReading.value && date.value < previousReading.value.date)) return false
  if (!previousReading.value) return newValue.value >= 0
  return (newValue.value || 0) >= previousReading.value.value
})

const handleSubmit = () => {
  if (!isInputValid.value) return

  const saved = addMeterReading({
    type: selectedType.value,
    date: date.value,
    value: newValue.value,
    note: note.value
  })
  if (saved) closeModal()
}
const dialogPanel = ref<HTMLElement | null>(null)
useDialog(dialogPanel, closeModal)
</script>

