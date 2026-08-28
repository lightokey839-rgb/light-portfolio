import { motion, useReducedMotion, useSpring } from "framer-motion";
import { useRef, type MouseEvent, type ReactNode } from "react";
import "./MagneticButton.css";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  /** max pixel offset the element is pulled — kept small on purpose */
  strength?: number;
}

/**
 * Wraps a single interactive child (button/link) and nudges it a few
 * pixels toward the cursor while hovered. Fine-pointer devices only —
 * on touch, and under reduced motion, it's a plain inert wrapper.
 */
export default function MagneticButton({ children, className = "", strength = 14 }: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();
  const x = useSpring(0, { stiffness: 260, damping: 20, mass: 0.4 });
  const y = useSpring(0, { stiffness: 260, damping: 20, mass: 0.4 });

  const disabled = reduceMotion || (typeof window !== "undefined" && !window.matchMedia("(pointer: fine)").matches);

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    if (disabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    x.set((relX / (rect.width / 2)) * strength);
    y.set((relY / (rect.height / 2)) * strength);
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={`magnetic-button ${className}`.trim()}
      style={disabled ? undefined : { x, y }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
    </motion.div>
  );
}
