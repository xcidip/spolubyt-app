---
name: spolubyt-release
description: Synchronize Spolubyt app versions and prepare or verify release readiness with existing scripts and the Tauri workflow. Use for version bumps and release preparation; publishing requires user authorization.
---

# Spolubyt version and release preparation

Read repository `AGENTS.md` section 3.1, `scripts/check-release.mjs`, and, for releases, `.github/workflows/release.yml`. Inspect the current diff/version rather than using documentation literals. All paths and commands below are relative to the repository root.

## Synchronize one version per change set

Behavior, UI, visible copy, and persisted-shape changes need an app bump. Documentation-only changes do not. Dependency-only changes need a patch only if app behavior changes. Follow repository semver: fixes use patch, features use minor, and breaking changes such as storage-prefix changes use major. Honor a user-specified version or surface a concrete inconsistency.

| File | Field |
| --- | --- |
| `package.json` | `version` |
| `package-lock.json` | top-level `version` and `packages[""].version` |
| `src-tauri/tauri.conf.json` | `version` |
| `src-tauri/Cargo.toml` | `[package]` version |
| `src-tauri/Cargo.lock` | version in the `spolubyt-app` package entry |
| `src/components/Sidebar.vue` | visible `Verze prototypu:` literal |

Use focused edits; preserve dependency versions in lockfiles. `npm version` alone misses Rust/config/sidebar fields and may introduce an unwanted commit/tag. Rust is not required for version-only preparation. Persisted-shape changes also require the actual storage-prefix transition in `AGENTS.md`.

Run `node scripts/check-release.mjs`, then inspect all six files, including the exact visible Sidebar literal: the script's Sidebar check only tests substring inclusion. If `GITHUB_REF` is present, it must match `refs/tags/v<version>`; explain a mismatch rather than hiding a real release error.

## Prepare a reviewable release

Run `npm test && npm run build`. Generate release notices with existing `scripts/license-notices.mjs` and Rust `cargo-about` configuration, reading the workflow for the pinned generator version and arguments. Put disposable verification notices under `/tmp`. Do not require Rust installation or desktop bundling to validate frontend work.

Pushed `v*` tags trigger the workflow, desktop builds, notices, and a draft release. A local web build does not prove packaged desktop behavior. Preserve the passive Tauri shell, Vite port 5173, and ignored generated directories.

Report version synchronization, check results, and remaining platform verification. Preparing files does not authorize tag pushes, publishing, or merging. Perform external actions only when authorized by the user's request; do not invent another approval step if authorization already exists.
