import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import "./PageTransition.css";

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * The one transition language every public route shares (App.tsx wraps
 * each route's element in this). Fade + a short vertical settle, ~450ms —
 * quick enough that navigating never feels like waiting on an animation.
 * Collapses to a plain opacity fade under prefers-reduced-motion.
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const reduceMotion = useReducedMotion();

  const variants = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 },
      };

  return (
    <motion.div
      className="page-transition-root"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={{ duration: reduceMotion ? 0.2 : 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
