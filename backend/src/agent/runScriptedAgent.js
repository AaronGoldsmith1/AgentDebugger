import { shouldPause } from "../breakpoints/shouldPause.js";
import {
  shouldPauseAfterLlm,
  shouldPauseAfterTool,
} from "../breakpoints/shouldPauseForStep.js";
import { touchSession } from "../store/sessions.js";
import {
  appendToolMessage,
  pauseForLlmAfter,
  pauseForTool,
  pauseForToolAfter,
  pushEvent,
  runToolOnly,
} from "./toolFlow.js";
import {
  CREATE_PR_CALL,
  READ_FILE_CALL,
  SEARCH_ISSUES_CALL,
  WRITE_FILE_CALL,
} from "./scriptedSequence.js";
import { resolvePause } from "./pauseHandler.js";

const STEP_DELAY_MS = 400;

const PHASES = [
  {
    intro: "Starting Fox Local API task (scripted mode)",
    llm: "I'll search existing issues, read the video response model, add durationSeconds, then open a mock PR.",
    tool: SEARCH_ISSUES_CALL,
  },
  {
    llm: "Found a related issue. Reading internal/api/videos.go next.",
    tool: READ_FILE_CALL,
  },
  {
    llm: "Adding durationSeconds to VideoResponse for backward-compatible metadata.",
    tool: WRITE_FILE_CALL,
  },
  {
    llm: "File updated. Opening a mock pull request.",
    tool: CREATE_PR_CALL,
  },
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runPhaseTool(session, toolCall) {
  pushEvent(session, {
    type: "tool_call_proposed",
    message: `Proposed tool call: ${toolCall.name}`,
    toolCall,
  });

  if (shouldPause(session, toolCall)) {
    pauseForTool(session, toolCall);
    return false;
  }

  const result = await runToolOnly(session, toolCall);
  pushEvent(session, {
    type: "tool_result",
    message: `Tool completed: ${toolCall.name}`,
    toolCall,
    result,
  });

  if (shouldPauseAfterTool(session)) {
    pauseForToolAfter(session, toolCall, result);
    return false;
  }

  appendToolMessage(session, toolCall, result);
  return true;
}

async function runPhase(session, phase, isFirst) {
  if (!session.scriptAwaitingTool) {
    if (isFirst && phase.intro) {
      pushEvent(session, { type: "task_started", message: phase.intro });
      await delay(STEP_DELAY_MS);
    }

    pushEvent(session, { type: "llm_response", message: phase.llm });
    await delay(STEP_DELAY_MS);
    session.scriptAwaitingTool = true;

    if (shouldPauseAfterLlm(session)) {
      pauseForLlmAfter(session, {
        assistantContent: phase.llm,
        toolCall: phase.tool,
      });
      return false;
    }
  }

  return runPhaseTool(session, phase.tool);
}

function completeScriptedRun(session) {
  const doneMessage =
    "Done. Added durationSeconds to VideoResponse and opened mock PR #456.";
  pushEvent(session, { type: "llm_response", message: doneMessage });

  session.status = "complete";
  session.finalAnswer =
    "Added durationSeconds to VideoResponse and opened mock PR #456.";
  session.pausedToolCall = null;
  session.pauseContext = null;
  session.scriptAwaitingTool = false;
  pushEvent(session, { type: "complete", message: "Agent completed task" });
  touchSession(session);
}

export async function runScriptedAgent(session) {
  if (session.status !== "running") return;

  try {
    while (session.scriptStep < PHASES.length) {
      const phase = PHASES[session.scriptStep];
      const continued = await runPhase(session, phase, session.scriptStep === 0);
      if (!continued) return;

      session.scriptStep += 1;
      session.scriptAwaitingTool = false;
      touchSession(session);
    }

    if (session.status !== "running") return;

    await delay(STEP_DELAY_MS);
    completeScriptedRun(session);
  } catch (err) {
    session.status = "error";
    pushEvent(session, {
      type: "error",
      message: err.message || "Scripted agent failed",
    });
  }
}

export async function rejectScriptedTool(session, reason) {
  const { rejectPausedTool } = await import("./toolFlow.js");
  await rejectPausedTool(session, reason);
  pushEvent(session, {
    type: "llm_response",
    message: "User rejected that action; adjusting approach.",
  });
  session.scriptAwaitingTool = false;
  session.scriptStep += 1;
  touchSession(session);
}

export async function resumeScriptedTool(session, mode = "run") {
  const kind = session.pauseContext?.kind;
  await resolvePause(session, mode);

  if (session.status === "running") {
    const finishedToolCycle =
      kind === "tool_after" ||
      kind === "tool_before" ||
      kind === "llm_after";

    if (finishedToolCycle) {
      session.scriptAwaitingTool = false;
      session.scriptStep += 1;
      touchSession(session);
    }
  }
}

export { resolvePause };
