export default function TaskForm({
  task,
  onTaskChange,
  onStart,
  onReset,
  disabled,
  canReset,
  busy,
}) {
  return (
    <section className="panel">
      <h2>Task</h2>
      <textarea
        value={task}
        onChange={(e) => onTaskChange(e.target.value)}
        rows={5}
        disabled={disabled}
      />
      <div className="task-actions">
        <button type="button" onClick={onStart} disabled={disabled || busy}>
          Start agent
        </button>
        {canReset && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onReset}
            disabled={busy}
          >
            Reset demo
          </button>
        )}
      </div>
    </section>
  );
}
