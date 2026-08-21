import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * PortfolioPage's sections all live on "/" and are linked to via #hash
 * anchors (Navbar, and now the project case-study pages' "back" links).
 * A same-page anchor click already scrolls natively. But navigating here
 * FROM another route (e.g. /projects/:slug) via <Link to="/#projects">
 * is a client-side transition, not a full page load — the browser's
 * native hash-jump never fires, and the target section may not even be
 * in the DOM yet at the moment "/" mounts. This restores that behavior.
 */
export function useScrollToHash() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const id = hash.replace("#", "");

    const raf = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => cancelAnimationFrame(raf);
  }, [hash]);
}
