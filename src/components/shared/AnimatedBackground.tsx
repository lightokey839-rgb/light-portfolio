import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import GlowGrid from "./GlowGrid";
import ParticleField, { type FieldVariant } from "./ParticleField";
import "./AnimatedBackground.css";

/**
 * Route → atmosphere. Each page keeps the same underlying system (base
 * void, blurred light blooms, grid, node network) but gets its own mix —
 * per the brief, "shared design system, page-specific personality."
 */
function variantForPath(pathname: string): FieldVariant {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/lab")) return "lab";
  if (pathname.startsWith("/about")) return "about";
  if (pathname.startsWith("/projects")) return "projects";
  if (pathname.startsWith("/writing")) return "writing";
  if (pathname.startsWith("/opensource")) return "opensource";
  return "minimal";
}

export default function AnimatedBackground() {
  const { pathname } = useLocation();
  const variant = useMemo(() => variantForPath(pathname), [pathname]);

  return (
    <div className={`animated-bg animated-bg--${variant}`} aria-hidden="true">
      <div className="animated-bg__bloom animated-bg__bloom-1" />
      <div className="animated-bg__bloom animated-bg__bloom-2" />
      <GlowGrid size={72} opacity={0.4} />
      <ParticleField variant={variant} className="animated-bg__field" />
      <div className="animated-bg__vignette" />
    </div>
  );
}
