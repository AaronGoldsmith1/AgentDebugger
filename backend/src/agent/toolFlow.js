import { randomUUID } from "node:crypto";
import { buildDiffPreview } from "../breakpoints/buildDiffPreview.js";
import { getPauseReason } from "../breakpoints/getPauseReason.js";
import { touchSession } from "../store/sessions.js";
import { runTool } from "../tools/runTool.js";

export function pushEvent(session, event) {
  session.events.push({
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...event,
  });
  touchSession(session);
}

function clearDiffPreview(session) {
  session.diffPreview = null;
}

export async function pauseForTool(session, toolCall) {
  session.status = "paused";
  session.pausedToolCall = toolCall;
  session.pauseContext = { kind: "tool_before", toolCall };

  if (toolCall.name === "filesystem.writeFile") {
    session.diffPreview = await buildDiffPreview(session, toolCall);
  } else {
    clearDiffPreview(session);
  }

  pushEvent(session, {
    type: "breakpoint_hit",
    message: getPauseReason(session, toolCall),
    toolCall,
  });
}

export function pauseForLlmAfter(session, { assistantContent, toolCall }) {
  session.status = "paused";
  session.pausedToolCall = toolCall;
  session.pauseContext = {
    kind: "llm_after",
    assistantContent,
    toolCall,
  };
  pushEvent(session, {
    type: "breakpoint_hit",
    message: "Paused after LLM response — review before next action",
    toolCall,
  });
}

export function pauseForToolAfter(session, toolCall, result) {
  session.status = "paused";
  session.pausedToolCall = toolCall;
  session.pauseContext = {
    kind: "tool_after",
    toolCall,
    result,
  };
  pushEvent(session, {
    type: "breakpoint_hit",
    message: `Paused after tool — review result from ${toolCall.name}`,
    toolCall,
    result,
  });
}

export async function runToolOnly(session, toolCall) {
  const result = await runTool(toolCall, session);
  session.toolCallsExecuted += 1;

  if (toolCall.name === "filesystem.readFile" && result.content != null) {
    session.fileCache[toolCall.args.path] = result.content;
  }

  return result;
}

export function appendToolMessage(session, toolCall, result) {
  session.messages.push({
    role: "tool",
    tool_call_id: toolCall.id,
    content: JSON.stringify(result),
  });
}

export async function executeTool(session, toolCall) {
  const result = await runToolOnly(session, toolCall);
  pushEvent(session, {
    type: "tool_result",
    message: `Tool completed: ${toolCall.name}`,
    toolCall,
    result,
  });
  appendToolMessage(session, toolCall, result);
  clearDiffPreview(session);
  return result;
}

export async function resumePausedTool(session) {
  const toolCall = session.pausedToolCall;
  if (!toolCall) {
    throw new Error("No paused tool call");
  }

  await executeTool(session, toolCall);
  session.pausedToolCall = null;
  session.pauseContext = null;
  session.status = "running";
  touchSession(session);
}

export async function rejectPausedTool(session, reason) {
  const toolCall = session.pausedToolCall;
  if (!toolCall) {
    throw new Error("No paused tool call");
  }

  const rejection = {
    rejected: true,
    reason: reason || "User rejected this action.",
  };

  session.toolCallsExecuted += 1;

  pushEvent(session, {
    type: "tool_result",
    message: `Tool rejected: ${toolCall.name}`,
    toolCall,
    result: rejection,
  });

  appendToolMessage(session, toolCall, rejection);

  session.pausedToolCall = null;
  session.pauseContext = null;
  clearDiffPreview(session);
  session.status = "running";
  touchSession(session);
}

export async function executeEditedTool(session, args) {
  const toolCall = session.pausedToolCall;
  if (!toolCall) {
    throw new Error("No paused tool call");
  }

  const edited = { ...toolCall, args };
  pushEvent(session, {
    type: "tool_call_edited",
    message: `Edited tool call: ${toolCall.name}`,
    toolCall: edited,
  });

  session.pausedToolCall = null;
  session.pauseContext = null;
  clearDiffPreview(session);
  session.status = "running";

  await executeTool(session, edited);
  touchSession(session);
}
