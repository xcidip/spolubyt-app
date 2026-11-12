<template>
  <div class="h-screen h-dvh bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-emerald-500/30 selection:text-emerald-300 overflow-hidden print:h-auto print:overflow-visible">
    
    <div v-if="storageWriteFailed || storageRecovered || storageConflict" role="alert" class="print:hidden p-3 bg-amber-950 text-amber-200 text-sm">
      {{ storageConflict ? t('storage.conflict', 'Data změnila jiná záložka. Před dalšími úpravami obnovte tuto stránku.') : storageWriteFailed ? t('storage.writeFailed', 'Změny se nepodařilo uložit. Zůstanou pouze do zavření stránky.') : t('storage.recovered', 'Uložená data byla poškozená. Byl obnoven výchozí stav prototypu.') }}
    </div>
    <!-- Top System Bar -->
    <Header class="shrink-0 print:hidden" />

    <!-- Main Layout: Left Sidebar + Central Work Area -->
    <div class="flex-1 flex overflow-hidden min-h-0 print:block print:overflow-visible">
      
      <!-- Permanent Left Navigation -->
      <Sidebar class="hidden md:flex shrink-0 h-full print:hidden" />

      <!-- Central Content Area -->
      <main ref="mainRef" class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-h-0 print:overflow-visible print:max-w-none print:p-0 print:bg-white print:text-black print:[&_*]:!text-black print:[&_*]:!bg-white print:[&_*]:!bg-none print:[&_*]:!shadow-none print:[&_*]:!ring-0 print:[&_*]:!border-slate-300 print:[&_button]:hidden print:[&_table]:!min-w-0 print:[&_table]:!table-fixed print:[&_th]:!p-1 print:[&_td]:!p-1 print:[&_th]:!whitespace-normal print:[&_td]:!whitespace-normal print:[&_th]:!break-words print:[&_td]:!break-words">
        
        <!-- Mobile Bottom Nav -->
        <nav class="md:hidden print:hidden flex items-center gap-1 overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl p-2 mb-4 text-xs" :aria-label="t('nav.main', 'Hlavní navigace')">
          <button
            v-for="item in mobileNavItems"
            :key="item.id"
            @click="navigateTo(item.id)"
            class="flex flex-col items-center justify-center min-w-[64px] px-2 py-1.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            :class="currentPage === item.id ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400'"
            :aria-current="currentPage === item.id ? 'page' : undefined"
          >
            <NavIcon :page="item.id" class="w-4 h-4 mb-0.5" />
            <span class="text-xs leading-tight">{{ t(item.labelKey, item.label) }}</span>
          </button>
        </nav>

        <!-- Dynamic Views -->
        <transition 
          name="fade" 
          mode="out-in"
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <component :is="activeViewComponent" />
        </transition>

      </main>

    </div>

    <!-- Modals Layer -->
    <ExpenseAddModal v-if="activeModal === 'EXP_ADD'" />
    <ExpenseDetailModal v-if="activeModal === 'EXP_DETAIL' && selectedExpense" />
    <QrPaymentModal v-if="activeModal === 'QR_MODAL' && selectedSettlement" />
    <ConfirmPaymentModal v-if="activeModal === 'CONFIRM_MODAL' && selectedSettlement" />
    <MeterAddModal v-if="activeModal === 'METER_ADD'" />

    <!-- Global Feedback Dialogs -->
    <ConfirmDialog />
    <div class="print:hidden"><ToastContainer /></div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import NavIcon from './components/NavIcon.vue'
import { NAV_ITEMS } from './utils/labels'
import { useSpolubyt } from './composables/useSpolubyt'
import { t } from './i18n'

// Components
import Header from './components/Header.vue'
import Sidebar from './components/Sidebar.vue'
import ToastContainer from './components/ToastContainer.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'

// Modals
import ExpenseAddModal from './components/ExpenseAddModal.vue'
import ExpenseDetailModal from './components/ExpenseDetailModal.vue'
import QrPaymentModal from './components/QrPaymentModal.vue'
import ConfirmPaymentModal from './components/ConfirmPaymentModal.vue'
import MeterAddModal from './components/MeterAddModal.vue'

// Views
import DashboardView from './views/DashboardView.vue'
import ExpensesView from './views/ExpensesView.vue'
import SettlementView from './views/SettlementView.vue'
import EnergyView from './views/EnergyView.vue'
import CartView from './views/CartView.vue'
import CleaningView from './views/CleaningView.vue'
import SettingsView from './views/SettingsView.vue'

const { 
  storageWriteFailed,
  storageRecovered,
  storageConflict,
  currentPage, 
  activeModal, 
  selectedExpense, 
  selectedSettlement, 
  navigateTo 
} = useSpolubyt()

const mainRef = ref<HTMLElement | null>(null)
watch(currentPage, () => mainRef.value?.scrollTo({ top: 0 }), { flush: 'post' })

const activeViewComponent = computed(() => {
  switch (currentPage.value) {
    case 'DASH': return DashboardView
    case 'EXPENSES': return ExpensesView
    case 'SETTLEMENT': return SettlementView
    case 'ENERGY': return EnergyView
    case 'CART': return CartView
    case 'CLEANING': return CleaningView
    case 'SETTINGS': return SettingsView
    default: return DashboardView
  }
})

const mobileNavItems = NAV_ITEMS
</script>
