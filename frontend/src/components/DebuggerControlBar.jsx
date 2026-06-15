function TransportButton({ label, title, onClick, disabled, active, children }) {
  return (
    <button
      type="button"
      className={`transport-btn ${active ? "active" : ""}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={label}
    >
      {children}
    </button>
  );
}

export default function DebuggerControlBar({
  executionControl,
  status,
  hasSession,
  canStepBack,
  canStepForward,
  onSetMode,
  onPlay,
  onPause,
  onStepBack,
  onStepForward,
  busy,
}) {
  const isPaused = status === "paused";
  const isRunning = status === "running";
  const isStepMode = executionControl === "step";
  const controlsDisabled = !hasSession || busy;

  return (
    <section className="panel debugger-control-bar">
      <h2>Debugger controls</h2>

      <div className="transport-bar" role="toolbar" aria-label="Agent transport controls">
        <TransportButton
          label="Step back"
          title="Previous event in timeline (inspect only)"
          onClick={onStepBack}
          disabled={controlsDisabled || !canStepBack}
        >
          <span aria-hidden="true">⏮</span>
        </TransportButton>

        <TransportButton
          label="Play"
          title={
            isPaused
              ? "Continue until next breakpoint"
              : "Available when the agent is paused"
          }
          onClick={onPlay}
          disabled={controlsDisabled || !isPaused}
          active={isRunning}
        >
          <span aria-hidden="true">▶</span>
        </TransportButton>

        <TransportButton
          label="Pause"
          title={
            isPaused
              ? "Agent is paused"
              : isRunning
                ? "Pauses at the next breakpoint automatically"
                : "Switch to step mode to pause after each step"
          }
          onClick={onPause}
          disabled={controlsDisabled || isRunning}
          active={isPaused}
        >
          <span aria-hidden="true">⏸</span>
        </TransportButton>

        <TransportButton
          label="Step forward"
          title={
            isPaused
              ? isStepMode
                ? "Advance one atomic step"
                : "Switch to Step mode to step forward"
              : "Available when the agent is paused"
          }
          onClick={onStepForward}
          disabled={controlsDisabled || !isPaused || !isStepMode}
        >
          <span aria-hidden="true">⏭</span>
        </TransportButton>
      </div>

      <div className="control-mode-toggle">
        <label>
          <input
            type="radio"
            name="executionControl"
            checked={executionControl === "run"}
            onChange={() => onSetMode("run")}
            disabled={busy || isRunning}
          />
          Run
        </label>
        <label>
          <input
            type="radio"
            name="executionControl"
            checked={executionControl === "step"}
            onChange={() => onSetMode("step")}
            disabled={busy || isRunning}
          />
          Step
        </label>
      </div>

      <p className="muted mode-hint">
        {isStepMode
          ? "Step mode: ⏭ advances one LLM or tool beat. ⏮ browses past events."
          : "Run mode: ▶ continues until a breakpoint. Enable Step for ⏭."}
      </p>
      <p className="muted shortcut-hint">
        Shortcuts: Space = play, ← / → = timeline back / forward
      </p>
    </section>
  );
}
