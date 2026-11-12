# AGENTS.md

Operating manual for AI agents (and humans) working in this repository. Read this **before** editing anything.

---

## 1. What this project is

**Spolubyt** — a Czech-language high-fidelity *interactive prototype* of an app for **splitting costs and managing a shared flat** (semestrální práce, PEF ČZU v Praze, předmět Interakční design).

It is **not** a production app:

- **No backend, no network, no database.** All data lives in `localStorage`.
- **No authentication.** Roles are simulated by switching the active persona in the UI.
- **No router.** Page switching is a `ref` in a global composable.
- All demo data is **frozen to November 2026, "week 45"** and deliberately scenario-crafted.

Consequence: correctness is judged by *demonstrable interaction behaviour* and by the **E2E suite in `tests/`**, not by API contracts.

### Feature domains

| Domain | Page / Component | Notes |
|---|---|---|
| Dashboard KPIs, monthly overview | `views/DashboardView.vue` | role-aware cards, cleaning widget |
| Expenses (list, search, filter, sort, CSV, detail tabs) | `views/ExpensesView.vue`, `components/ExpenseDetailModal.vue`, `ExpenseAddModal.vue` | audit trail, receipt items |
| Settlements + Czech **SPAYD** QR payment | `views/SettlementView.vue`, `QrPaymentModal.vue`, `ConfirmPaymentModal.vue` | confetti on payment |
| Energy meter readings + annual settlement prediction | `views/EnergyView.vue`, `MeterAddModal.vue` | surplus/deficit forecast |
| Shared shopping cart → expense conversion | `views/CartView.vue` | `isPurchased` gate |
| Cleaning rota + shift-swap state machine | `views/CleaningView.vue` | permission-gated |
| Apartment settings (admin only) | `views/SettingsView.vue` | members see a read-only banner |

---

## 2. Stack

| Concern | Choice | Version |
|---|---|---|
| Framework | Vue 3, Composition API, **`<script setup lang="ts">`** only | ^3.5.13 |
| Language | TypeScript (strict, `noEmit`) | ~5.7.2 |
| Styling | Tailwind CSS (utility classes only) | ^3.4.17 |
| Build | Vite (port 5173, `strictPort`) | ^6.1.0 |
| Desktop shell | Tauri 2 (Rust) — **passive wrapper, zero IPC** | ^2.12.4 |
| Icons | `lucide-vue-next` | ^0.475.0 |
| QR | `qrcode` (canvas) | ^1.5.4 |
| Delight | `canvas-confetti` | ^1.9.4 |
| Tests | hand-rolled Node runner + Vite SSR loader | — |

Node **v20+** required. There is **no** ESLint, Prettier, Vitest, Playwright, Pinia, or vue-router — do not introduce them.

---

## 3. Commands

```bash
npm install          # deps (node_modules is already present)
npm run dev          # vite dev server → http://localhost:5173
npm run build        # vue-tsc (type check) && vite build
npm run preview      # serve dist
npm test             # node tests/e2e-suite.mjs — 132 E2E cases
npm run tauri dev    # desktop dev (needs Rust toolchain)
npm run tauri build  # bundles into src-tauri/target/release/bundle/
```

**Mandatory before you claim a task is done:**

```bash
npm test && npm run build
```

`npm run build` is not optional — `vue-tsc` is the only type checker in the project.

> `npm test` internally shells out to `npm run build` (test `T1.F11.1`), so it is slow (~1–2 min). That is expected.

---

## 4. File map

```
index.html                      entry; loads Plus Jakarta Sans + JetBrains Mono from Google Fonts, lang="cs"
src/main.ts                     createApp(App).mount('#app')  — nothing else
src/style.css                   @tailwind directives + body/scrollbar base styles
src/App.vue                     app shell: Header + Sidebar + mobile nav + <component :is> + modal layer + ConfirmDialog + ToastContainer
src/composables/useSpolubyt.ts  ★ SINGLE SOURCE OF TRUTH — all state, all business logic (~1213 lines)
src/data/mockData.ts            ★ all initial demo data (~961 lines)
src/types/index.ts              ★ all domain types (~194 lines)
src/views/*.vue                 7 page-level components (no props; they pull from the composable)
src/components/*.vue            Header, Sidebar, 5 modals, ConfirmDialog, ToastContainer
tests/e2e-suite.mjs             ★ the only wired test suite (132 cases, 4 tiers)
tests/m1-challenger.mjs         auxiliary harness — NOT in package.json scripts
tests/m1-stress-harness.ts      auxiliary harness — NOT in package.json scripts
src-tauri/                      Tauri 2 shell, stock main.rs, icons, tauri.conf.json
.github/workflows/release.yml   tauri-action release build on `v*` tags only (no test CI)
```

