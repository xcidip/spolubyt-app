import { nextTick, onMounted, onUnmounted, watch, type Ref } from 'vue'

const dialogs: { id: symbol; opener: HTMLElement | null }[] = []
const focusableSelector = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useDialog(panel: Ref<HTMLElement | null>, close: () => void, isOpen?: Ref<boolean>): void {
  const id = Symbol('dialog')
  let opener: HTMLElement | null = null
  let generation = 0
  let mountedPanel: HTMLElement | null = null
  const isTop = (): boolean => dialogs.at(-1)?.id === id
  const elements = (): HTMLElement[] => Array.from(panel.value?.querySelectorAll<HTMLElement>(focusableSelector) ?? []).filter(el => el.getClientRects().length > 0)
  const focusFirst = (): void => (elements()[0] ?? panel.value)?.focus()
  const deactivate = (): void => {
    generation++
    const index = dialogs.findIndex(dialog => dialog.id === id)
    if (index < 0) return
    const top = isTop()
    const next = dialogs[index + 1]
    if (next && next.opener && mountedPanel?.contains(next.opener)) next.opener = dialogs[index].opener
    const returnFocus = dialogs[index].opener
    dialogs.splice(index, 1)
    if (top) {
      const target = returnFocus?.isConnected ? returnFocus : document.querySelector<HTMLElement>('main button, header button')
      target?.focus()
    }
  }
  const activate = async (): Promise<void> => {
    if (dialogs.some(dialog => dialog.id === id)) return
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialogs.push({ id, opener })
    const revision = ++generation
    await nextTick()
    if (revision === generation && isTop()) {
      mountedPanel = panel.value
      focusFirst()
    }
  }
  const keydown = (event: KeyboardEvent): void => {
    if (!isTop()) return
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopImmediatePropagation()
      close()
    } else if (event.key === 'Tab') {
      const items = elements()
      const first = items[0]
      const last = items.at(-1)
      if (!first || !last) {
        event.preventDefault()
        panel.value?.focus()
      } else if (!panel.value?.contains(document.activeElement) || (event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault()
        const target = event.shiftKey ? last : first
        target.focus()
      }
    }
  }
  const focusin = (event: FocusEvent): void => {
    if (isTop() && panel.value && !panel.value.contains(event.target as Node)) focusFirst()
  }
  onMounted(() => {
    document.addEventListener('keydown', keydown, true)
    document.addEventListener('focusin', focusin)
    if (!isOpen || isOpen.value) void activate()
  })
  if (isOpen) watch(isOpen, open => { if (open) void activate(); else deactivate() }, { flush: 'post' })
  onUnmounted(() => {
    document.removeEventListener('keydown', keydown, true)
    document.removeEventListener('focusin', focusin)
    deactivate()
  })
}
