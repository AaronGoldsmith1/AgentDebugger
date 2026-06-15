import { useCallback, useEffect, useRef, useState } from "react";
import {
  createSession,
  DEFAULT_BREAKPOINTS,
  DEFAULT_TASK,
  editPaused,
  editToolCall,
  getHealth,
  getSession,
  rejectSession,
  resetSession,
  resumeSession,
  setExecutionControl,
  startSession,
  stepSession,
  setFilesystemBackend,
  setGithubBackend,
  updateBreakpoints,
} from "./api.js";
import AgentModePanel from "./components/AgentModePanel.jsx";
import AgentTimeline from "./components/AgentTimeline.jsx";
import BreakpointPanel from "./components/BreakpointPanel.jsx";
import CompleteSummary from "./components/CompleteSummary.jsx";
import DebuggerControlBar from "./components/DebuggerControlBar.jsx";
import ErrorBanner from "./components/ErrorBanner.jsx";
import EventDetailsPanel from "./components/EventDetailsPanel.jsx";
import FilesystemBackendPanel from "./components/FilesystemBackendPanel.jsx";
import GithubBackendPanel from "./components/GithubBackendPanel.jsx";
import PausedBanner from "./components/PausedBanner.jsx";
import PausedInspectorCard from "./components/PausedInspectorCard.jsx";
import StatusBanner from "./components/StatusBanner.jsx";
import TaskForm from "./components/TaskForm.jsx";

function getPauseMessage(session) {
  if (!session || session.status !== "paused") return null;

  const breakpointEvent = [...(session.events ?? [])]
    .reverse()
    .find((event) => event.type === "breakpoint_hit");

  return breakpointEvent?.message ?? "Review the agent state before continuing.";
}

