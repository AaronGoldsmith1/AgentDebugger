export function shouldPauseAfterLlm(session) {
  return (
    session.executionControl === "step" || session.breakpoints.pauseAfterLlm
  );
}

export function shouldPauseAfterTool(session) {
  return session.executionControl === "step";
}
