import { motion, useReducedMotion, useSpring } from "framer-motion";
import { useRef, type MouseEvent, type ReactNode } from "react";
import "./FloatingCard.css";

interface FloatingCardProps {
  children: ReactNode;
  className?: string;
  /** max rotation in degrees */
  tilt?: number;
}

/**
 * A card that leans slightly toward the cursor and lifts on hover — used
 * for the hero's floating mini-cards and other single, spotlighted
 * elements. Not used on dense grids (a dozen tilting cards at once reads
 * as noise, not depth) — see ProjectCard/LabCard for the grid treatment.
 */
export default function FloatingCard({ children, className = "", tilt = 8 }: FloatingCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();
  const rotateX = useSpring(0, { stiffness: 200, damping: 20 });
  const rotateY = useSpring(0, { stiffness: 200, damping: 20 });
  const lift = useSpring(0, { stiffness: 200, damping: 22 });

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    if (reduceMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * tilt);
    rotateX.set(-py * tilt);
    lift.set(-6);
  }

  function handleLeave() {
    rotateX.set(0);
    rotateY.set(0);
    lift.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={`floating-card ${className}`.trim()}
      style={reduceMotion ? undefined : { rotateX, rotateY, y: lift, transformPerspective: 900 }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
    </motion.div>
  );
}
