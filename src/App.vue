<template>
  <div class="h-screen h-dvh bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-emerald-500/30 selection:text-emerald-300 overflow-hidden">
    
    <!-- Top System Bar -->
    <Header class="shrink-0" />

    <!-- Main Layout: Left Sidebar + Central Work Area -->
    <div class="flex-1 flex overflow-hidden min-h-0">
      
      <!-- Permanent Left Navigation -->
      <Sidebar class="hidden md:flex shrink-0 h-full" />

      <!-- Central Content Area -->
      <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-h-0">
        
        <!-- Mobile Bottom Nav -->
        <div class="md:hidden flex items-center justify-around bg-slate-900 border border-slate-800 rounded-2xl p-2 mb-4 text-xs">
          <button 
            @click="navigateTo('DASH')"
            class="px-2 py-1.5 rounded-lg"
            :class="currentPage === 'DASH' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400'"
          >
            Nástěnka
          </button>
          <button 
            @click="navigateTo('EXPENSES')"
            class="px-2 py-1.5 rounded-lg"
            :class="currentPage === 'EXPENSES' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400'"
          >
            Výdaje
          </button>
          <button 
            @click="navigateTo('SETTLEMENT')"
            class="px-2 py-1.5 rounded-lg"
            :class="currentPage === 'SETTLEMENT' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400'"
          >
            Vyrovnání
          </button>
          <button 
            @click="navigateTo('ENERGY')"
            class="px-2 py-1.5 rounded-lg"
            :class="currentPage === 'ENERGY' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400'"
          >
            Energie
          </button>
          <button 
            @click="navigateTo('CART')"
            class="px-2 py-1.5 rounded-lg"
            :class="currentPage === 'CART' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400'"
          >
            Košík
          </button>
          <button 
            @click="navigateTo('CLEANING')"
            class="px-2 py-1.5 rounded-lg"
            :class="currentPage === 'CLEANING' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400'"
          >
            Úklid
          </button>
          <button 
            @click="navigateTo('SETTINGS')"
            class="px-2 py-1.5 rounded-lg"
            :class="currentPage === 'SETTINGS' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400'"
          >
            Nastavení
          </button>
        </div>

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
    <ToastContainer />

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSpolubyt } from './composables/useSpolubyt'

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
  currentPage, 
  activeModal, 
  selectedExpense, 
  selectedSettlement, 
  navigateTo 
} = useSpolubyt()

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
</script>

