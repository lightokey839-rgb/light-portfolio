import type { ElementType, ReactNode } from "react";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}

/** A translucent, blurred surface — the standard card treatment anywhere
 * content sits on top of the animated background rather than the flat
 * page background (where the plain `.glass` utility is enough). */
export default function GlassPanel({ children, className = "", as: Tag = "div" }: GlassPanelProps) {
  return <Tag className={`glass-translucent ${className}`.trim()}>{children}</Tag>;
}