`@` → `./src` alias exists in `vite.config.ts`, but **existing code uses relative imports**. Follow the existing relative style.

---

## 5. State architecture — the contract

### 5.1 Singleton module-level refs

All state lives as **module-level `ref`s declared outside** `export function useSpolubyt()`. This makes the composable a **singleton store** (like a mini-Pinia). Every component calling `useSpolubyt()` shares the same state.

**Rules:**
- Never move state inside the function body — that would create per-component copies and break cross-view reactivity.
- Never use `provide/inject`, props for shared state, or a new store library.
- Adding state = add a module-level `ref` + add a `watch(...{deep:true})` persisting it + expose it in the `return {}` block.

### 5.2 Persistence

```ts
const STORAGE_KEY_PREFIX = 'spolubyt_hifi_v1_'
```

Persisted keys (suffix after the prefix):

| Key | Slice |
|---|---|
| `roommates` | `Roommate[]` |
| `currentUserId` | active persona id |
| `settings` | `ApartmentSettings` |
| `settlements` | `DebtSettlement[]` |
| `expenses` | `Expense[]` |
| `meters` | `MeterReading[]` |
| `cartItems` | `CartItem[]` |
| `cleaning_shifts` | `CleaningShift[]` |
| `sidebar_collapsed` | UI preference (not domain) |

- `loadFromStorage<T>(key, fallback)` / `saveToStorage<T>(key, value)` both swallow errors (`try/catch` + `console.error`) — keep that behaviour.
- **Not persisted** (intentional): `toasts`, `confirmModal`, `activeModal`, `selectedExpense`, `selectedSettlement`, `expensePrefill`, `expenseFilters`, `selectedCleaningWeek`, `currentPage`.
- **Changing any persisted shape ⇒ bump `spolubyt_hifi_v1_` → `_v2_`.** Otherwise stale `localStorage` from a previous run will hydrate mismatched objects and crash the UI.
- `resetDemoData()` deep-clones (`JSON.parse(JSON.stringify(...))`) from `mockData`, resets persona to `'user-tomas'`, page to `'DASH'`, week to `45`, and is always wrapped in `requestConfirmation`.

### 5.3 Navigation

```ts
export type PageId = 'DASH' | 'EXPENSES' | 'SETTLEMENT' | 'ENERGY' | 'SETTINGS' | 'CART' | 'CLEANING'
const currentPage = ref<PageId>('DASH')
navigateTo(page)  // sets page + window.scrollTo({top: 0, behavior: 'smooth'})
```

`App.vue` maps `currentPage` → component through a `computed` switch. Adding a page requires touching: `types/index.ts` (`PageId`), `useSpolubyt.ts` (returned ref is already generic), `App.vue` (switch + mobile nav), `components/Sidebar.vue` (desktop nav item).

### 5.4 Modal protocol

Exactly one modal at a time: `activeModal: ref<string | null>`, values:

| `activeModal` | Payload ref | Component |
|---|---|---|
| `'EXP_ADD'` | `expensePrefill: ExpensePrefillData \| null` | `ExpenseAddModal.vue` |
| `'EXP_DETAIL'` | `selectedExpense: Expense` | `ExpenseDetailModal.vue` |
| `'QR_MODAL'` | `selectedSettlement: DebtSettlement` | `QrPaymentModal.vue` |
| `'CONFIRM_MODAL'` | `selectedSettlement: DebtSettlement` | `ConfirmPaymentModal.vue` |
| `'METER_ADD'` | — | `MeterAddModal.vue` |

- Always open via `openModal(name, payload)` and close via `closeModal()` (which also clears `expensePrefill` to prevent form leakage).
- Modals render with `v-if` in `App.vue` against `activeModal` — never with local `v-model` visibility state.
- New modal checklist: type/payload ref → `openModal` branch → `App.vue` `<XModal v-if="activeModal === 'X'" />` → `role="dialog"` + `aria-modal="true"` + `aria-labelledby` + `@keydown.esc` + `@click.stop` on the panel + backdrop click to close.

