export default function StatusBanner({ status, pauseMessage, finalAnswer }) {
  const labels = {
    idle: "Idle — ready to start",
    running: "Running",
    paused: "Paused at breakpoint",
    complete: "Complete",
    error: "Error",
  };

  const icons = {
    idle: "○",
    running: "●",
    paused: "⏸",
    complete: "✓",
    error: "✕",
  };

  return (
    <div className="status-banner-wrap">
      <div className={`status-banner status-${status}`}>
        <span className="status-icon" aria-hidden="true">
          {icons[status] || "○"}
        </span>
        {labels[status] || status}
      </div>
      {status === "paused" && pauseMessage && (
        <p className="status-subtext">{pauseMessage}</p>
      )}
      {status === "complete" && finalAnswer && (
        <p className="status-subtext status-subtext-success">{finalAnswer}</p>
      )}
    </div>
  );
}
