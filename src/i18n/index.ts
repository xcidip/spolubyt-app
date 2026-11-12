import { ref, watch } from 'vue'
import cs from './locales/cs.json'
import en from './locales/en.json'

export type Locale = 'cs' | 'en'

export const SUPPORTED_LOCALES: Locale[] = ['cs', 'en']

export const LOCALE_STORAGE_KEY = 'spolubyt_hifi_v1_locale'

type MessageNode = string | { [key: string]: MessageNode }
type MessageDict = Record<string, MessageNode>

const messages: Record<Locale, MessageDict> = {
  cs: cs as MessageDict,
  en: en as MessageDict
}

function lookup(dict: MessageDict, key: string): string | undefined {
  const parts = key.split('.')
  let node: MessageNode | undefined = dict
  for (const part of parts) {
    if (node && typeof node === 'object') {
      node = node[part]
    } else {
      return undefined
    }
  }
  return typeof node === 'string' ? node : undefined
}

function readStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (stored === 'cs' || stored === 'en') return stored
  } catch {
    // localStorage unavailable (SSR / private mode) — fall back to Czech
  }
  return 'cs'
}

/**
 * Active locale. Module-level ref so every component shares the same value
 * (same singleton-store pattern as useSpolubyt).
 */
export const locale = ref<Locale>(readStoredLocale())

if (typeof document !== 'undefined') {
  document.documentElement.lang = locale.value
}

watch(locale, (value) => {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, value)
  } catch {
    // ignore persistence errors
  }
  // Keep the <html lang> attribute in sync for accessibility / SEO.
  if (typeof document !== 'undefined') {
    document.documentElement.lang = value
  }
})

export function setLocale(value: Locale): void {
  locale.value = value
}

export function toggleLocale(): void {
  locale.value = locale.value === 'cs' ? 'en' : 'cs'
}

/**
 * Translate a key. The Czech source string is passed as `fallback` so the UI
 * still renders correctly if a key is missing from the JSON files (and so the
 * Czech copy remains visible in the source for the E2E suite).
 *
 * Supports `{name}` interpolation via the optional `params` argument.
 */
export function t(
  key: string,
  fallback?: string,
  params?: Record<string, string | number | undefined | null>
): string {
  const dict = messages[locale.value] || {}
  let value = lookup(dict, key) ?? fallback ?? key
  if (params) {
    for (const [name, replacement] of Object.entries(params)) {
      if (replacement === undefined || replacement === null) continue
      value = value.split(`{${name}}`).join(String(replacement))
    }
  }
  return value
}

export function useI18n() {
  return { locale, t, setLocale, toggleLocale, locales: SUPPORTED_LOCALES }
}