### 5.5 Confirmation dialog

`requestConfirmation({ title, message, confirmLabel, cancelLabel, isDestructive, onConfirm })` — imperative, promise-free, uses a callback. Use it for **every destructive or irreversible action** (delete expense, clear cart, reset data, remove cart item). `ConfirmDialog.vue` renders from `confirmModal` state. Escape cancels.

### 5.6 Toasts

`showToast(title, message, type?, duration? = 3800)` where `type ∈ 'success' | 'warning' | 'error' | 'info'`. Auto-dismiss via `setTimeout` when `duration > 0`. `ToastContainer.vue` renders.

Convention: **Czech copy, specific and contextual** — always name the entity and the money amount, e.g. `Výdaj úspěšně zaevidován / Položka „X“ (1 200 Kč) byla rozpočítána a uložena.` Emoji are used sparingly in success messages (`🎉` on payment/cleaning completion).

---

## 6. Domain model & invariants

Types live **only** in `src/types/index.ts`. Do not declare domain interfaces inside components or the composable.

### Personas (`INITIAL_ROOMMATES`, id → role)

| id | Name | Role | Purpose in demos |
|---|---|---|---|
| `user-tomas` | Tomáš Beránek | **`'Správce'`** | admin; sees full balance, remands, settings |
| `user-jakub` | Jakub Kovář | `'Člen'` | debt 9 850 Kč, **before** due date → QR flow |
| `user-eliska` | Eliška Malá | `'Člen'` | debt 4 500 Kč, **overdue** → reminder flow |
| `user-martin` | Martin Pospíšil | `'Člen'` | 0 Kč, fully settled state |

Admin is determined **by `role === 'Správce'`**, never by a hardcoded id:

```ts
const isMasterTenant = computed(() => currentUser.value.role === 'Správce')
```

### Apartment (`INITIAL_SETTINGS`)

`monthlyRent: 28000`, `monthlyUtilities: 8600`, `dueDayOfMonth: 10`, IBAN `CZ6508000000000123456789`, account `123456789 / 0800 (Česká spořitelna)`, rules `{ rentKey: 'BY_AREA', energyKey: 'EQUAL', suppliesKey: 'EQUAL' }`. Room areas 15 / 22 / 20 / 18 m² → `areaSharePct` 20 / 29.3 / 26.7 / 24 (recomputed by `updateRoommateArea`).

### Money & state literals (Czech, without diacritics in identifiers)

`ExpenseShare.status`: `'UHRAZENO' | 'DLUŽÍ' | 'PO_SPLATNOSTI' | 'PLÁTCE'` ·
`Expense.status`: `'UHRAZENO' | 'ČÁSTEČNĚ' | 'PO_SPLATNOSTI'` ·
`DebtSettlement.status`: `'PŘED_SPLATNOSTÍ' | 'PO_SPLATNOSTI' | 'VYROVNÁNO'` ·
categories: `'Bydlení' | 'Energie' | 'Drogerie' | 'Služby' | 'Údržba' | 'Jídlo'` ·
calculation: `'EQUAL' | 'BY_AREA' | 'CUSTOM'`

Never invent new literals without also handling them in every comparison/switch that consumes them.

### Settlement ⇄ expense coupling (manual, imperative)

There is **no derived ledger** — settlement debts are mutated by hand:

- `addExpense(expense)`: for each non-payer share that is not `UHRAZENO`, find the roommate's settlement, `totalDebt += share.amount`, add to the matching `breakdown` bucket by category (`Bydlení → rent`, `Energie → energy`, `Drogerie → drogerie`, otherwise `other`), and set status by `daysOverdue > 0`.
- `deleteExpense(id)`: reverse exactly the same amounts with `Math.max(0, totalDebt - share.amount)`; force `VYROVNÁNO` at zero. Then filter the array. Always via `requestConfirmation` (destructive).
- `confirmPayment(roommateId, { date, method, note, notifyMember })`: zeroes the settlement (`daysOverdue = 0`, `breakdown` reset), flips **all** that roommate's shares to `UHRAZENO` + `settledDate`, promotes fully-paid expenses to `UHRAZENO`, fires `confetti(...)`, closes modal, toasts.
- `sendReminder(roommateId)`: stamps `lastReminderSent` (Czech date string) + toast. No network call — that is correct for a prototype.

