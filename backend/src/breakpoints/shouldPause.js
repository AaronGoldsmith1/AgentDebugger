import { toolRegistry } from "../tools/registry.js";

export function shouldPause(session, toolCall) {
  const breakpoints = session.breakpoints;
  const toolMeta = toolRegistry[toolCall.name];

  if (!toolMeta) return false;

  if (breakpoints.afterPlan && session.toolCallsExecuted === 0) {
    return true;
  }

  if (
    breakpoints.beforeFileWrite &&
    toolMeta.namespace === "filesystem" &&
    toolMeta.capability === "write"
  ) {
    return true;
  }

  if (
    breakpoints.beforeGithubMutation &&
    toolMeta.namespace === "github" &&
    toolMeta.capability === "write"
  ) {
    return true;
  }

  if (breakpoints.beforeShellCommand && toolMeta.namespace === "shell") {
    return true;
  }

  return false;
}
