import "./AsyncStates.css";

export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="async-state async-state--loading">
      <div className="async-state__spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="async-state async-state--empty">
      <p className="async-state__title">{title}</p>
      {hint && <p className="async-state__hint">{hint}</p>}
    </div>
  );
}

export function ErrorState({
  message = "Something went wrong. Try again.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="async-state async-state--error">
      <p className="async-state__title">{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
