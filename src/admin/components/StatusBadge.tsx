import "./StatusBadge.css";

type Tone = "positive" | "neutral" | "accent";

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return <span className={`status-badge status-badge--${tone}`}>{label}</span>;
}
