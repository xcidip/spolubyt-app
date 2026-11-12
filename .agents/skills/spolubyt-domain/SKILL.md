---
name: spolubyt-domain
description: Implement or fix Spolubyt store behavior, expense/settlement coupling, cart conversion, cleaning transfers, meters, or localStorage persistence. Use for domain changes in this repository, not presentation-only edits.
---

# Spolubyt domain changes

Read repository `AGENTS.md`, `src/types/index.ts`, and `src/composables/useSpolubyt.ts` before editing domain logic. All project paths below are relative to the repository root. Inspect the current implementation and tests; historical summaries in the manual can lag behind code.

Keep shared state as module-level refs in the singleton composable, derived values as computeds, and domain types in `src/types/index.ts`. Reuse `src/utils/` helpers. Preserve the offline prototype, simulated personas, and frozen November 2026 timeline. Use `DEMO_TODAY` from mock data for scenario date limits. Authorization depends on `Správce`, not a hardcoded persona ID; guard store actions even if the UI hides controls.

## Financial changes

- Read `applyExpenseDebt`, `managerRoommate`, `addExpense`, `deleteExpense`, and `confirmPayment` together. Settlements currently represent debts to the manager's flat account. Member-paid expenses must not alter these settlements or be marked paid by flat-account confirmation.
- Preserve paired add/delete effects on debt, category breakdown, status, and affected shares. Reuse `roundMoney` and `splitAmount`; check cent precision for amounts not evenly divisible among participants.
- Categories map to buckets: `Bydlení → rent`, `Energie → energy`, `Drogerie → drogerie`, remaining categories `→ other`. Check overdue and zero-debt transitions.
- Cart conversion removes only explicitly transferred IDs on successful creation. Opening or cancelling a prefilled expense leaves the cart intact. Inspect the purchased-item gate and receipt totals at the caller too.
- For coupling changes, cover deletion before payment, deletion after payment, and member-paid expenses. Preserve the imperative model unless the task explicitly changes it.

## Cleaning and energy changes

- Cleaning swaps are one-way transfers. Inspect request/accept/reject/cancel together. Assignee or manager can complete/request; target or manager can accept/reject; requester or manager can cancel. Preserve self-transfer rejection, pending-request protection, completed-shift guards, and cancellation on completion.
- Preserve week bounds 1–53, deterministic rotation from week 45 (`2026-11-02`), and idempotent generation when revisiting a week.
- Meter input rejects non-finite, negative, decreasing, out-of-order, and future readings without mutation. Verify units and delta against the latest reading of the same type. Latest deletion requires confirmation.
- Read `annualEnergyPrediction` arithmetic comments before editing. Its literal consumption/rate inputs are deliberate; preserve monthly-advance reactivity and risk thresholds unless the requested model changes.

## Persistence changes

Inspect `defaults`, `readSnapshot`, `saveToStorage`, the combined deep watcher, `resetDemoData`, and `src/utils/storage.ts` together. A persisted addition needs a module-level ref, default, validator, snapshot field, reset behavior, and store export. Keep modal payloads, filters, navigation, toasts, and confirmations transient.

Preserve whole-snapshot recovery, atomic writes, write-failure flags, and stale-tab protection. Do not save expenses separately from their debt changes. A persisted-shape change requires a storage-prefix increment and major app bump under `AGENTS.md`; verify old/invalid snapshots, reload, reset, and conflicts. Keep the store importable through Node/Vite SSR without a real DOM.

## Finish

Use Czech contextual toasts and shared confirmation for destructive operations. Recheck permissions in deferred callbacks when relevant. Add focused behavior regressions in the existing harness, including rejected actions leaving state untouched. Apply the required version bump and run `npm test && npm run build`.