**If you add a path that changes who owes what, you must update all of: debt, `breakdown`, `status`, and the affected `shares`.** Asymmetry here is the most likely bug class in this codebase.

### Meters

`addMeterReading` **rejects non-monotonic readings** (new value < latest value of that type) with an `'error'` toast and returns `false`. Units: `kWh` for `ELEKTŘINA`, `m³` otherwise. `delta` is computed against `latestMeters[type]`. `latestMeters` is a computed map keyed by type, picking max date.

### Energy prediction

`annualEnergyPrediction` is a `computed<EnergyPrediction>` combining `settings.monthlyUtilities * 12` with **hardcoded** per-unit rates and consumption totals (documented inline in the composable with the arithmetic). It returns `{ annualAdvances, projectedAnnualCost, netDelta, isSurplus, formattedDelta, drawdownPct, riskLevel }`; `drawdownPct > 108 → 'Vysoké riziko'`, `> 100 → 'Mírné překročení'`, else `'Nízké riziko'`. Tests only require reactivity to `monthlyUtilities` — do not "clean up" the constants without checking tests.

### Cleaning rota & shift swaps

- 4 fixed task keys (`KITCHEN`, `BATHROOM`, `CORRIDOR`, `TRASH`) × 4 roommates; `currentWeekNumber = 45`; `selectedCleaningWeek` drives the view.
- `ensureShiftsForWeek(week)` lazily **generates** shifts for weeks other than 45 with ids `shift-w{week}-{taskkey}` and rotates assignment by week offset. Week 45 base date is Monday `2026-11-02`.
- Swap state machine on `shift.swapRequest`:
  `PENDING --accept--> ACCEPTED` (reassigns `roommateId`/`roommateName` to target, confetti)
  `PENDING --reject--> REJECTED` · `PENDING --cancel--> CANCELLED`
- **Permission matrix** — every guard toasts `'Přístup odepřen'` with `'warning'` and aborts:
  - complete a shift → assigned roommate **or** `Správce`
  - request a swap → assigned roommate **or** `Správce`
  - accept/reject → the targeted roommate **or** `Správce`
  - cancel → the requester **or** `Správce`
  - no self-swap (`target.id === shift.roommateId` → `'Upozornění'`)

### SPAYD QR (`QrPaymentModal.vue`)

```
SPD*1.0*ACC:<IBAN no spaces>*AM:<amount.toFixed(2)>*CC:CZK*MSG:<ascii, ≤60 chars>*X-VS:20261101
```

Diacritics are stripped (`normalize('NFD')` + remove combining marks + keep `[a-zA-Z0-9 -]`). Canvas rendering is DPI-aware and **explicitly strips the inline `width`/`height` styles the library sets**, so Tailwind (`w-44`, `max-w-full`) stays in control — do not remove those `removeProperty` calls, they fix a real layout blowout. Re-renders on `resize` and on `settlement` change; both listener and watcher must be cleaned up (the `onUnmounted` handler exists).

---

## 7. Code conventions

### Formatting & language

- **2-space indent, single quotes, no semicolons**, trailing commas in multiline literals. There is no formatter — match the surrounding file.
- **All user-facing copy is Czech**, including toasts, labels, empty states, `aria-label`s, and comments in mock data. Code identifiers stay English except domain literals (see §6).
- Comments: only where they explain *why* (arithmetic derivations, browser quirks). Do not narrate obvious code.

### Components

