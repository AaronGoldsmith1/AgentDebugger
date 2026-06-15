const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

const DEFAULT_TASK =
  "Add a backward-compatible `durationSeconds` metadata field to the Fox Local mobile video API response and open a mock PR.";

const DEFAULT_BREAKPOINTS = {
  afterPlan: true,
  pauseAfterLlm: false,
  beforeFileWrite: true,
  beforeGithubMutation: true,
  beforeShellCommand: false,
};

async function parseJson(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }
  return data;
}

export async function getHealth() {
  const response = await fetch(`${API_BASE}/health`);
  return parseJson(response);
}

export async function createSession(body = {}) {
  const response = await fetch(`${API_BASE}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      task: DEFAULT_TASK,
      agentMode: "scripted",
      ...body,
    }),
  });
  return parseJson(response);
}

export async function getSession(sessionId) {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}`);
  return parseJson(response);
}

export async function startSession(sessionId, body = {}) {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseJson(response);
}

export async function resumeSession(sessionId) {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/resume`, {
    method: "POST",
  });
  return parseJson(response);
}

export async function stepSession(sessionId) {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/step`, {
    method: "POST",
  });
  return parseJson(response);
}

export async function rejectSession(sessionId, reason) {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  return parseJson(response);
}

export async function updateBreakpoints(sessionId, breakpoints) {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/breakpoints`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(breakpoints),
  });
  return parseJson(response);
}

export async function setExecutionControl(sessionId, executionControl) {
  const response = await fetch(
    `${API_BASE}/sessions/${sessionId}/execution-control`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ executionControl }),
    }
  );
  return parseJson(response);
}

export async function editPaused(sessionId, body) {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/edit-paused`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseJson(response);
}

export async function editToolCall(sessionId, args) {
  const response = await fetch(
    `${API_BASE}/sessions/${sessionId}/edit-tool-call`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ args }),
    }
  );
  return parseJson(response);
}

export async function resetSession(sessionId) {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/reset`, {
    method: "POST",
  });
  return parseJson(response);
}

export { DEFAULT_TASK, DEFAULT_BREAKPOINTS };
