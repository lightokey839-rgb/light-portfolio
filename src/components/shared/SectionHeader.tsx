import type { ReactNode } from "react";
import ScrollReveal from "../ScrollReveal/ScrollReveal";

interface SectionHeaderProps {
  eyebrow: string;
  heading: ReactNode;
  sub?: ReactNode;
  /** e.g. filter buttons, rendered right-aligned on desktop */
  action?: ReactNode;
  align?: "row" | "stack";
  /** "h1" when this IS the page's main heading (dedicated pages with no separate Hero) */
  level?: "h1" | "h2";
}

export default function SectionHeader({
  eyebrow,
  heading,
  sub,
  action,
  align = "row",
  level = "h2",
}: SectionHeaderProps) {
  const Heading = level;
  const body = (
    <ScrollReveal>
      <p className="eyebrow">{eyebrow}</p>
      <Heading className="section-heading">{heading}</Heading>
      {sub && <p className="section-sub">{sub}</p>}
    </ScrollReveal>
  );

  if (!action) return body;

  return (
    <div className={align === "row" ? "section-head-row" : undefined}>
      {body}
      {action && (
        <ScrollReveal delay={100} as="div">
          {action}
        </ScrollReveal>
      )}
    </div>
  );
}
