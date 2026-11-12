#!/usr/bin/env node
// Query a local LM Studio server (OpenAI-compatible API).
//
// Usage:
//   node query.mjs --file /tmp/prompt.txt
//   node query.mjs --list
//   node query.mjs --file /tmp/prompt.txt --model qwen/qwen3.5-9b
//
// Env:
//   LMSTUDIO_URL     default http://localhost:1234/v1
//   LMSTUDIO_MODEL   default qwen/qwen3.5-9b

import { readFile } from 'node:fs/promises'

const DEFAULTS = {
  url: process.env.LMSTUDIO_URL || 'http://localhost:1234/v1',
  model: process.env.LMSTUDIO_MODEL || 'qwen/qwen3.5-9b',
  temperature: 0.7,
}

function parseArgs(argv) {
  const opts = { ...DEFAULTS, list: false, help: false, allowRemote: false, file: null }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--file') opts.file = argv[++i]
    else if (a === '--allow-remote') opts.allowRemote = true
    else if (a === '--list') opts.list = true
    else if (a === '--model') opts.model = argv[++i]
    else if (a === '--temperature') opts.temperature = Number(argv[++i])
    else if (a === '--url') opts.url = argv[++i]
    else if (a === '--help' || a === '-h') opts.help = true
    else throw new Error(`Unknown argument: ${a}. Use --file or stdin for prompts.`)
  }
  if (opts.file === undefined) throw new Error('--file requires a path')
  if (!Number.isFinite(opts.temperature)) throw new Error('Invalid temperature')
  return opts
}

function usage() {
  console.error('Usage: node query.mjs [--file path] [--model id] [--temperature n] [--url base] [--allow-remote] (prompt from stdin otherwise)')
  console.error('       node query.mjs --list')
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  if (opts.help) {
    usage()
    return
  }

  const endpoint = new URL(opts.url)
  if (!['http:', 'https:'].includes(endpoint.protocol) || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) throw new Error('Unsupported API URL')
  if (!opts.allowRemote && !['localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname)) throw new Error('Remote API requires explicit --allow-remote')
  const base = endpoint.href.replace(/\/+$/, '')
  const request = (url, init = {}) => fetch(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(30_000) })

  if (opts.list) {
    const res = await request(`${base}/models`)
    if (!res.ok) throw new Error(`GET /models failed: ${res.status} ${await res.text()}`)
    const data = await res.json()
    const ids = (data.data ?? []).map((m) => m.id)
    if (ids.length === 0) console.error('No models reported by the server.')
    for (const id of ids) console.log(id)
    return
  }

  if (opts.file) opts.prompt = await readFile(opts.file, 'utf8')
  else {
    if (process.stdin.isTTY) throw new Error('Provide a prompt through --file or stdin')
    const chunks = []
    for await (const chunk of process.stdin) chunks.push(chunk)
    opts.prompt = Buffer.concat(chunks).toString('utf8')
  }
  if (!opts.prompt.trim()) {
    usage()
    process.exitCode = 2
    return
  }

  const res = await request(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: opts.model,
      messages: [{ role: 'user', content: opts.prompt }],
      temperature: opts.temperature,
    }),
  })
  if (!res.ok) throw new Error(`POST /chat/completions failed: ${res.status} ${await res.text()}`)

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content
  if (typeof text !== 'string') throw new Error('Response contained no message content')
  console.log(text)
}

main().catch((err) => {
  console.error(`error: ${err.message}`)
  process.exitCode = 1
})