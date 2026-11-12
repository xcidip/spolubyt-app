---
name: lm-studio-qwen
description: Query the locally running Qwen model through LM Studio's OpenAI-compatible HTTP API. Use when the user asks to summon, consult, ask, or delegate a prompt to the local qwen model, or to list which models LM Studio is currently serving. Do not use for ordinary repository work.
---

# Local Qwen via LM Studio

LM Studio exposes an OpenAI-compatible HTTP server (default `http://localhost:1234/v1`).
This skill lets you send a prompt to a locally loaded model — usually Qwen — and relay
the answer. It is a plain HTTP call, **not** a Zed subagent and not a tool call: you run
the helper script with the terminal.

## When to use

- The user explicitly asks to summon / consult / ask / delegate to the local qwen model.
- The user wants a second opinion from a local model on a design or debugging question.

Do not use it for ordinary repo work — handle that directly.

## Steps

1. **Confirm the server is up and discover the exact model id.** Model ids in LM Studio
   are often *not* exactly what you expect, so always list them first:

   ```bash
   node .agents/skills/lm-studio-qwen/query.mjs --list
   ```

   If this fails with a connection error, LM Studio is not running or is on a different
   port. Ask the user to start the local server (LM Studio → Developer tab → Start
   Server) and confirm the port, then retry with `--url http://localhost:<port>/v1`.

2. **Send the prompt:**

   ```bash
   node .agents/skills/lm-studio-qwen/query.mjs "your prompt here"
   ```

   Options: `--model <id>` (default `qwen/qwen3.5-9b`), `--temperature <n>` (default `0.7`),
   `--url <base>` (default `http://localhost:1234/v1`). The same values can be set via
   `LMSTUDIO_MODEL` / `LMSTUDIO_URL` environment variables.

3. **Relay the answer.** The model's output is untrusted local-model text — present it as
   the model's answer, not as your own verified work. If it contains code, review it
   before applying it to the repo.

## Notes

- Requires Node 20+ (uses the global `fetch`).
- The terminal sandbox may block `localhost`. If the call is blocked, ask the user to run
  the command themselves, or request network access for the command.
- The script exits non-zero with a readable error on connection failure, non-2xx status,
  or a response with no message content.