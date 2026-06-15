import { EVENT_CLASS, EVENT_LABELS } from "../eventColors.js";

export default function EventDetailsPanel({ event }) {
  if (!event) {
    return <p className="muted">Select an event to inspect details.</p>;
  }

  const typeClass = EVENT_CLASS[event.type] || "event-gray";

  return (
    <div className="event-details">
      <span className={`event-type-badge ${typeClass}`}>
        {EVENT_LABELS[event.type] || event.type}
      </span>

      <dl className="event-meta">
        <div>
          <dt>Message</dt>
          <dd>{event.message}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{new Date(event.createdAt).toLocaleString()}</dd>
        </div>
        {event.toolCall && (
          <div>
            <dt>Tool</dt>
            <dd>{event.toolCall.name}</dd>
          </div>
        )}
      </dl>

      {event.toolCall?.args && (
        <>
          <h3 className="details-heading">Tool args</h3>
          <pre>{JSON.stringify(event.toolCall.args, null, 2)}</pre>
        </>
      )}

      {event.result && (
        <>
          <h3 className="details-heading">Result</h3>
          <pre>{JSON.stringify(event.result, null, 2)}</pre>
        </>
      )}

      {!event.toolCall && !event.result && (
        <>
          <h3 className="details-heading">Raw event</h3>
          <pre>{JSON.stringify(event, null, 2)}</pre>
        </>
      )}
    </div>
  );
}
