import { useEffect, useRef, useState, type ReactNode, type ElementType } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  /** ms delay applied once the element enters view, for staggered groups */
  delay?: number;
  className?: string;
  as?: ElementType;
}

/**
 * Fades + lifts children into place the first time they enter the viewport.
 * Falls back to always-visible if IntersectionObserver is unavailable.
 */
export default function ScrollReveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            window.setTimeout(() => setVisible(true), delay);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`.trim()}
    >
      {children}
    </Tag>
  );
}
