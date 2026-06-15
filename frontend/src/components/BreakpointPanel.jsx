const BREAKPOINT_FIELDS = [
  { key: "afterPlan", label: "After plan (first tool)" },
  { key: "pauseAfterLlm", label: "Pause after each LLM response" },
  { key: "beforeFileWrite", label: "Before file write" },
  { key: "beforeGithubMutation", label: "Before GitHub mutation" },
  { key: "beforeShellCommand", label: "Before shell command" },
];

export default function BreakpointPanel({
  breakpoints,
  onChange,
  disabled,
}) {
  if (!breakpoints) return null;

  return (
    <section className="panel">
      <h2>Breakpoints</h2>
      <ul className="breakpoint-list">
        {BREAKPOINT_FIELDS.map(({ key, label }) => (
          <li key={key}>
            <label>
              <input
                type="checkbox"
                checked={Boolean(breakpoints[key])}
                onChange={(e) => onChange(key, e.target.checked)}
                disabled={disabled}
              />
              {label}
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
