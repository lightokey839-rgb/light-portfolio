import type { CSSProperties } from "react";
import "./GlowGrid.css";

interface GlowGridProps {
  /** px spacing between lines — smaller reads "denser / more technical" */
  size?: number;
  /** 0–1, kept low so the grid stays structural, not decorative */
  opacity?: number;
  /** disables the slow pan — used when a page wants the grid static */
  animated?: boolean;
  className?: string;
}

/**
 * A faint animated grid, the same structural device an oscilloscope or
 * schematic uses. Composed inside AnimatedBackground for every page, and
 * dropped in again at higher density on /lab to make that page's register
 * feel more instrumented. Pure CSS — no canvas cost.
 */
export default function GlowGrid({
  size = 64,
  opacity = 0.5,
  animated = true,
  className = "",
}: GlowGridProps) {
  return (
    <div
      className={`glow-grid ${animated ? "glow-grid--animated" : ""} ${className}`.trim()}
      style={
        {
          "--glow-grid-size": `${size}px`,
          "--glow-grid-opacity": opacity,
        } as CSSProperties
      }
      aria-hidden="true"
    />
  );
}
