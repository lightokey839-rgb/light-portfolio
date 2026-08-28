import { Link } from "react-router-dom";
import FloatingCard from "./FloatingCard";
import "./LabCard.css";

export type LabStatus = "live" | "experimental" | "beta" | "soon";

interface LabCardProps {
  slug: string;
  name: string;
  description: string;
  status: LabStatus;
  statusLabel: string;
  tech: string[];
  glyph: string;
}

const STATUS_CLASS: Record<LabStatus, string> = {
  live: "status-chip--live",
  experimental: "status-chip--experimental",
  beta: "status-chip--beta",
  soon: "status-chip--soon",
};

export default function LabCard({ slug, name, description, status, statusLabel, tech, glyph }: LabCardProps) {
  const disabled = status === "soon";
  const content = (
    <>
      <div className="lab-card__top">
        <span className={`status-chip ${STATUS_CLASS[status]}`}>{statusLabel}</span>
        <span className="lab-card__glyph" aria-hidden="true">
          {glyph}
        </span>
      </div>

      <div className="lab-card__body">
        <h3 className="lab-card__name">{name}</h3>
        <p className="lab-card__desc">{description}</p>
      </div>

      <div className="lab-card__foot">
        <ul className="lab-card__tech">
          {tech.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        {!disabled && (
          <span className="lab-card__arrow" aria-hidden="true">
            →
          </span>
        )}
      </div>
    </>
  );

  if (disabled) {
    return (
      <div className="lab-card lab-card--disabled" aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <FloatingCard className="lab-card-wrap" tilt={5}>
      <Link to={`/lab/${slug}`} className="lab-card">
        {content}
      </Link>
    </FloatingCard>
  );
}
