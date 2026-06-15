import { randomUUID } from "node:crypto";

const sessions = new Map();

const DEFAULT_BREAKPOINTS = {
  afterPlan: true,
  pauseAfterLlm: false,
  beforeFileWrite: true,
  beforeGithubMutation: true,
  beforeShellCommand: false,
};

const DEFAULT_TASK =
  "Add a backward-compatible `durationSeconds` metadata field to the Fox Local mobile video API response and open a mock PR.";

export function createSession(input = {}) {
  const now = new Date().toISOString();
  const id = randomUUID();

  const session = {
    id,
    task: input.task ?? DEFAULT_TASK,
    status: "idle",
    messages: [],
    events: [],
    breakpoints: { ...DEFAULT_BREAKPOINTS, ...input.breakpoints },
    executionControl: input.executionControl === "step" ? "step" : "run",
    pausedToolCall: null,
    pauseContext: null,
    toolCallsExecuted: 0,
    agentMode: input.agentMode === "openai" ? "openai" : "scripted",
    filesystemBackend: input.filesystemBackend === "real" ? "real" : "mock",
    githubBackend: input.githubBackend === "mcp" ? "mcp" : "mock",
    fileCache: {},
    diffPreview: null,
    scriptStep: 0,
    scriptAwaitingTool: false,
    finalAnswer: null,
    createdAt: now,
    updatedAt: now,
  };

  sessions.set(id, session);
  return session;
}

export function getSession(id) {
  return sessions.get(id) ?? null;
}

export function toPublicSession(session) {
  return {
    id: session.id,
    task: session.task,
    status: session.status,
    breakpoints: session.breakpoints,
    events: session.events,
    pausedToolCall: session.pausedToolCall,
    pauseContext: session.pauseContext,
    diffPreview: session.diffPreview,
    executionControl: session.executionControl,
    agentMode: session.agentMode,
    filesystemBackend: session.filesystemBackend,
    githubBackend: session.githubBackend,
    finalAnswer: session.finalAnswer,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

export function touchSession(session) {
  session.updatedAt = new Date().toISOString();
}
