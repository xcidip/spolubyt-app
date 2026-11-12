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
        <nav class="md:hidden flex items-center gap-1 overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl p-2 mb-4 text-xs" aria-label="Hlavní navigace">
          <button
            v-for="item in mobileNavItems"
            :key="item.id"
            @click="navigateTo(item.id)"
            class="flex flex-col items-center justify-center min-w-[64px] px-2 py-1.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            :class="currentPage === item.id ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400'"
            :aria-current="currentPage === item.id ? 'page' : undefined"
          >
            <component :is="item.icon" class="w-4 h-4 mb-0.5" />
            <span class="text-xs leading-tight">{{ item.label }}</span>
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
    <ToastContainer />

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  LayoutDashboard,
  Receipt,
  Scale,
  Zap,
  ShoppingCart,
  Sparkles,
  Settings
} from 'lucide-vue-next'
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

const mobileNavItems = [
  { id: 'DASH', label: 'Nástěnka', icon: LayoutDashboard },
  { id: 'EXPENSES', label: 'Výdaje', icon: Receipt },
  { id: 'SETTLEMENT', label: 'Vyrovnání', icon: Scale },
  { id: 'ENERGY', label: 'Energie', icon: Zap },
  { id: 'CART', label: 'Košík', icon: ShoppingCart },
  { id: 'CLEANING', label: 'Úklid', icon: Sparkles },
  { id: 'SETTINGS', label: 'Nastavení', icon: Settings }
] as const
</script>

