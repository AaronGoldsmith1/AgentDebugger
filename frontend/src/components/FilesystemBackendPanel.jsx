export default function FilesystemBackendPanel({
  filesystemBackend,
  onChange,
  disabled,
}) {
  return (
    <section className="panel">
      <h2>Filesystem</h2>
      <div className="mode-toggle">
        <label>
          <input
            type="radio"
            name="filesystemBackend"
            checked={filesystemBackend === "mock"}
            onChange={() => onChange("mock")}
            disabled={disabled}
          />
          Mock
        </label>
        <label>
          <input
            type="radio"
            name="filesystemBackend"
            checked={filesystemBackend === "real"}
            onChange={() => onChange("real")}
            disabled={disabled}
          />
          Real (WORKSPACE_ROOT)
        </label>
      </div>
      <p className="mode-hint muted">
        {filesystemBackend === "real"
          ? "Reads and writes files under WORKSPACE_ROOT from backend/.env."
          : "Uses in-memory fake file content for the demo."}
      </p>
    </section>
  );
}
