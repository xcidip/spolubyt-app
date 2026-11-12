---
name: spolubyt-testing
description: Run, diagnose, or extend Spolubyt's existing Node/Vite SSR suite and auxiliary harnesses. Use for test failures, regression coverage, or completion verification in this repository without introducing another test framework.
---

# Spolubyt regression verification

Read repository `AGENTS.md`, `package.json`, and the relevant part of `tests/e2e-suite.mjs`. Run commands from the repository root with Node 22+. Use the actual runner summary for counts rather than historical documentation.

The wired suite combines store behavior, raw Vue source assertions, and some SSR rendering checks. Its E2E name does not imply browser automation. Source checks cannot demonstrate rendered geometry, focus trapping, or canvas appearance.

Run the mandatory completion gate sequentially:

```bash
npm test && npm run build
```

The suite invokes a build internally; the explicit final build is still required. Capture summaries and exit codes. Do not concurrently run build-producing checks against the same output or hand-edit generated assets.

Use auxiliary checks when relevant:

| Scope | Additional command |
| --- | --- |
| Cart conversion, cleaning transfers, energy reactivity | `node tests/m1-challenger.mjs` |
| Stress behavior in those domains | `node tests/m1-challenger.mjs --stress` |
| Local Qwen helper argument/data handling | `node tests/helper-safety.mjs` |
| Version/release readiness | `node scripts/check-release.mjs` |

The TypeScript stress harness is loaded by challenger stress mode, not an npm script. Auxiliary checks do not run automatically under `npm test`.

## Add a meaningful regression

Reuse `test(id, title, tier, category, fn)` and existing assertions; match nearby IDs/categories. Inspect `getFreshStore()` for current singleton-reset, confirmation, and persona setup. Mock browser facilities before importing through Vite SSR rather than creating another store lifecycle.

For domain changes, assert observable before/after state, cross-slice relationships, and no mutation on rejection. Exercise store permission guards directly. For persistence, account for scheduled deep-watcher flushing and use fresh module loading when testing hydration.

For UI failures, distinguish a real source contract from an outdated implementation detail. Change assertions only when the requested requirement warrants it. Do not weaken unrelated checks or write tests that merely mirror new implementation wording.

Read the first failure and setup, reproduce the narrow path, and distinguish application defects from environment failures. Fix the cause, then rerun affected checks and the mandatory gate. Report exact blocked commands and unverified behavior. Once acceptance checks pass, stop unless new evidence warrants further work.
