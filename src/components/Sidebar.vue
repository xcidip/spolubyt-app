<template>
  <aside 
    class="bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-[calc(100vh-57px)] transition-all duration-200 ease-in-out select-none"
    :class="isSidebarCollapsed ? 'w-16' : 'w-72'"
  >
    <!-- Main nav links -->
    <div :class="isSidebarCollapsed ? 'p-2 space-y-2' : 'p-3 space-y-1'">
      <!-- Header with title & minimize button -->
      <div 
        class="flex items-center pb-1.5 text-slate-500"
        :class="isSidebarCollapsed ? 'justify-center pt-1' : 'justify-between px-3 pt-2'"
      >
        <span 
          v-if="!isSidebarCollapsed" 
          class="text-[11px] font-bold uppercase tracking-wider text-slate-500"
        >
          Hlavní menu
        </span>
        <button
          @click="toggleSidebar"
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          :title="isSidebarCollapsed ? 'Rozbalit postranní panel' : 'Minimalizovat panel'"
          :aria-label="isSidebarCollapsed ? 'Rozbalit postranní panel' : 'Minimalizovat panel'"
        >
          <svg 
            class="w-4 h-4 transition-transform duration-200" 
            :class="{ 'rotate-180': isSidebarCollapsed }" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <!-- Dashboard -->
      <button
        @click="navigateTo('DASH')"
        class="w-full flex items-center rounded-xl text-sm font-medium transition-colors relative group"
        :class="[
          isSidebarCollapsed ? 'justify-center py-2.5 px-0' : 'justify-between px-3 py-2.5 text-left',
          currentPage === 'DASH' ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/25' : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
        ]"
        :title="isSidebarCollapsed ? 'Nástěnka' : ''"
      >
        <div class="flex items-center gap-3 min-w-0" :class="{ 'justify-center': isSidebarCollapsed }">
          <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span v-if="!isSidebarCollapsed" class="truncate">Nástěnka</span>
        </div>
      </button>

      <!-- Expenses -->
      <button
        @click="navigateTo('EXPENSES')"
        class="w-full flex items-center rounded-xl text-sm font-medium transition-colors relative group"
        :class="[
          isSidebarCollapsed ? 'justify-center py-2.5 px-0' : 'justify-between px-3 py-2.5 text-left',
          currentPage === 'EXPENSES' ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/25' : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
        ]"
        :title="isSidebarCollapsed ? `Výdaje a platby (${expenses.length})` : ''"
      >
        <div class="flex items-center gap-3 min-w-0" :class="{ 'justify-center': isSidebarCollapsed }">
          <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <span v-if="!isSidebarCollapsed" class="truncate">Výdaje a platby</span>
        </div>
        <span 
          v-if="!isSidebarCollapsed"
          class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono shrink-0 ml-2 whitespace-nowrap"
        >
          {{ expenses.length }}
        </span>
      </button>

      <!-- Settlements -->
      <button
        @click="navigateTo('SETTLEMENT')"
        class="w-full flex items-center rounded-xl text-sm font-medium transition-colors relative group"
        :class="[
          isSidebarCollapsed ? 'justify-center py-2.5 px-0' : 'justify-between px-3 py-2.5 text-left',
          currentPage === 'SETTLEMENT' ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/25' : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
        ]"
        :title="isSidebarCollapsed ? ('Vyrovnání a matice' + (overdueDebtorsCount > 0 ? ` (${overdueDebtorsCount} po splatnosti)` : '')) : ''"
      >
        <div class="flex items-center gap-3 min-w-0" :class="{ 'justify-center': isSidebarCollapsed }">
          <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span v-if="!isSidebarCollapsed" class="truncate">Vyrovnání a matice</span>
        </div>
        <span 
          v-if="!isSidebarCollapsed && overdueDebtorsCount > 0"
          class="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold shrink-0 ml-2 whitespace-nowrap"
        >
          {{ overdueDebtorsCount }} po spl.
        </span>
        <!-- Collapsed overdue dot indicator -->
        <span 
          v-if="isSidebarCollapsed && overdueDebtorsCount > 0"
          class="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-pulse"
        ></span>
      </button>

      <!-- Energy -->
      <button
        @click="navigateTo('ENERGY')"
        class="w-full flex items-center rounded-xl text-sm font-medium transition-colors relative group"
        :class="[
          isSidebarCollapsed ? 'justify-center py-2.5 px-0' : 'justify-between px-3 py-2.5 text-left',
          currentPage === 'ENERGY' ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/25' : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
        ]"
        :title="isSidebarCollapsed ? 'Energie a odečty (4 měřidla)' : ''"
      >
        <div class="flex items-center gap-3 min-w-0" :class="{ 'justify-center': isSidebarCollapsed }">
          <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span v-if="!isSidebarCollapsed" class="truncate">Energie a odečty</span>
        </div>
        <span 
          v-if="!isSidebarCollapsed"
          class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono shrink-0 ml-2 whitespace-nowrap"
        >
          4 měřidla
        </span>
      </button>

      <!-- Shared Cart / Nákupní seznam -->
      <button
        @click="navigateTo('CART')"
        class="w-full flex items-center rounded-xl text-sm font-medium transition-colors relative group"
        :class="[
          isSidebarCollapsed ? 'justify-center py-2.5 px-0' : 'justify-between px-3 py-2.5 text-left',
          currentPage === 'CART' ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/25' : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
        ]"
        :title="isSidebarCollapsed ? ('Nákupní košík' + (cartTotalCount > 0 ? ` (${cartTotalCount})` : '')) : ''"
      >
        <div class="flex items-center gap-3 min-w-0" :class="{ 'justify-center': isSidebarCollapsed }">
          <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span v-if="!isSidebarCollapsed" class="truncate">Nákupní košík</span>
        </div>
        <span 
          v-if="!isSidebarCollapsed && cartTotalCount > 0"
          class="text-xs px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold shrink-0 ml-2 whitespace-nowrap"
        >
          {{ cartTotalCount }}
        </span>
        <!-- Collapsed cart badge -->
        <span 
          v-if="isSidebarCollapsed && cartTotalCount > 0"
          class="absolute top-1 right-1 text-[10px] w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center shadow"
        >
          {{ cartTotalCount }}
        </span>
      </button>

      <!-- Settings -->
      <button
        @click="navigateTo('SETTINGS')"
        class="w-full flex items-center rounded-xl text-sm font-medium transition-colors relative group"
        :class="[
          isSidebarCollapsed ? 'justify-center py-2.5 px-0' : 'justify-between px-3 py-2.5 text-left',
          currentPage === 'SETTINGS' ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/25' : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
        ]"
        :title="isSidebarCollapsed ? 'Nastavení bytu' : ''"
      >
        <div class="flex items-center gap-3 min-w-0" :class="{ 'justify-center': isSidebarCollapsed }">
          <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span v-if="!isSidebarCollapsed" class="truncate">Nastavení bytu</span>
        </div>
      </button>

    </div>

    <!-- Bottom info card -->
    <div :class="isSidebarCollapsed ? 'p-2 border-t border-slate-800' : 'p-4 border-t border-slate-800 space-y-3'">
      <!-- Quick user summary -->
      <div 
        class="flex items-center rounded-xl bg-slate-800/60 border border-slate-700/60"
        :class="isSidebarCollapsed ? 'justify-center p-1.5' : 'gap-3 p-2.5'"
        :title="isSidebarCollapsed ? `${currentUser.name} (${currentUser.role} • ${currentUser.roomName})` : ''"
      >
        <div 
          class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shrink-0 text-xs"
          :class="currentUser.avatarColor"
        >
          {{ currentUser.avatarInitial }}
        </div>
        <div v-if="!isSidebarCollapsed" class="flex-1 min-w-0">
          <div class="text-xs font-bold text-white truncate">{{ currentUser.name }}</div>
          <div class="text-[11px] text-slate-400 truncate">{{ currentUser.role }} • {{ currentUser.roomName.split(' ')[0] }}</div>
        </div>
      </div>

      <!-- Course & App info -->
      <div v-if="!isSidebarCollapsed" class="text-[11px] text-slate-500 space-y-1">
        <div class="flex items-center justify-between">
          <span>Verze prototypu:</span>
          <span class="font-mono text-slate-400">1.0.0-rc</span>
        </div>
        <div class="flex items-center justify-between">
          <span>Předmět:</span>
          <span class="text-emerald-400/90 font-medium">Interakční design</span>
        </div>
        <div class="flex items-center justify-between">
          <span>Garant:</span>
          <span>PEF ČZU Praha</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useSpolubyt } from '../composables/useSpolubyt'

const { 
  currentPage, 
  navigateTo, 
  expenses, 
  overdueDebtorsCount, 
  cartTotalCount, 
  currentUser,
  isSidebarCollapsed,
  toggleSidebar
} = useSpolubyt()
</script>
