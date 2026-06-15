export default function GithubBackendPanel({
  githubBackend,
  mcpAvailable,
  mcpError,
  onChange,
  disabled,
}) {
  return (
    <section className="panel">
      <h2>GitHub</h2>
      <div className="mode-toggle">
        <label>
          <input
            type="radio"
            name="githubBackend"
            checked={githubBackend === "mock"}
            onChange={() => onChange("mock")}
            disabled={disabled}
          />
          Mock
        </label>
        <label>
          <input
            type="radio"
            name="githubBackend"
            checked={githubBackend === "mcp"}
            onChange={() => onChange("mcp")}
            disabled={disabled}
          />
          MCP
        </label>
      </div>
      <p className="mode-hint muted">
        {githubBackend === "mcp"
          ? mcpAvailable
            ? "Live GitHub tools via MCP after breakpoint approval."
            : "MCP unavailable — check backend logs and .env token/owner/repo."
          : "Uses deterministic mock issue/PR responses."}
      </p>
      {githubBackend === "mcp" && !mcpAvailable && mcpError && (
        <p className="error mcp-error">{mcpError}</p>
      )}
    </section>
  );
}