export default function App() {
  const [sessionId, setSessionId] = useState(null);
  const [session, setSession] = useState(null);
  const [task, setTask] = useState(DEFAULT_TASK);
  const [breakpoints, setBreakpoints] = useState(DEFAULT_BREAKPOINTS);
  const [executionControl, setExecutionControlState] = useState("run");
  const [agentMode, setAgentMode] = useState("scripted");
  const [filesystemBackend, setFilesystemBackendState] = useState("mock");
  const [githubBackend, setGithubBackendState] = useState("mock");
  const [mcpStatus, setMcpStatus] = useState({ available: false, error: null });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedEventIndex, setSelectedEventIndex] = useState(-1);
  const [error, setError] = useState(null);
  const [apiOnline, setApiOnline] = useState(true);
  const [busy, setBusy] = useState(false);
  const browsingHistoryRef = useRef(false);
  const lastStatusRef = useRef(null);
  const pausedFooterRef = useRef(null);

  const events = session?.events ?? [];
  const activeExecutionControl =
    session?.executionControl ?? executionControl;
  const pauseMessage = getPauseMessage(session);
  const activeEventId =
    session?.status === "paused" || session?.status === "running"
      ? events.at(-1)?.id
      : null;

  const selectEventByIndex = useCallback(
    (index) => {
      if (!events.length) {
        setSelectedEvent(null);
        setSelectedEventIndex(-1);
        return;
      }

      const clamped = Math.max(0, Math.min(index, events.length - 1));
      setSelectedEvent(events[clamped]);
      setSelectedEventIndex(clamped);
    },
    [events]
  );

  useEffect(() => {
    getHealth()
      .then((data) => {
        setApiOnline(true);
        if (data.githubMcp) {
          setMcpStatus(data.githubMcp);
        }
      })
      .catch(() => {
        setApiOnline(false);
        setError("Backend API is unreachable. Start it with: cd backend && npm run dev");
      });
  }, []);

  useEffect(() => {
    if (!sessionId) return undefined;

    const poll = async () => {
      try {
        const data = await getSession(sessionId);
        setSession(data);
        setBreakpoints(data.breakpoints);
        if (data.executionControl) {
          setExecutionControlState(data.executionControl);
        }
        if (data.filesystemBackend) {
          setFilesystemBackendState(data.filesystemBackend);
        }
        if (data.githubBackend) {
          setGithubBackendState(data.githubBackend);
        }
        setApiOnline(true);
      } catch (err) {
        setError(err.message);
        setApiOnline(false);
      }
    };

    poll();
    const interval = setInterval(poll, 1000);
    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    if (!session) return;

    const becamePaused =
      session.status === "paused" && lastStatusRef.current !== "paused";

    if (becamePaused && !browsingHistoryRef.current) {
      const latest = session.events.at(-1);
      if (latest) {
        setSelectedEvent(latest);
        setSelectedEventIndex(session.events.length - 1);
      }
      pausedFooterRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }

    if (session.status === "running") {
      browsingHistoryRef.current = false;
    }

    lastStatusRef.current = session.status;
  }, [session]);

  async function handleContinue() {
    if (!sessionId) return;
    browsingHistoryRef.current = false;
    setBusy(true);
    setError(null);
    try {
      await resumeSession(sessionId);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const handleStepForward = useCallback(async () => {
    if (!sessionId || session?.status !== "paused") return;
    browsingHistoryRef.current = false;
    setBusy(true);
    setError(null);
    try {
      await stepSession(sessionId);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }, [session?.status, sessionId]);

  const handleStepBack = useCallback(
    (delta = -1) => {
      if (!events.length) return;
      browsingHistoryRef.current = true;

      const baseIndex =
        selectedEventIndex >= 0 ? selectedEventIndex : events.length - 1;

      selectEventByIndex(baseIndex + delta);
    },
    [events.length, selectEventByIndex, selectedEventIndex]
  );

  useEffect(() => {
    function onKeyDown(event) {
      const tag = event.target?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;

      if (event.code === "Space") {
        event.preventDefault();
        if (session?.status === "paused" && !busy) {
          handleContinue();
        }
      }

      if (event.code === "ArrowLeft") {
        event.preventDefault();
        handleStepBack(-1);
      }

      if (event.code === "ArrowRight") {
        event.preventDefault();
        if (
          session?.status === "paused" &&
          activeExecutionControl === "step" &&
          !busy
        ) {
          handleStepForward();
        } else {
          handleStepBack(1);
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    activeExecutionControl,
    busy,
    handleStepBack,
    handleStepForward,
    session?.status,
  ]);

  async function handleStart() {
    setBusy(true);
    setError(null);
    browsingHistoryRef.current = false;
    try {
      let id = sessionId;

      if (!id) {
        const created = await createSession({
          task,
          breakpoints,
          agentMode,
          executionControl,
          filesystemBackend,
          githubBackend,
        });
        id = created.sessionId;
        setSessionId(id);
      }

      await startSession(id, { executionControl });
      const data = await getSession(id);
      setSession(data);
      setSelectedEvent(null);
      setSelectedEventIndex(-1);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    if (!sessionId) {
      setSession(null);
      setSelectedEvent(null);
      setSelectedEventIndex(-1);
      setError(null);
      browsingHistoryRef.current = false;
      return;
    }

    setBusy(true);
    setError(null);
    browsingHistoryRef.current = false;
    try {
      await resetSession(sessionId);
      const data = await getSession(sessionId);
      setSession(data);
      setSelectedEvent(null);
      setSelectedEventIndex(-1);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handlePause() {
    if (executionControl !== "step") {
      await handleExecutionControl("step");
    }
  }

  async function handleReject(reason) {
    if (!sessionId) return;
    browsingHistoryRef.current = false;
    setBusy(true);
    setError(null);
    try {
      await rejectSession(sessionId, reason);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleExecutionControl(mode) {
    setExecutionControlState(mode);
    if (!sessionId) return;
    setBusy(true);
    setError(null);
    try {
      await setExecutionControl(sessionId, mode);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveEdits(body) {
    if (!sessionId) return;
    setBusy(true);
    setError(null);
    try {
      await editPaused(sessionId, body);
      const data = await getSession(sessionId);
      setSession(data);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function handleApplyAndRun(args) {
    if (!sessionId) return;
    browsingHistoryRef.current = false;
    setBusy(true);
    setError(null);
    try {
      await editToolCall(sessionId, args);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function handleFilesystemBackendChange(backend) {
    setFilesystemBackendState(backend);
    if (!sessionId) return;
    setBusy(true);
    setError(null);
    try {
      await setFilesystemBackend(sessionId, backend);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleGithubBackendChange(backend) {
    setGithubBackendState(backend);
    if (!sessionId) return;
    setBusy(true);
    setError(null);
    try {
      await setGithubBackend(sessionId, backend);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleBreakpointChange(key, value) {
    const next = { ...breakpoints, [key]: value };
    setBreakpoints(next);
    if (!sessionId) return;
    try {
      await updateBreakpoints(sessionId, { [key]: value });
    } catch (err) {
      setError(err.message);
    }
  }

  function handleTimelineSelect(event) {
    browsingHistoryRef.current = true;
    setSelectedEvent(event);
    const index = events.findIndex((item) => item.id === event.id);
    setSelectedEventIndex(index);
  }

  const agentRunning = session?.status === "running";
  const canStart =
    !busy && !agentRunning && apiOnline && session?.status !== "paused";
  const canReset = Boolean(sessionId) && !agentRunning;
  const showPaused = session?.status === "paused";
  const showComplete = session?.status === "complete";
  const activeFilesystemBackend =
    session?.filesystemBackend ?? filesystemBackend;
  const activeGithubBackend = session?.githubBackend ?? githubBackend;
  const canStepBack =
    selectedEventIndex > 0 || (selectedEventIndex < 0 && events.length > 1);
  const canStepForward =
    selectedEventIndex >= 0 && selectedEventIndex < events.length - 1;

  return (
    <div className="layout">
      <header className="header">
        <div className="header-title">
          <h1>Agent Debugger</h1>
          <span
            className={`api-indicator ${apiOnline ? "online" : "offline"}`}
            title={apiOnline ? "API connected" : "API offline"}
          />
        </div>
        {session && (
          <StatusBanner
            status={session.status}
            pauseMessage={pauseMessage}
            finalAnswer={session.finalAnswer}
          />
        )}
      </header>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      {showPaused && <PausedBanner message={pauseMessage} />}

      <div className="columns">
        <aside className="left">
          <TaskForm
            task={task}
            onTaskChange={setTask}
            onStart={handleStart}
            onReset={handleReset}
            disabled={!canStart}
            canReset={canReset}
            busy={busy}
          />
          <AgentModePanel
            agentMode={agentMode}
            onChange={setAgentMode}
            disabled={agentRunning}
          />
          <FilesystemBackendPanel
            filesystemBackend={activeFilesystemBackend}
            onChange={handleFilesystemBackendChange}
            disabled={agentRunning}
          />
          <GithubBackendPanel
            githubBackend={activeGithubBackend}
            mcpAvailable={mcpStatus.available}
            mcpError={mcpStatus.error}
            onChange={handleGithubBackendChange}
            disabled={agentRunning}
          />
          <DebuggerControlBar
            executionControl={activeExecutionControl}
            status={session?.status ?? "idle"}
            hasSession={Boolean(sessionId)}
            canStepBack={canStepBack}
            canStepForward={canStepForward}
            onSetMode={handleExecutionControl}
            onPlay={handleContinue}
            onPause={handlePause}
            onStepBack={() => handleStepBack(-1)}
            onStepForward={handleStepForward}
            busy={busy}
          />
          <BreakpointPanel
            breakpoints={breakpoints}
            onChange={handleBreakpointChange}
            disabled={agentRunning}
          />
        </aside>

        <main className="center panel">
          <h2>Timeline</h2>
          <AgentTimeline
            events={events}
            selectedEventId={selectedEvent?.id}
            activeEventId={activeEventId}
            onSelect={handleTimelineSelect}
          />
        </main>

        <aside className="right panel">
          <h2>Details</h2>
          <EventDetailsPanel event={selectedEvent} />
        </aside>
      </div>

      {showComplete && (
        <footer className="paused-footer">
          <CompleteSummary
            finalAnswer={session.finalAnswer}
            onReset={handleReset}
            busy={busy}
          />
        </footer>
      )}

      {showPaused && (
        <footer className="paused-footer" ref={pausedFooterRef}>
          <PausedInspectorCard
            session={session}
            onSaveEdits={handleSaveEdits}
            onContinue={handleContinue}
            onReject={handleReject}
            onApplyAndRun={handleApplyAndRun}
            busy={busy}
          />
        </footer>
      )}
    </div>
  );
}
