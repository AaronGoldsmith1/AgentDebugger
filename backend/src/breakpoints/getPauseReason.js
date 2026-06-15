import { toolRegistry } from "../tools/registry.js";

export function getPauseReason(session, toolCall) {
  const breakpoints = session.breakpoints;
  const toolMeta = toolRegistry[toolCall.name];

  if (breakpoints.afterPlan && session.toolCallsExecuted === 0) {
    return "Paused after plan — review before first action";
  }

  if (
    toolMeta?.namespace === "filesystem" &&
    toolMeta.capability === "write"
  ) {
    return "Paused before file write";
  }

  if (toolMeta?.namespace === "github" && toolMeta.capability === "write") {
    return "Paused before GitHub mutation";
  }

  if (toolMeta?.namespace === "shell") {
    return "Paused before shell command";
  }

  return "Paused at breakpoint";
}
