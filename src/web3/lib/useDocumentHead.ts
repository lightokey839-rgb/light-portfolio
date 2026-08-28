import { useEffect } from "react";

/**
 * Sets the page title and meta description for SEO without pulling in a
 * dependency like react-helmet. Restores the previous title on unmount so
 * navigating back to the homepage doesn't leave a stale title behind.
 */
export function useDocumentHead(title: string, description: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    const previousDescription = meta?.getAttribute("content") ?? null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    return () => {
      document.title = previousTitle;
      if (meta && previousDescription !== null) meta.setAttribute("content", previousDescription);
    };
  }, [title, description]);
}
