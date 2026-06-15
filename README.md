# Agent Debugger

A local prototype debugger for LLM-powered coding agents. Pause before risky tool calls, step through execution, edit prompts and tool I/O at breakpoints, then continue or reject.

Inspired by [AgentStepper](https://github.com/sola-st/AgentStepper): the model proposes actions, the runtime executes them — with breakpoints in between.

## Quick start

**Terminal 1 — backend**

```bash
cd backend
cp .env.example .env
npm install
node server.js
```

API runs at `http://localhost:3001`. Use `node server.js` if `npm run dev` hits file-watcher limits.

**Terminal 2 — frontend**

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Demo flow (scripted mode)

1. Leave **Scripted demo** selected (no API key required).
2. Optional: **Filesystem → Real**, **GitHub → Mock** for local file diff demo.
3. Click **Start agent**.
4. Agent pauses at breakpoints (after plan, before file write, before GitHub PR).
5. Use **▶ Continue** or transport controls; **Reject** to send feedback into the loop.
6. **Reset demo** to clear the timeline and run again.

## OpenAI mode

Set `OPENAI_API_KEY` in `backend/.env`. Switch agent mode to **OpenAI agent** before starting.

## Real filesystem (Phase 2)

```env
WORKSPACE_ROOT=/absolute/path/to/your/cloned-repo
SCRIPTED_READ_PATH=README.md
SCRIPTED_WRITE_PATH=README.md
```

1. Set **Filesystem → Real** in the UI.
2. Run scripted demo — reads/writes paths under your clone.
3. At the **before file write** breakpoint, **DiffPanel** shows before vs proposed content.

**Smoke test (dry run, no write):**

```bash
cd backend && node server.js
# other terminal:
npm run smoke:phase2
```

Paths are sandboxed under `WORKSPACE_ROOT`.

## GitHub MCP (Phase 2b)

```env
GITHUB_TOKEN=ghp_...
GITHUB_OWNER=your-user-or-org
GITHUB_REPO=your-repo
GITHUB_MCP_COMMAND=npx
GITHUB_MCP_ARGS=-y,@modelcontextprotocol/server-github
```

1. Set **GitHub → MCP** in the UI (health check shows MCP status).
2. Breakpoints still pause **before** `search_issues` / `create_pull_request`.
3. Continue runs the real MCP call after approval.

Use **Mock** for presentations without a token. `GET /health` returns `githubMcp.available`.

**Note:** `create_pull_request` requires `head` to exist on GitHub — push a branch first for live PR demos.

## Controls

| Control | Action |
|---------|--------|
| ▶ Play | Continue until next breakpoint |
| ⏸ Pause | Active when paused; switches to Step mode when idle |
| ⏭ | Step one atomic beat (Step mode) |
| ⏮ | Browse previous timeline event (inspect only) |

## Project structure

```
backend/     Express API, agent loop, mock + real tools, MCP client
frontend/    React UI, timeline, debugger controls, diff panel
plan.md      Full spec and phased roadmap
```

## Deferred (see plan.md)

| Phase | When | What |
|-------|------|------|
| **3** (Day 14) | Next | `llm_before` — edit messages before each LLM call |
| **4** (Day 15) | After 3 | State rewind — checkpoint/restore agent state |
| **5** (Day 16) | After 4 | Presentation rehearsal |
| **6** | Last | SSE instead of polling; export event trace |

**Not planned:** real/sandboxed `shell.run` (stays mock).
