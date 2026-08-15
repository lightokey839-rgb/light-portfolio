import "./StatCard.css";

interface StatCardProps {
  label: string;
  value: number | null;
  loading: boolean;
  errored: boolean;
}

export function StatCard({ label, value, loading, errored }: StatCardProps) {
  return (
    <div className="stat-card glass">
      <p className="stat-card__label">{label}</p>
      {loading ? (
        <div className="stat-card__skeleton" aria-hidden="true" />
      ) : errored ? (
        <p className="stat-card__value stat-card__value--muted">—</p>
      ) : (
        <p className="stat-card__value">{value}</p>
      )}
    </div>
  );
}
