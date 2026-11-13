<template>
  <teleport to="body">
    <div 
      class="max-sm:[&_input:not([type=checkbox]):not([type=radio])]:text-base max-sm:[&_select]:text-base max-sm:[&_textarea]:text-base fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-qr-title"
      @keydown.esc="closeModal"
      @click.self="closeModal"
    >
      <div 
        class="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain my-6 text-slate-100"
        ref="dialogPanel"
        tabindex="-1"
        @click.stop
      >
        <!-- Modal Header -->
        <div class="flex items-start justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div>
            <h2 id="modal-qr-title" class="text-lg font-bold text-white tracking-tight">
              {{ t('qr.title', 'Platební předpis & SPAYD QR platba') }}
            </h2>
            <p class="text-xs text-slate-400">
              {{ t('qr.recipient', 'Příjemce:') }} {{ settings.accountNumber }} • {{ t('qr.payer', 'Plátce:') }} <span class="text-emerald-400 font-semibold">{{ settlement.roommateName }} {{ settlement.roommateId === currentUser.id ? t('qr.you', '(Vy)') : '' }}</span>
            </p>
          </div>
          <button type="button"
            @click="closeModal"
            class="shrink-0 min-h-11 min-w-11 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            :aria-label="t('qr.close', 'Zavřít')"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
          
          <!-- Left Column (5 cols): Rendered SPAYD QR Code -->
          <div class="sm:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
            
            <div class="bg-white p-3 rounded-xl shadow-lg border border-slate-300 max-w-full">
              <canvas
                ref="qrCanvas"
                class="block w-44 h-auto aspect-square max-w-full rounded"
                role="img"
                :aria-label="t('qr.qrAriaLabel', 'SPAYD QR kód pro platbu')"
              ></canvas>
            </div>

            <div class="mt-3 space-y-1">
              <div class="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-200">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{{ t('qr.standardSpayd', 'Standard SPAYD (ČR)') }}</span>
              </div>
              <p class="text-xs text-slate-400 max-w-[200px]">
                {{ t('qr.scanHint', 'Naskenujte v aplikaci mobilního bankovnictví (ČS, Air Bank, KB, Fio, ČSOB...)') }}
              </p>
            </div>
          </div>

          <!-- Right Column (7 cols): Structured bank details with copy buttons -->
          <div class="sm:col-span-7 space-y-2.5">
            
            <!-- Amount Highlight -->
            <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div>
                <span class="text-xs text-emerald-400/80 font-medium block">{{ t('qr.amountDue', 'Částka k úhradě:') }}</span>
                <span class="text-xl font-mono font-extrabold text-emerald-300">
                  {{ settlement.totalDebt.toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} CZK
                </span>
              </div>
              <button type="button"
                @click="copyText(settlement.totalDebt.toFixed(2), t('qr.amountDueCopy', 'Částka k úhradě'))"
                class="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors flex items-center gap-1"
              >
                {{ t('qr.copy', 'Kopírovat') }}
              </button>
            </div>

            <!-- Account Number -->
            <div class="p-2.5 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span class="text-slate-400 text-xs block">{{ t('qr.accountNumber', 'Číslo účtu příjemce:') }}</span>
                <span class="font-mono font-bold text-slate-200">{{ settings.accountNumber }}</span>
              </div>
              <button type="button"
                @click="copyText(settings.accountNumber, t('qr.accountNumberCopy', 'Číslo účtu'))"
                class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition-colors text-xs"
              >
                {{ t('qr.copy', 'Kopírovat') }}
              </button>
            </div>

            <!-- IBAN -->
            <div class="p-2.5 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span class="text-slate-400 text-xs block">IBAN:</span>
                <span class="font-mono text-slate-200">{{ settings.iban }}</span>
              </div>
              <button type="button"
                @click="copyText(settings.iban, 'IBAN')"
                class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition-colors text-xs"
              >
                {{ t('qr.copy', 'Kopírovat') }}
              </button>
            </div>

            <!-- Variable Symbol -->
            <div class="p-2.5 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span class="text-slate-400 text-xs block">{{ t('qr.variableSymbol', 'Variabilní symbol:') }}</span>
                <span class="font-mono font-bold text-slate-200">{{ variableSymbol }}</span>
              </div>
              <button type="button"
                @click="copyText(variableSymbol, t('qr.variableSymbolCopy', 'Variabilní symbol'))"
                class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition-colors text-xs"
              >
                {{ t('qr.copy', 'Kopírovat') }}
              </button>
            </div>

            <!-- Message for recipient -->
            <div class="p-2.5 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-between text-xs">
              <div class="min-w-0 pr-2">
                <span class="text-slate-400 text-xs block">{{ t('qr.paymentMessageLabel', 'Zpráva pro příjemce:') }}</span>
                <span class="font-mono text-slate-200 truncate block">{{ paymentMessage }}</span>
              </div>
              <button type="button"
                @click="copyText(paymentMessage, t('qr.paymentMessageCopy', 'Zpráva pro příjemce'))"
                class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition-colors text-xs shrink-0"
              >
                {{ t('qr.copy', 'Kopírovat') }}
              </button>
            </div>

            <!-- Due Date info -->
            <div class="text-xs text-slate-400 flex items-center justify-between px-1">
              <span>{{ t('qr.dueDate', 'Termín splatnosti:') }}</span>
              <span class="font-bold text-slate-200">{{ dueDateLabel }}</span>
            </div>

          </div>

        </div>

        <!-- Modal Footer -->
        <div class="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-slate-800 bg-slate-850">
          <button
            type="button"
            @click="copyAll"
            class="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 rounded-xl border border-slate-700 transition-colors"
          >
            {{ t('qr.copyAll', 'Kopírovat všechny údaje') }}
          </button>
          
          <div class="flex items-center gap-3">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md focus:ring-2 focus:ring-emerald-400 focus:outline-none"
            >
              {{ t('qr.done', 'Hotovo / Zavřít') }}
            </button>
          </div>
        </div>

      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { formatDateCz } from '../utils/format'
import { useDialog } from '../composables/useDialog'
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { buildSpayd } from '../utils/spayd'
import QRCode from 'qrcode'
import { useSpolubyt } from '../composables/useSpolubyt'
import { t } from '../i18n'

const { selectedSettlement, settings, currentUser, closeModal, showToast } = useSpolubyt()

const settlement = computed(() => selectedSettlement.value!)
const qrCanvas = ref<HTMLCanvasElement | null>(null)

const variableSymbol = '20261101'
const paymentMessage = computed(() => t('qr.paymentMessageText', 'Spolubyt: Najem 11/2026 - {name}', { name: settlement.value?.roommateName || '' }))

const formatDate = (dateStr: string): string => formatDateCz(dateStr, 'full')

const dueDateLabel = computed(() => formatDate(settlement.value?.dueDate || ''))

const spaydString = computed(() => settlement.value
  ? buildSpayd(settings.value.iban, settlement.value.totalDebt, settlement.value.roommateName, variableSymbol) : '')

const renderQrCode = async () => {
  await nextTick()
  const canvas = qrCanvas.value
  if (!canvas || !spaydString.value) return

  try {
    // qrcode writes inline width/height styles on every render; clear them so the
    // Tailwind classes (w-44, max-w-full) stay in control of the displayed size.
    canvas.style.removeProperty('width')
    canvas.style.removeProperty('height')

    // Render the pixel buffer at display size × device pixel ratio: crisp on retina
    // displays without forcing a fixed CSS size that can overflow the modal column.
    const displaySize = canvas.clientWidth || 176
    const dpr = Math.min(window.devicePixelRatio || 1, 3)

    await QRCode.toCanvas(canvas, spaydString.value, {
      width: Math.round(displaySize * dpr),
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })

    // The library sets style.width/height to the buffer size (e.g. 352px), which
    // would override w-44 and blow out the layout — strip them again.
    canvas.style.removeProperty('width')
    canvas.style.removeProperty('height')
  } catch (err) {
    console.error('Failed to generate SPAYD QR', err)
  }
}

watch(spaydString, renderQrCode)

onMounted(() => {
  renderQrCode()
  window.addEventListener('resize', renderQrCode)
})

onUnmounted(() => {
  window.removeEventListener('resize', renderQrCode)
})

const copyText = async (text: string, label: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text)
    showToast(t('qr.copiedTitle', 'Zkopírováno'), t('qr.copiedResult', '{label}: zkopírováno do schránky.', { label }), 'info', 2500)
  } catch {
    showToast(t('qr.copyFailedTitle', 'Kopírování se nezdařilo'), t('qr.copyFailedMessage', 'Vyberte a zkopírujte platební údaje ručně.'), 'error')
  }
}

const copyAll = (): void => {
  void copyText(t('qr.allPaymentDetails', 'Účet: {account}\nIBAN: {iban}\nČástka: {amount} Kč\nVS: {symbol}\nZpráva: {message}', { account: settings.value.accountNumber, iban: settings.value.iban, amount: settlement.value.totalDebt.toLocaleString('cs-CZ'), symbol: variableSymbol, message: paymentMessage.value }), t('qr.paymentDetails', 'Platební údaje'))
}
const dialogPanel = ref<HTMLElement | null>(null)
useDialog(dialogPanel, closeModal)
</script>

