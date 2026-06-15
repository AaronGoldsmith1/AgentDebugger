import { shouldPause } from "../breakpoints/shouldPause.js";
import {
  shouldPauseAfterLlm,
  shouldPauseAfterTool,
} from "../breakpoints/shouldPauseForStep.js";
import { callOpenAI } from "./callOpenAI.js";
import { normalizeOpenAIResponse } from "./normalizeOpenAIResponse.js";
import { SYSTEM_PROMPT } from "./openaiTools.js";
import {
  appendToolMessage,
  pauseForLlmAfter,
  pauseForTool,
  pauseForToolAfter,
  pushEvent,
  runToolOnly,
} from "./toolFlow.js";
import { touchSession } from "../store/sessions.js";

function ensureMessages(session) {
  if (session.messages.length > 0) return;

  session.messages.push(
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: session.task }
  );
}

export async function runAgentLoop(session) {
  if (session.status !== "running") return;

  ensureMessages(session);

  try {
    const response = await callOpenAI(session.messages);
    const normalized = normalizeOpenAIResponse(response);

    pushEvent(session, {
      type: "llm_response",
      message: normalized.statusMessage,
    });

    for (const message of normalized.messagesToAppend) {
      session.messages.push(message);
    }

    if (normalized.type === "final") {
      session.status = "complete";
      session.finalAnswer = normalized.content;
      pushEvent(session, {
        type: "complete",
        message: "Agent completed task",
      });
      touchSession(session);
      return;
    }

    if (normalized.type === "tool_call") {
      const toolCall = normalized.toolCall;

      if (shouldPauseAfterLlm(session)) {
        pauseForLlmAfter(session, {
          assistantContent: normalized.statusMessage,
          toolCall,
        });
        return;
      }

      pushEvent(session, {
        type: "tool_call_proposed",
        message: `Proposed tool call: ${toolCall.name}`,
        toolCall,
      });

      if (shouldPause(session, toolCall)) {
        pauseForTool(session, toolCall);
        return;
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
        return;
      }

      appendToolMessage(session, toolCall, result);
      session.status = "running";
      touchSession(session);
      await runAgentLoop(session);
    }
  } catch (err) {
    session.status = "error";
    pushEvent(session, {
      type: "error",
      message: err.message || "Agent loop failed",
    });
  }
}
