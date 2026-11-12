<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path :d="paths[page]" />
  </svg>
</template>

<script setup lang="ts">
import type { PageId } from '../types'
defineProps<{ page: PageId }>()
const paths: Record<PageId, string> = {
  DASH: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  EXPENSES: 'M6 3h12v18l-3-2-3 2-3-2-3 2z M9 7h6 M9 11h6',
  SETTLEMENT: 'M12 3v18 M5 21h14 M4 7h16 M4 7l-3 7h6z M20 7l-3 7h6z',
  ENERGY: 'M13 2L3 14h8l-1 8L21 10h-8z',
  CART: 'M2 3h3l3 12h11l3-8H6 M9 20h.01 M18 20h.01',
  CLEANING: 'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z M20 17v6 M17 20h6',
  SETTINGS: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M9 2h6l1 4 4 1 2 5-2 5-4 1-1 4H9l-1-4-4-1-2-5 2-5 4-1z',
}
</script>
