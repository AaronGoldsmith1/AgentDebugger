# Agent Debugger

A local prototype debugger for LLM-powered coding agents. Pause before risky tool calls, step through execution, edit prompts and tool I/O at breakpoints, then continue or reject.

Inspired by [AgentStepper](https://github.com/sola-st/AgentStepper): the model proposes actions, the runtime executes them — with breakpoints in between.

## Quick start

**Terminal 1 — backend**

```bash
cd backend
cp .env.example .env   # optional: add OPENAI_API_KEY for OpenAI mode
npm install
npm run dev
```

API runs at `http://localhost:3001`.

**Terminal 2 — frontend**

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Demo flow (scripted mode)

1. Leave **Scripted demo** selected (no API key required).
2. Click **Start agent**.
3. Agent pauses at breakpoints (after plan, before file write, before GitHub PR).
4. Use **▶ Continue** or transport controls to proceed; **Reject** to send feedback into the loop.
5. Toggle **Step** mode to pause after each LLM response and tool result.
6. Click **Reset demo** to clear the timeline and run again.

## OpenAI mode

Set `OPENAI_API_KEY` in `backend/.env`. Switch agent mode to **OpenAI agent** before starting.

## Controls

| Control | Action |
|---------|--------|
| ▶ Play | Continue until next breakpoint |
| ⏸ Pause | Active when paused; switches to Step mode when idle |
| ⏭ | Step one atomic beat (Step mode) |
| ⏮ | Browse previous timeline event (inspect only) |
| Space | Play (when paused) |
| ← / → | Timeline back / forward (→ steps agent in Step mode) |

## Breakpoints

- **After plan** — pause before the first tool call
- **Pause after each LLM** — extra pause in Run mode
- **Before file write** — pause before `filesystem.writeFile`
- **Before GitHub mutation** — pause before PR creation
- **Before shell command** — pause before shell tools

## Project structure

```
backend/     Express API, agent loop, mock tools
frontend/    React UI, timeline, debugger controls
plan.md      Full spec and phased roadmap
```

## Post-MVP (see plan.md)

- **Phase 2:** Real local filesystem + in-app diff
- **Phase 2b:** GitHub MCP interception
- **State rewind:** Checkpoint and restore agent state to prior steps
