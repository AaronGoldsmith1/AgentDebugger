import { useEffect, useState } from "react";
import DiffPanel from "./DiffPanel.jsx";

function parseProposedContent(argsJson) {
  try {
    return JSON.parse(argsJson).content;
  } catch {
    return undefined;
  }
}

const TOOL_RISK = {
  "github.searchIssues": "low",
  "github.createPullRequest": "medium",
  "filesystem.readFile": "low",
  "filesystem.writeFile": "high",
  "shell.run": "high",
};

const PAUSE_TITLES = {
  llm_after: "Paused after LLM response",
  tool_before: "Paused before tool execution",
  tool_after: "Paused after tool result",
};

export default function PausedInspectorCard({
  session,
  onSaveEdits,
  onContinue,
  onReject,
  onApplyAndRun,
  busy,
}) {
  const pauseKind = session.pauseContext?.kind ?? "tool_before";
  const toolCall = session.pausedToolCall;
  const breakpointEvent = [...(session.events ?? [])]
    .reverse()
    .find((e) => e.type === "breakpoint_hit");

  const [assistantContent, setAssistantContent] = useState(
    session.pauseContext?.assistantContent ?? ""
  );
  const [argsJson, setArgsJson] = useState(
    JSON.stringify(toolCall?.args ?? {}, null, 2)
  );
  const [resultJson, setResultJson] = useState(
    JSON.stringify(session.pauseContext?.result ?? {}, null, 2)
  );
  const [reason, setReason] = useState(
    "Do not run this action yet. Inspect the plan first."
  );
  const [editError, setEditError] = useState(null);

  useEffect(() => {
    setAssistantContent(session.pauseContext?.assistantContent ?? "");
    setArgsJson(JSON.stringify(toolCall?.args ?? {}, null, 2));
    setResultJson(JSON.stringify(session.pauseContext?.result ?? {}, null, 2));
    setEditError(null);
  }, [session.pauseContext, toolCall]);

  async function handleSaveEdits() {
    setEditError(null);
    try {
      if (pauseKind === "llm_after") {
        await onSaveEdits({ assistantContent });
      } else if (pauseKind === "tool_before") {
        const args = JSON.parse(argsJson);
        await onSaveEdits({ args });
      } else if (pauseKind === "tool_after") {
        const result = JSON.parse(resultJson);
        await onSaveEdits({ result });
      }
    } catch (err) {
      setEditError(err.message);
    }
  }

  async function handleApplyAndRun() {
    setEditError(null);
    try {
      if (pauseKind === "tool_before") {
        const args = JSON.parse(argsJson);
        await onApplyAndRun(args);
      }
    } catch (err) {
      setEditError(err.message);
    }
  }

  return (
    <section className="panel paused-card breakpoint-pulse">
      <h2>{PAUSE_TITLES[pauseKind] || "Paused at breakpoint"}</h2>
      <p className="pause-reason">{breakpointEvent?.message}</p>

      {pauseKind === "llm_after" && (
        <>
          <label className="field-label">
            Assistant response
            <textarea
              rows={4}
              value={assistantContent}
              onChange={(e) => setAssistantContent(e.target.value)}
              disabled={busy}
            />
          </label>
          {toolCall && (
            <label className="field-label">
              Proposed tool call
              <pre className="args-preview">
                {JSON.stringify(toolCall, null, 2)}
              </pre>
            </label>
          )}
        </>
      )}

      {pauseKind === "tool_before" && toolCall && (
        <>
          <dl className="paused-meta">
            <div>
              <dt>Tool</dt>
              <dd>{toolCall.name}</dd>
            </div>
            <div>
              <dt>Risk</dt>
              <dd className={`risk-${TOOL_RISK[toolCall.name] || "unknown"}`}>
                {TOOL_RISK[toolCall.name] || "unknown"}
              </dd>
            </div>
          </dl>

          <label className="field-label">
            Tool args (editable JSON)
            <textarea
              rows={8}
              value={argsJson}
              onChange={(e) => setArgsJson(e.target.value)}
              disabled={busy}
              className="code-textarea"
            />
          </label>

          {toolCall.name === "filesystem.writeFile" && session.diffPreview && (
            <DiffPanel
              diffPreview={session.diffPreview}
              proposedContent={parseProposedContent(argsJson)}
            />
          )}

          <label className="field-label">
            Reject reason
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={busy}
            />
          </label>
        </>
      )}

      {pauseKind === "tool_after" && toolCall && (
        <>
          <dl className="paused-meta">
            <div>
              <dt>Tool</dt>
              <dd>{toolCall.name}</dd>
            </div>
          </dl>

          <label className="field-label">
            Tool result (editable JSON)
            <textarea
              rows={10}
              value={resultJson}
              onChange={(e) => setResultJson(e.target.value)}
              disabled={busy}
              className="code-textarea"
            />
          </label>
        </>
      )}

      {editError && <p className="error">{editError}</p>}

      <div className="paused-actions">
        {(pauseKind === "llm_after" || pauseKind === "tool_after") && (
          <button
            type="button"
            className="btn-secondary"
            onClick={handleSaveEdits}
            disabled={busy}
          >
            Save edits
          </button>
        )}

        {pauseKind === "tool_before" && (
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleSaveEdits}
              disabled={busy}
            >
              Save args
            </button>
            <button
              type="button"
              onClick={handleApplyAndRun}
              disabled={busy}
            >
              Apply &amp; run
            </button>
            <button type="button" onClick={onContinue} disabled={busy}>
              Continue
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onReject(reason)}
              disabled={busy}
            >
              Reject
            </button>
          </>
        )}

        {pauseKind !== "tool_before" && (
          <button type="button" onClick={onContinue} disabled={busy}>
            Continue
          </button>
        )}
      </div>
    </section>
  );
}
