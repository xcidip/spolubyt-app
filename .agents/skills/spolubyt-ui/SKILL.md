---
name: spolubyt-ui
description: Change Spolubyt Vue pages, navigation, dialogs, responsive layouts, or Czech interface copy while preserving accessibility, the store protocol, and source-sensitive tests. Use for UI work in this repository.
---

# Spolubyt interface changes

Read repository `AGENTS.md`, the affected component, its callers, and relevant tests before editing. Project paths below are relative to the repository root. Inspect current `src/i18n/` conventions: preserve Czech fallback strings in `t(...)` calls and maintain corresponding locale entries when changing translated copy.

Use `<script setup lang="ts">`, relative imports, and Tailwind utilities. Match the permanent slate/emerald palette, local SVG/`NavIcon.vue` conventions, and existing responsive patterns. Do not add scoped CSS, inline styles, `dark:` variants, remote fonts, or new UI libraries. Keep domain behavior in the composable. Format currency with `toLocaleString('cs-CZ')` and the existing suffix.

Search `tests/e2e-suite.mjs` for affected labels, translation keys, and classes before replacing them. Preserve pinned CTA wording, badges, and wrapping/shrinking/icon dimensions unless the task deliberately changes them. Update an assertion only when the requested behavior changes its contract; retain unrelated checks.

## Wire pages and dialogs completely

- New page: extend `PageId` in `src/types/index.ts`, add the view to the `App.vue` component switch, and add mobile navigation in `App.vue` and desktop navigation in `Sidebar.vue`. Use `navigateTo`; no router or shared-state props.
- New modal: extend `ModalId` and `ModalPayloads`, add any payload ref and `openModal` branch, and mount against `activeModal`. Primary modals live in `App.vue`; the existing cleaning-transfer dialog lives in `CleaningView.vue`.
- Use `openModal`/`closeModal`; clear payloads as needed. Verify reopening after cancellation or persona changes does not leak prior form/entity state.
- Reuse `src/composables/useDialog.ts` for initial focus, Tab trapping, Escape priority, and restoration. Include dialog semantics, labelled title, focusable panel, backdrop dismissal, and stopped panel clicks. Escape on a confirmation above another modal must close only the top dialog.
- Use shared `requestConfirmation` and `showToast`. Store permissions must back up hidden or disabled controls. Icon-only buttons need Czech accessible names and visible focus.

For QR changes, inspect `src/utils/spayd.ts` and `QrPaymentModal.vue` together. Preserve SPAYD validity, DPI-aware rendering, removal of library inline canvas width/height, reactive regeneration, and listener/watch cleanup.

## Verify

When browser tooling is available, inspect narrow and desktop widths, long Czech names, money amounts, keyboard focus/dismissal, and restricted/permitted personas. Capture screenshots for review when available; report unperformed visual checks. Source/SSR assertions do not prove rendered layout or focus behavior.

Apply the required app bump even for visible copy/style changes. Run `npm test && npm run build`; build alone does not cover the source-sensitive assertions. Do not hand-edit generated output.
