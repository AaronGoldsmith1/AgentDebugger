export default function PausedBanner({ message }) {
  if (!message) return null;

  return (
    <div className="paused-banner breakpoint-pulse" role="status">
      <span className="paused-banner-icon" aria-hidden="true">
        ⏸
      </span>
      <div>
        <strong>Agent paused at breakpoint</strong>
        <p>{message}</p>
      </div>
    </div>
  );
}
