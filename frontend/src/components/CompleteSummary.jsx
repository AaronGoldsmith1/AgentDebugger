export default function CompleteSummary({ finalAnswer, onReset, busy }) {
  return (
    <section className="panel complete-summary">
      <h2>Task complete</h2>
      <p className="complete-answer">{finalAnswer}</p>
      <button
        type="button"
        className="btn-secondary"
        onClick={onReset}
        disabled={busy}
      >
        Reset demo
      </button>
    </section>
  );
}
