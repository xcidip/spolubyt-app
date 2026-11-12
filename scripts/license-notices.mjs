import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const lock = JSON.parse(await fs.readFile(path.join(root, 'package-lock.json'), 'utf8'))
const notices = ['Spolubyt – third-party frontend and font notices', await fs.readFile(path.join(root, 'LICENSE'), 'utf8')]
for (const [location, metadata] of Object.entries(lock.packages)) {
  if (!location || metadata.dev) continue
  const folder = path.join(root, location)
  const files = (await fs.readdir(folder)).filter(name => /^(licen[sc]e|copying|notice)(\.|$|-)/i.test(name))
  if (!files.length) throw new Error(`Missing license text: ${location}`)
  notices.push(`\n${location} ${metadata.version} (${metadata.license || 'see license text'})\n`)
  for (const name of files) {
    const file = path.join(folder, name)
    if ((await fs.stat(file)).isFile()) notices.push(await fs.readFile(file, 'utf8'))
  }
}
for (const name of ['jakarta-OFL.txt', 'jetbrains-OFL.txt']) notices.push(await fs.readFile(path.join(root, 'public/fonts', name), 'utf8'))
const output = process.argv[2]
if (!output) throw new Error('Usage: node scripts/license-notices.mjs output.txt')
await fs.writeFile(output, notices.join('\n\n'))
console.log(`Frontend notices generated: ${output}`)
