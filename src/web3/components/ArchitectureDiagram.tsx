import "./ArchitectureDiagram.css";

export type ArchitectureStep = {
  label: string;
  detail?: string;
  layer: "user" | "frontend" | "infra" | "onchain";
};

const LAYER_META: Record<ArchitectureStep["layer"], { name: string }> = {
  user: { name: "User-controlled" },
  frontend: { name: "Off-chain — frontend" },
  infra: { name: "Off-chain — infrastructure" },
  onchain: { name: "On-chain" },
};

/**
 * Renders a vertical step-by-step architecture flow (User → Wallet →
 * Frontend → Web3 client → Smart contract → Blockchain, or the oracle
 * equivalent). Every step is labeled with which layer it belongs to —
 * on-chain, off-chain/frontend, off-chain/infrastructure, or
 * user-controlled — per the portfolio's architecture-visualization
 * requirement.
 */
export default function ArchitectureDiagram({ title, steps }: { title: string; steps: ArchitectureStep[] }) {
  return (
    <figure className="arch-diagram" aria-label={title}>
      <figcaption className="arch-diagram__title">{title}</figcaption>
      <ol className="arch-diagram__steps">
        {steps.map((step, i) => (
          <li key={step.label} className="arch-diagram__step">
            <div className={`arch-diagram__node arch-diagram__node--${step.layer}`}>
              <span className="arch-diagram__layer">{LAYER_META[step.layer].name}</span>
              <span className="arch-diagram__label">{step.label}</span>
              {step.detail && <span className="arch-diagram__detail">{step.detail}</span>}
            </div>
            {i < steps.length - 1 && (
              <span className="arch-diagram__arrow" aria-hidden="true">
                ↓
              </span>
            )}
          </li>
        ))}
      </ol>
    </figure>
  );
}
