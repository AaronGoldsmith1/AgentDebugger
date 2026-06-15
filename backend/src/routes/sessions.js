import { randomUUID } from "node:crypto";
import { Router } from "express";
import { applyPauseEdits, resolvePause } from "../agent/pauseHandler.js";
import { runAgentLoop } from "../agent/runAgentLoop.js";
import {
  rejectScriptedTool,
  resumeScriptedTool,
  runScriptedAgent,
} from "../agent/runScriptedAgent.js";
import {
  executeEditedTool,
  rejectPausedTool,
} from "../agent/toolFlow.js";
import {
  createSession,
  getSession,
  toPublicSession,
  touchSession,
} from "../store/sessions.js";

const router = Router();

function prepareSessionForStart(session) {
  session.events = [];
  session.messages = [];
  session.toolCallsExecuted = 0;
  session.scriptStep = 0;
  session.scriptAwaitingTool = false;
  session.pausedToolCall = null;
  session.pauseContext = null;
  session.finalAnswer = null;
  session.fileCache = {};
  session.diffPreview = null;
  touchSession(session);
}

function handleLoopError(session, err) {
  session.status = "error";
  session.events.push({
    id: randomUUID(),
    type: "error",
    message: err.message || "Agent loop failed",
    createdAt: new Date().toISOString(),
  });
  touchSession(session);
}

function startAgentLoop(session) {
  const runner =
    session.agentMode === "scripted" ? runScriptedAgent : runAgentLoop;

  runner(session).catch((err) => handleLoopError(session, err));
}

async function continueSession(session, mode) {
  if (session.agentMode === "scripted") {
    await resumeScriptedTool(session, mode);
  } else {
    await resolvePause(session, mode);
  }

  if (session.status === "running") {
    startAgentLoop(session);
  }
}

router.post("/", (req, res) => {
  const session = createSession(req.body ?? {});
  res.status(201).json({ sessionId: session.id });
});

router.get("/:id", (req, res) => {
  const session = getSession(req.params.id);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  res.json(toPublicSession(session));
});

router.post("/:id/breakpoints", (req, res) => {
  const session = getSession(req.params.id);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  session.breakpoints = { ...session.breakpoints, ...req.body };
  touchSession(session);

  res.json({ breakpoints: session.breakpoints });
});

router.post("/:id/execution-control", (req, res) => {
  const session = getSession(req.params.id);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  const mode = req.body?.executionControl;
  if (mode !== "run" && mode !== "step") {
    return res.status(400).json({ error: "executionControl must be run or step" });
  }

  session.executionControl = mode;
  touchSession(session);

  res.json({ executionControl: session.executionControl });
});

router.post("/:id/filesystem-backend", (req, res) => {
  const session = getSession(req.params.id);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  if (session.status === "running") {
    return res
      .status(409)
      .json({ error: "Cannot change filesystem backend while running" });
  }

  const backend = req.body?.filesystemBackend;
  if (backend !== "mock" && backend !== "real") {
    return res
      .status(400)
      .json({ error: "filesystemBackend must be mock or real" });
  }

  session.filesystemBackend = backend;
  touchSession(session);

  res.json({ filesystemBackend: session.filesystemBackend });
});

router.post("/:id/github-backend", (req, res) => {
  const session = getSession(req.params.id);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  if (session.status === "running") {
    return res
      .status(409)
      .json({ error: "Cannot change GitHub backend while running" });
  }

  const backend = req.body?.githubBackend;
  if (backend !== "mock" && backend !== "mcp") {
    return res.status(400).json({ error: "githubBackend must be mock or mcp" });
  }

  session.githubBackend = backend;
  touchSession(session);

  res.json({ githubBackend: session.githubBackend });
});

router.post("/:id/start", (req, res) => {
  const session = getSession(req.params.id);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  if (session.status === "running") {
    return res.status(409).json({ error: "Agent loop already running" });
  }

  if (session.status !== "idle" && session.status !== "complete" && session.status !== "error") {
    return res
      .status(409)
      .json({ error: `Cannot start agent while status is ${session.status}` });
  }

  if (req.body?.executionControl) {
    session.executionControl = req.body.executionControl;
  }

  prepareSessionForStart(session);
  session.status = "running";
  touchSession(session);
  startAgentLoop(session);

  res.json({ status: "running" });
});

router.post("/:id/resume", async (req, res) => {
  const session = getSession(req.params.id);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  if (session.status !== "paused") {
    return res.status(409).json({ error: "Session is not paused" });
  }

  try {
    await continueSession(session, "run");
    res.json({ status: session.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/step", async (req, res) => {
  const session = getSession(req.params.id);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  if (session.status !== "paused") {
    return res.status(409).json({ error: "Session is not paused" });
  }

  try {
    session.executionControl = "step";
    await continueSession(session, "step");
    res.json({
      status: session.status,
      pauseContext: session.pauseContext,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/reject", async (req, res) => {
  const session = getSession(req.params.id);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  if (session.status !== "paused") {
    return res.status(409).json({ error: "Session is not paused" });
  }

  if (session.pauseContext?.kind !== "tool_before") {
    return res
      .status(409)
      .json({ error: "Reject is only available before a tool runs" });
  }

  try {
    if (session.agentMode === "scripted") {
      await rejectScriptedTool(session, req.body?.reason);
    } else {
      await rejectPausedTool(session, req.body?.reason);
    }
    startAgentLoop(session);

    res.json({ status: session.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/edit-paused", async (req, res) => {
  const session = getSession(req.params.id);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  if (session.status !== "paused") {
    return res.status(409).json({ error: "Session is not paused" });
  }

  try {
    await applyPauseEdits(session, req.body ?? {});
    res.json({
      pauseContext: session.pauseContext,
      pausedToolCall: session.pausedToolCall,
      diffPreview: session.diffPreview,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/edit-tool-call", async (req, res) => {
  const session = getSession(req.params.id);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  if (session.status !== "paused") {
    return res.status(409).json({ error: "Session is not paused" });
  }

  if (session.pauseContext?.kind !== "tool_before") {
    return res
      .status(409)
      .json({ error: "Can only edit tool args before execution" });
  }

  try {
    await executeEditedTool(session, req.body?.args ?? {});
    startAgentLoop(session);
    res.json({ status: session.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/reset", (req, res) => {
  const session = getSession(req.params.id);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  if (session.status === "running") {
    return res
      .status(409)
      .json({ error: "Cannot reset while the agent is running" });
  }

  prepareSessionForStart(session);
  session.status = "idle";
  touchSession(session);

  res.json({ status: "idle" });
});

export default router;
