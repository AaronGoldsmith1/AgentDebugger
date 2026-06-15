import { shouldPause } from "../breakpoints/shouldPause.js";
import {
  shouldPauseAfterTool,
} from "../breakpoints/shouldPauseForStep.js";
import { buildDiffPreview } from "../breakpoints/buildDiffPreview.js";
import {
  appendToolMessage,
  pauseForLlmAfter,
  pauseForTool,
  pauseForToolAfter,
  pushEvent,
  runToolOnly,
} from "./toolFlow.js";
import { touchSession } from "../store/sessions.js";

export async function applyPauseEdits(session, body) {
  const ctx = session.pauseContext;
  if (!ctx) return;

  if (body.assistantContent != null && ctx.kind === "llm_after") {
    ctx.assistantContent = body.assistantContent;
    const lastAssistant = [...session.messages]
      .reverse()
      .find((m) => m.role === "assistant");
    if (lastAssistant) {
      lastAssistant.content = body.assistantContent;
    }
  }

  if (body.args != null && ctx.kind === "tool_before") {
    ctx.toolCall = { ...ctx.toolCall, args: body.args };
    session.pausedToolCall = ctx.toolCall;

    if (ctx.toolCall.name === "filesystem.writeFile") {
      session.diffPreview = await buildDiffPreview(session, ctx.toolCall);
    }
  }

  if (body.result != null && ctx.kind === "tool_after") {
    ctx.result = body.result;
  }

  touchSession(session);
}

export async function resolvePause(session, mode) {
  const ctx = session.pauseContext;
  if (!ctx) {
    throw new Error("No pause context");
  }

  if (ctx.kind === "llm_after") {
    const toolCall = ctx.toolCall;
    session.pausedToolCall = null;
    session.pauseContext = null;
    session.status = "running";

    pushEvent(session, {
      type: "tool_call_proposed",
      message: `Proposed tool call: ${toolCall.name}`,
      toolCall,
    });

    if (shouldPause(session, toolCall)) {
      await pauseForTool(session, toolCall);
      return;
    }

    const result = await runToolOnly(session, toolCall);
    pushEvent(session, {
      type: "tool_result",
      message: `Tool completed: ${toolCall.name}`,
      toolCall,
      result,
    });

    if (mode === "step" || shouldPauseAfterTool(session)) {
      pauseForToolAfter(session, toolCall, result);
      return;
    }

    appendToolMessage(session, toolCall, result);
    session.diffPreview = null;
    touchSession(session);
    return;
  }

  if (ctx.kind === "tool_before") {
    const toolCall = session.pausedToolCall || ctx.toolCall;
    session.pausedToolCall = null;
    session.pauseContext = null;
    session.status = "running";
    session.diffPreview = null;

    const result = await runToolOnly(session, toolCall);
    pushEvent(session, {
      type: "tool_result",
      message: `Tool completed: ${toolCall.name}`,
      toolCall,
      result,
    });

    if (mode === "step" || shouldPauseAfterTool(session)) {
      pauseForToolAfter(session, toolCall, result);
      return;
    }

    appendToolMessage(session, toolCall, result);
    touchSession(session);
    return;
  }

  if (ctx.kind === "tool_after") {
    const toolCall = ctx.toolCall;
    const result = ctx.result;
    session.pausedToolCall = null;
    session.pauseContext = null;
    session.status = "running";
    appendToolMessage(session, toolCall, result);
    touchSession(session);
  }
}
