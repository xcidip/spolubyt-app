<template>
  <header class="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-4 lg:px-6 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
    <div class="flex items-center justify-between gap-2 sm:gap-4">
      
      <!-- Left: Logo & Apartment switcher -->
      <div class="flex items-center gap-4">
        <button type="button"
          @click="navigateTo('DASH')"
          class="flex items-center gap-3 text-left group focus:outline-none"
          :title="t('header.backToDashboard', 'Zpět na Nástěnku')"
          :aria-label="t('header.backToDashboard', 'Zpět na Nástěnku')"
        >
          <div class="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
          </div>
          <div class="hidden sm:block">
            <div class="flex items-center gap-1.5">
              <span class="font-extrabold text-base tracking-tight text-white">Spolubyt</span>
              <span class="text-xs px-1.5 py-0.5 rounded font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">.cz</span>
            </div>
            <div class="text-xs text-slate-400 flex items-center gap-1">
              <span>{{ settings.name }}</span>
              <span class="text-slate-400">•</span>
              <span class="text-emerald-400 font-medium">Praha 6</span>
            </div>
          </div>
        </button>

        <!-- Divider -->
        <div class="hidden md:block w-px h-6 bg-slate-800"></div>

        <!-- Breadcrumb / Active Page Indicator -->
        <div class="hidden md:flex items-center gap-2 text-xs text-slate-400">
          <span class="text-slate-400">{{ t('header.module', 'Modul:') }}</span>
          <span class="font-semibold text-slate-200 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700/60">
            {{ t(pageLabelKeys[currentPage], pageLabels[currentPage]) }}
          </span>
        </div>
      </div>

      <!-- Right controls: User Switcher, Sync status, Reset data, CTA -->
      <div class="flex items-center gap-1 sm:gap-3">
        
        <!-- LocalStorage Sync Status -->
        <div 
          class="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300"
          :title="syncStatus.title"
          role="status"
        >
          <span class="relative flex h-2 w-2">
            <span v-if="!storageWriteFailed && !storageConflict && !storageRecovered" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2" :class="storageWriteFailed || storageConflict || storageRecovered ? 'bg-amber-400' : 'bg-emerald-500'"></span>
          </span>
          <span class="text-xs font-mono">{{ syncStatus.label }}</span>
        </div>

        <!-- Language switcher -->
        <div
          class="flex items-center rounded-xl bg-slate-800 border border-slate-700 p-0.5"
          role="group"
          :aria-label="t('header.language', 'Přepnout jazyk')"
        >
          <button
            type="button"
            @click="setLocale('cs')"
            class="min-h-10 px-2 py-1 rounded-lg text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            :class="locale === 'cs' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-slate-200'"
            :aria-pressed="locale === 'cs'"
          >CS</button>
          <button
            type="button"
            @click="setLocale('en')"
            class="min-h-10 px-2 py-1 rounded-lg text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            :class="locale === 'en' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-slate-200'"
            :aria-pressed="locale === 'en'"
          >EN</button>
        </div>

        <!-- User Persona Switcher -->
        <div class="relative" ref="dropdownRef" @keydown.esc.stop.prevent="closePersonaMenu">
          <button type="button"
            ref="personaTrigger"
            @click="isUserMenuOpen = !isUserMenuOpen"
            class="min-h-11 flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 transition-colors focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
            aria-controls="persona-menu"
            :aria-label="t('header.switchUser', 'Přepnout aktivního uživatele / personu')"
            :aria-expanded="isUserMenuOpen"
            :title="t('header.switchUser', 'Přepnout aktivního uživatele / personu')"
          >
            <!-- Avatar -->
            <div 
              class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              :class="currentUser.avatarColor"
            >
              {{ currentUser.avatarInitial }}
            </div>
            <div class="text-left hidden sm:block">
              <div class="text-xs font-semibold text-slate-200 leading-none">
                {{ currentUser.name }}
              </div>
              <div class="text-xs text-slate-400 leading-tight mt-0.5">
                {{ t('roles.' + currentUser.role, currentUser.role) }} ({{ currentUser.roomName.split(' ')[0] }})
              </div>
            </div>
            <!-- Chevron -->
            <svg class="w-3.5 h-3.5 text-slate-400 transition-transform" :class="{ 'rotate-180': isUserMenuOpen }" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
            </svg>
          </button>

          <!-- Dropdown menu -->
          <div
            v-if="isUserMenuOpen"
            class="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full mt-2 sm:w-64 max-h-[calc(100dvh-5rem)] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-40"
            id="persona-menu"
            role="group"
            :aria-label="t('header.testAs', 'Testovat jako persona:')"
          >
            <div class="px-2.5 py-1.5 text-xs font-semibold text-slate-400">
              {{ t('header.testAs', 'Testovat jako persona:') }}
            </div>
            <div class="space-y-1">
              <button type="button"
                v-for="r in roommates"
                :key="r.id"
                @click="selectPersona(r.id)"
                :aria-pressed="r.id === currentUser.id"
                class="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left text-xs transition-colors"
                :class="r.id === currentUser.id ? 'bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/20' : 'text-slate-300 hover:bg-slate-800'"
              >
                <div 
                  class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  :class="r.avatarColor"
                >
                  {{ r.avatarInitial }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-medium truncate">{{ r.name }}</div>
                  <div class="text-xs text-slate-400">{{ t('roles.' + r.role, r.role) }} • {{ r.roomName }}</div>
                </div>
                <span v-if="r.id === currentUser.id" class="text-emerald-400 text-xs">✓</span>
              </button>
            </div>
            
            <div class="mt-2 pt-2 border-t border-slate-800 text-xs text-slate-400 px-2">
              {{ t('header.testHint', 'Umožňuje testovat pohled správce i dlužníka.') }}
            </div>
          </div>
        </div>

        <!-- Reset demo data button -->
        <button type="button"
          @click="resetDemoData"
          class="min-h-11 min-w-11 flex items-center justify-center p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors border border-transparent hover:border-slate-700"
          :title="t('header.reset', 'Obnovit výchozí testovací data')"
          :aria-label="t('header.reset', 'Obnovit výchozí testovací data')"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <!-- Primary CTA: Nový výdaj -->
        <button type="button"
          @click="openModal('EXP_ADD')"
          :aria-label="t('header.newExpense', 'Nový výdaj')"
          class="min-h-11 min-w-11 justify-center flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs sm:text-sm px-3 sm:px-3.5 py-2 rounded-xl shadow-md shadow-emerald-900/30 transition-all transform hover:-translate-y-0.5 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span class="hidden sm:inline">{{ t('header.newExpense', 'Nový výdaj') }}</span>
        </button>

      </div>

    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useSpolubyt } from '../composables/useSpolubyt'
