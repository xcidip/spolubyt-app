<template>
  <teleport to="body">
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div 
        v-if="confirmModal.isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="'confirm-title'"
        @keydown.esc="closeConfirmation"
      >
        <div 
          class="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-slate-100"
          @click.stop
        >
          <!-- Warning Icon -->
          <div class="flex items-center gap-3.5 mb-4">
            <div 
              class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              :class="confirmModal.isDestructive ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 id="confirm-title" class="text-lg font-bold text-slate-100 tracking-tight">
                {{ confirmModal.title }}
              </h3>
              <span class="text-xs text-slate-400">{{ t('confirm.security', 'Bezpečnostní konfirmace akce') }}</span>
            </div>
          </div>

          <!-- Message -->
          <p class="text-sm text-slate-300 leading-relaxed mb-6">
            {{ confirmModal.message }}
          </p>

          <!-- Action buttons -->
          <div class="flex items-center justify-end gap-3">
            <button
              type="button"
              @click="closeConfirmation"
              class="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-750 hover:text-white rounded-lg border border-slate-700 transition-colors focus:ring-2 focus:ring-slate-500 focus:outline-none"
            >
              {{ confirmModal.cancelLabel }}
            </button>
            <button
              type="button"
              @click="confirmModal.onConfirm"
              class="px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm transition-all focus:ring-2 focus:outline-none"
              :class="confirmModal.isDestructive 
                ? 'bg-rose-600 hover:bg-rose-500 focus:ring-rose-400' 
                : 'bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-400'"
            >
              {{ confirmModal.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { useSpolubyt } from '../composables/useSpolubyt'
import { t } from '../i18n'

const { confirmModal, closeConfirmation } = useSpolubyt()
</script>

