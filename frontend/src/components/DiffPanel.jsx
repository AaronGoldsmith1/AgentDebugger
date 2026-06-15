function DiffBlock({ label, content }) {
  const lines = (content ?? "").split("\n");

  return (
    <div className="diff-block">
      <h3 className="diff-block-label">{label}</h3>
      <pre className="diff-pre">
        {lines.map((line, index) => (
          <div key={index} className="diff-line">
            <span className="diff-lineno">{index + 1}</span>
            <span className="diff-text">{line || " "}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}

export default function DiffPanel({ diffPreview, proposedContent }) {
  if (!diffPreview) return null;

  const after =
    proposedContent != null ? proposedContent : diffPreview.after ?? "";

  return (
    <section className="diff-panel">
      <h3 className="diff-heading">File diff preview</h3>
      <p className="muted diff-path">{diffPreview.path}</p>
      <div className="diff-columns">
        <DiffBlock label="Before (on disk / cache)" content={diffPreview.before} />
        <DiffBlock label="After (proposed write)" content={after} />
      </div>
    </section>
  );
}