- SFC order inside `<script setup>`: imports → composable destructuring → local state → computeds → functions → lifecycle.
- Destructure from the store at the top: `const { expenses, showToast, openModal } = useSpolubyt()`.
- Views take **no props**.
- Use `computed` for anything derived; never duplicate store logic in a component.
- Type every function parameter/return; `any` is banned (existing `(s.breakdown as any)` is legacy — don't copy it).

### Styling — actual palette (CODE IS TRUTH)

> The app is dark slate + emerald. Follow the code and `tailwind.config.js`.

| Token | Value |
|---|---|
| page bg | `bg-slate-950` (`#020617`) |
| cards / surfaces | `bg-slate-900`, `bg-slate-850` (custom), `border-slate-800` |
| elevated / hover | `bg-slate-800`, `hover:bg-slate-750`, `border-slate-700` |
| primary accent | `emerald-500/600`, text `emerald-300/400` |
| brand scale | `brand.500 #22c55e` … `brand.900 #14532d` |
| surface scale | `surface.dark #0f172a`, `surface.card #1e293b`, `surface.border #334155`, `surface.hover #283548` |
| fonts | `font-sans` = Plus Jakarta Sans, `font-mono` = JetBrains Mono |
| body | `text-slate-100`, muted `text-slate-400`, `antialiased` |

- **Utility classes only.** No `<style scoped>`, no CSS modules, no inline styles (except the QR canvas manipulation described above).
- Dark mode is permanent (`<html class="dark">`, `color-scheme: dark`) — do not add `dark:` variants.
- Radii `rounded-xl`/`rounded-2xl`, focus `focus:ring-2 focus:ring-emerald-500/40`, disabled `disabled:opacity-50 disabled:cursor-not-allowed`.
- Money is always formatted with `toLocaleString('cs-CZ')` and a `Kč` / `CZK` suffix.

### Accessibility

- Modals: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="…"`, Escape to close, backdrop click to close, `@click.stop` on the panel.
- Icon-only buttons need `aria-label` in Czech.
- Use `<button type="button">` for actions, `<main>`/`<nav>`/`<header>` landmarks, visible focus rings.

### Global keyboard/dialog UX

`ConfirmDialog` and every modal must remain Escape-dismissible. Don't introduce `keydown` listeners without `onUnmounted` cleanup.

---

## 8. Testing — the real constraint

`npm test` runs `tests/e2e-suite.mjs`: **132 cases in 4 tiers**
(56 feature coverage · 55 boundary/corner · 15 cross-feature · 6 real-world tenant scenarios).

### How it works

1. Mocks `globalThis.localStorage` and `globalThis.window` **before** importing the store.
2. Boots Vite via `createServer({ middlewareMode: true })` and loads the store with `viteServer.ssrLoadModule('./src/composables/useSpolubyt.ts')` — so **the composable must be importable in bare Node**: no top-level `document`/`window` access, no browser-only side effects at module scope.
3. Each test calls `getFreshStore()` → `localStorage.clear()` → `resetDemoData()` + auto-invokes `confirmModal.onConfirm()` → resets page/persona/modals.
4. Helpers available: `assert`, `assertEqual`, `assertMatch`, `assertContains`, `assertNotContains`, `assertDefined`, `assertThrows`, `test(id, title, tier, category, fn)`, `loadSource(relPath)`.

### ⚠️ Tiers 1–2 assert against **raw `.vue` source text**

Many tests `fs.readFileSync` a component and regex the template. They will fail if you:

- rename/remove a class such as `flex-wrap`, `shrink-0`, `gap-2`/`gap-x-2` in the dashboard cards;
- reintroduce `uppercase` + `tracking-wider` on section/hero headings (natural Title/Sentence case is enforced);
- change button labels — e.g. `"Převést do výdajů"`, `"Zaplatit QR →"`, `"Vyrovnání →"`, `"Nový výdaj"`, `"Resetovat data prototypu"`, the Header `aria-label="Obnovit výchozí testovací data"`;
- drop the `Hotovo` / `Splněno` cleaning badge, the `Koupeno` cart badge, or the pending-swap badge;
- move `size-*`/`w-*`/`h-*` classes that specific tests pin.

Rule: **after any template or copy edit, run `npm test`.** A green build does not mean green tests.

### Other fragile points

- `T1.F11.x` runs `npm run build` (`execSync`) and asserts `dist/index.html`, a JS and a CSS asset exist. A broken build fails multiple tests.
- Tests assert exact numeric relationships in settlements, energy prediction, and cart totals — off-by-one rounding matters.
- `tests/m1-challenger.mjs` and `tests/m1-stress-harness.ts` are **auxiliary harnesses not wired into `package.json`**. Don't assume `npm test` covers them; don't delete them either.

---

## 9. Known issues / tech debt (do not "fix" blind)

1. **Hardcoded demo timeline** — `'2026-11'`, `'2026-10'`, `'2026-09'`, week `45`, due date `10. 11. 2026`, `variableSymbol = '20261101'`. Do not replace with `new Date()`; tests depend on the frozen timeline.
2. **`annualEnergyPrediction` mixes live inputs with literal consumption/rate constants** (intentional, documented inline).
3. **No lint/format config and no test CI** — only `release.yml` on `v*` tags. Don't add CI frameworks without being asked.
4. **`src-tauri/target/` is build output** (gitignored) — never read it, grep it, or "fix" anything inside it.
5. Legacy `(s.breakdown as any)` casts inside `addExpense` — leave unless you're refactoring that function.

---

## 10. Recipes

**Add a page**
`types/index.ts` → extend `PageId` · create `src/views/XView.vue` · `App.vue` → import + `switch` case + mobile nav `<button>` · `components/Sidebar.vue` → nav entry (icon from `lucide-vue-next`) · run `npm test`.

**Add a modal**
Add payload ref + `openModal` branch in the composable · create component with dialog a11y + Esc + backdrop close · mount in `App.vue` behind `v-if="activeModal === 'NEW'"` · confirm `closeModal()` clears any per-modal payload.

**Add a persisted slice**
`types/index.ts` interface · `mockData.ts` `INITIAL_X` · `ref(loadFromStorage('x', INITIAL_X))` at module level · `watch(x, v => saveToStorage('x', v), { deep: true })` · expose in the `return {}` · bump the storage prefix version if the shape replaces an existing key.

**Add an expense side effect**
Mutate `settlements` **and** `breakdown` **and** `status` **and** `shares` together (see §6), then toast. Mirror the rollback in `deleteExpense`.

**Add a meter type**
Extend `MeterType` · update unit mapping in `addMeterReading` · extend `MeterAddModal` options · extend `latestMeters`-consumers in `EnergyView` (labels, icons, history) · extend prediction if it feeds the forecast.

---

## 11. Git & PR workflow

Conventional Commits (documented in `CONTRIBUTING.md`): `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:` — messages are often Czech (`fix: oprava zaokrouhlovani v SPAYD retezci`), that is fine. Branches: `feat/…`, `fix/…`.

Pre-PR checklist (mirrors the PR template):

- [ ] `npm test` green
- [ ] `npm run build` green (no `vue-tsc` errors)
- [ ] branch rebased on `main`
- [ ] screenshots attached for UI changes

Governance files: `LICENSE` (MIT), `CODE_OF_CONDUCT.md` (Contributor Covenant), `CONTRIBUTING.md`, `.github/ISSUE_TEMPLATE/{bug_report,feature_request}.md`, `.github/PULL_REQUEST_TEMPLATE.md`.

---

## 12. Tauri notes

- `src-tauri/src/main.rs` is the stock 9-line builder — **no custom commands, no plugins, no IPC**. Frontend must stay web-only (no `@tauri-apps/api` calls currently in use, though the dep is installed).
- `tauri.conf.json`: `productName: "Spolubyt"`, `identifier: "cz.spolubyt.desktop"`, window 1280×840, min 900×650, `security.csp: null`, `frontendDist: "../dist"`, dev URL `http://localhost:5173`.
- `beforeDevCommand: npm run dev` — so the Vite port **must stay 5173 with `strictPort`**.
- Desktop work is optional; the browser experience is the primary deliverable. Don't require Rust to validate a change.

---

## 13. Guardrails for agents

**Do**
- Read `src/composables/useSpolubyt.ts` and `src/types/index.ts` before touching any domain logic.
- Keep logic in the composable, rendering in views/components.
- Reuse `showToast` / `requestConfirmation` / `openModal` instead of inventing parallel UX.
- Write Czech copy that names the entity and amount.
- Run `npm test` after template/label/class changes, and `npm run build` always.

**Don't**
- Don't add a backend, router, store library, lint config, or test framework.
- Don't move module-level state inside `useSpolubyt()`.
- Don't touch `src-tauri/target/`, `dist/`, or committed icons.
- Don't change `localStorage` keys/shapes without a version bump.
- Don't replace the frozen 2026 demo dates with real dates.
- Don't restyle the palette away from slate/emerald, and don't add `dark:` variants.
- Don't rename UI strings or layout utility classes casually — tests read the source.
- Don't remove the QR canvas DPI/`removeProperty` logic or the confetti calls.
- Don't commit secrets; the project has none and needs none.
