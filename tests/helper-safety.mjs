import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const dir = await mkdtemp(path.join(tmpdir(), 'spolubyt-helper-'))
const script = path.resolve('.agents/skills/lm-studio-qwen/query.mjs')
try {
  const prompt = 'Literal $(touch /tmp/never-execute-this) `echo injected` $HOME\nSecond line'
  const file = path.join(dir, 'prompt.txt')
  const mock = path.join(dir, 'mock-fetch.mjs')
  await writeFile(file, prompt)
  await writeFile(mock, `globalThis.fetch = async (_url, options) => {
    if (options.redirect !== 'error' || !options.signal) throw new Error('Missing request limits')
    return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.parse(options.body).messages[0].content } }] }) }
  }`)
  const run = (args, input) => spawnSync(process.execPath, ['--import', mock, script, ...args], { encoding: 'utf8', input, timeout: 5000 })
  for (const [args, input] of [[['--file', file], undefined], [[], prompt]]) {
    const result = run(args, input)
    assert.equal(result.status, 0, result.stderr)
    assert.equal(result.stdout.trimEnd(), prompt)
  }
  const remote = run(['--url', 'http://example.com/v1', '--file', file])
  assert.equal(remote.status, 1)
  assert.match(remote.stderr, /requires explicit --allow-remote/)
  const approved = run(['--url', 'https://example.com/v1', '--allow-remote', '--file', file])
  assert.equal(approved.status, 0, approved.stderr)
  assert.equal(approved.stdout.trimEnd(), prompt)
  console.log('Helper safety: file/stdin preserve literal prompts; remote endpoint requires explicit opt-in (4 checks passed)')
} finally {
  await rm(dir, { recursive: true })
}
