import { useEffect, useRef } from "react";
import { EVENT_CLASS, EVENT_LABELS } from "../eventColors.js";

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function AgentTimeline({
  events,
  selectedEventId,
  activeEventId,
  onSelect,
}) {
  const activeRef = useRef(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeEventId]);

  if (!events.length) {
    return (
      <p className="muted timeline-empty">
        No events yet. Start the agent to see the timeline.
      </p>
    );
  }

  return (
    <ul className="timeline">
      {events.map((event) => {
        const isActive = event.id === activeEventId;
        const isSelected = event.id === selectedEventId;
        const isBreakpoint = event.type === "breakpoint_hit";

        return (
          <li key={event.id} ref={isActive ? activeRef : null}>
            <button
              type="button"
              className={`timeline-item ${EVENT_CLASS[event.type] || "event-gray"} ${
                isSelected ? "selected" : ""
              } ${isBreakpoint && isActive ? "breakpoint-pulse" : ""}`}
              onClick={() => onSelect(event)}
            >
              <span className="timeline-row">
                <span className="timeline-type">
                  {EVENT_LABELS[event.type] || event.type}
                </span>
                <span className="timeline-time">{formatTime(event.createdAt)}</span>
              </span>
              <span className="timeline-message">{event.message}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