import { t, locale, setLocale } from '../i18n'

const { 
  storageWriteFailed,
  storageRecovered,
  storageConflict,
  currentPage, 
  settings, 
  roommates, 
  currentUser, 
  setCurrentUser, 
  openModal, 
  navigateTo, 
  resetDemoData
} = useSpolubyt()

const isUserMenuOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const personaTrigger = ref<HTMLButtonElement | null>(null)

const syncStatus = computed(() => {
  if (storageConflict.value) return { label: t('header.syncConflict', 'Ukládání: konflikt'), title: t('storage.conflict', 'Data změnila jiná záložka. Před dalšími úpravami obnovte tuto stránku.') }
  if (storageWriteFailed.value) return { label: t('header.syncFailed', 'Ukládání: chyba'), title: t('storage.writeFailed', 'Změny se nepodařilo uložit. Zůstanou pouze do zavření stránky.') }
  if (storageRecovered.value) return { label: t('header.syncRecovered', 'Data obnovena'), title: t('storage.recovered', 'Uložená data byla poškozená. Byl obnoven výchozí stav prototypu.') }
  return { label: t('header.sync', 'Sync: OK'), title: t('header.syncTitle', 'Všechna data se automaticky ukládají do LocalStorage') }
})

const closePersonaMenu = (): void => {
  if (!isUserMenuOpen.value) return
  isUserMenuOpen.value = false
  personaTrigger.value?.focus()
}

const pageLabels: Record<string, string> = {
  DASH: 'Nástěnka bytu',
  EXPENSES: 'Výpis výdajů a plateb',
  SETTLEMENT: 'Vyrovnání a matice závazků',
  ENERGY: 'Energie a odečty měřidel',
  CART: 'Společný nákupní košík',
  CLEANING: 'Úklidové směny a rotace',
  SETTINGS: 'Nastavení bytu a členů'
}

const pageLabelKeys: Record<string, string> = {
  DASH: 'page.dash',
  EXPENSES: 'page.expenses',
  SETTLEMENT: 'page.settlement',
  ENERGY: 'page.energy',
  CART: 'page.cart',
  CLEANING: 'page.cleaning',
  SETTINGS: 'page.settings'
}

const selectPersona = (id: string): void => {
  setCurrentUser(id)
  closePersonaMenu()
}

const handleClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    isUserMenuOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
})
</script>

