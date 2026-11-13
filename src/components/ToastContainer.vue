<template>
  <div 
    class="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-0 sm:right-5 z-50 flex flex-col space-y-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0"
    aria-live="polite"
    aria-relevant="additions"
    role="region" 
    :aria-label="t('toast.aria', 'Uživatelská oznámení')"
  >
    <transition-group
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-4 opacity-0 scale-95"
      enter-to-class="translate-y-0 opacity-100 scale-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
          :role="toast.type === 'error' || toast.type === 'warning' ? 'alert' : 'status'"
        class="pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all"
        :class="[
          toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100' :
          toast.type === 'error' ? 'bg-rose-950/90 border-rose-500/40 text-rose-100' :
          toast.type === 'warning' ? 'bg-amber-950/90 border-amber-500/40 text-amber-100' :
          'bg-slate-900/90 border-slate-700/60 text-slate-100'
        ]"
      >
        <!-- Icon -->
        <div class="mt-0.5 shrink-0">
          <svg v-if="toast.type === 'success'" class="w-5 h-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
          </svg>
          <svg v-else-if="toast.type === 'error'" class="w-5 h-5 text-rose-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
          </svg>
          <svg v-else-if="toast.type === 'warning'" class="w-5 h-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
          </svg>
          <svg v-else class="w-5 h-5 text-sky-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
          </svg>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0 break-words">
          <div class="text-sm font-semibold tracking-tight">{{ toast.title }}</div>
          <div class="text-xs mt-0.5 opacity-90 leading-relaxed">{{ toast.message }}</div>
        </div>

        <!-- Close button -->
        <button type="button"
          @click="removeToast(toast.id)"
          class="shrink-0 p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-white/10 transition-colors"
          :aria-label="t('toast.dismiss', 'Zavřít notifikaci')"
        >
          <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { useSpolubyt } from '../composables/useSpolubyt'
import { t } from '../i18n'

const { toasts, removeToast } = useSpolubyt()
</script>

