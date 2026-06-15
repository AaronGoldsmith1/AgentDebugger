export default function AgentModePanel({ agentMode, onChange, disabled }) {
  return (
    <section className="panel">
      <h2>Agent mode</h2>
      <div className="mode-toggle">
        <label>
          <input
            type="radio"
            name="agentMode"
            value="scripted"
            checked={agentMode === "scripted"}
            onChange={() => onChange("scripted")}
            disabled={disabled}
          />
          Scripted demo
        </label>
        <label>
          <input
            type="radio"
            name="agentMode"
            value="openai"
            checked={agentMode === "openai"}
            onChange={() => onChange("openai")}
            disabled={disabled}
          />
          OpenAI agent
        </label>
      </div>
      <p className="mode-hint muted">
        {agentMode === "scripted"
          ? "Deterministic demo path — no API key required."
          : "Requires OPENAI_API_KEY in backend/.env"}
      </p>
    </section>
  );
}
