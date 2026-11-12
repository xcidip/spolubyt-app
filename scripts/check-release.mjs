import fs from 'node:fs'
const read = path => fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8')
const pkg = JSON.parse(read('package.json'))
const lock = JSON.parse(read('package-lock.json'))
const tauri = JSON.parse(read('src-tauri/tauri.conf.json'))
const cargo = read('src-tauri/Cargo.toml').match(/^version = "([^"]+)"/m)?.[1]
const cargoLock = read('src-tauri/Cargo.lock').match(/name = "spolubyt-app"\nversion = "([^"]+)"/)?.[1]
const sidebar = read('src/components/Sidebar.vue')
const versions = [lock.version, lock.packages[''].version, tauri.version, cargo, cargoLock]
if (!versions.every(version => version === pkg.version) || !sidebar.includes(pkg.version)) throw new Error('App versions are not synchronized')
if (process.env.GITHUB_REF && process.env.GITHUB_REF !== `refs/tags/v${pkg.version}`) throw new Error('Release tag does not match app version')
console.log(`Release versions verified: ${pkg.version}`)
