import { Link } from "react-router-dom";
import "./ComingSoon.css";

export function ComingSoon({
  title,
  phase,
  description,
  backTo,
  backLabel,
}: {
  title: string;
  phase: string;
  description?: string;
  backTo: string;
  backLabel: string;
}) {
  return (
    <div className="coming-soon glass">
      <p className="eyebrow">{phase}</p>
      <h2>{title}</h2>
      <p>{description ?? `This section isn't wired up yet — it's built in ${phase}.`}</p>
      <Link to={backTo} className="btn btn-ghost btn-sm">
        {backLabel}
      </Link>
    </div>
  );
}
