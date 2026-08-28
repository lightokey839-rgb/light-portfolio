import { useEffect, useRef } from "react";
import "./CursorGlow.css";

/**
 * A soft light that trails the cursor, reinforcing the "you're moving
 * through a lit network" feel from AnimatedBackground. Fine-pointer
 * devices only — never rendered on touch, and frozen (no lag/lerp) when
 * the user has asked for reduced motion.
 */
export default function CursorGlow() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)");
    if (!finePointer.matches) return;

    const node = ref.current;
    if (!node) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;
    let raf = 0;
    let active = false;

    function onMove(e: PointerEvent) {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!active) {
        active = true;
        node!.style.opacity = "1";
      }
    }

    function onLeave() {
      active = false;
      node!.style.opacity = "0";
    }

    function apply() {
      x = targetX;
      y = targetY;
      node!.style.transform = `translate3d(${x - 220}px, ${y - 220}px, 0)`;
    }

    function tick() {
      x += (targetX - x) * 0.12;
      y += (targetY - y) * 0.12;
      node!.style.transform = `translate3d(${x - 220}px, ${y - 220}px, 0)`;
      raf = requestAnimationFrame(tick);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    if (reduceMotion) {
      window.addEventListener("pointermove", apply, { passive: true });
    } else {
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointermove", apply);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <div ref={ref} className="cursor-glow" aria-hidden="true" />;
}
