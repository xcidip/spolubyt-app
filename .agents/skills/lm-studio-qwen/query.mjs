#!/usr/bin/env node
// Query a local LM Studio server (OpenAI-compatible API).
//
// Usage:
//   node query.mjs "your prompt"
//   node query.mjs --list
//   node query.mjs "prompt" --model qwen/qwen3.5-9b --temperature 0.7 --url http://localhost:1234/v1
//
// Env:
//   LMSTUDIO_URL     default http://localhost:1234/v1
//   LMSTUDIO_MODEL   default qwen/qwen3.5-9b

const DEFAULTS = {
  url: process.env.LMSTUDIO_URL || 'http://localhost:1234/v1',
  model: process.env.LMSTUDIO_MODEL || 'qwen/qwen3.5-9b',
  temperature: 0.7,
}

function parseArgs(argv) {
  const opts = { ...DEFAULTS, list: false, help: false }
  const words = []
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--list') opts.list = true
    else if (a === '--model') opts.model = argv[++i]
    else if (a === '--temperature') opts.temperature = Number(argv[++i])
    else if (a === '--url') opts.url = argv[++i]
    else if (a === '--help' || a === '-h') opts.help = true
    else words.push(a)
  }
  opts.prompt = words.join(' ').trim()
  return opts
}

function usage() {
  console.error('Usage: node query.mjs "prompt" [--model id] [--temperature n] [--url base]')
  console.error('       node query.mjs --list')
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  if (opts.help) {
    usage()
    return
  }

  const base = opts.url.replace(/\/+$/, '')

  if (opts.list) {
    const res = await fetch(`${base}/models`)
    if (!res.ok) throw new Error(`GET /models failed: ${res.status} ${await res.text()}`)
    const data = await res.json()
    const ids = (data.data ?? []).map((m) => m.id)
    if (ids.length === 0) console.error('No models reported by the server.')
    for (const id of ids) console.log(id)
    return
  }

  if (!opts.prompt) {
    usage()
    process.exitCode = 2
    return
  }

  const res = await fetch(`${base}/chat/completions`, {
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