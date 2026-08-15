import { useCallback, useEffect, useState, type DependencyList } from "react";

type Status = "loading" | "ready" | "error";

interface ResourceState<T> {
  data: T | null;
  status: Status;
  errorMessage: string | null;
  reload: () => void;
}

/**
 * Fetches on mount and exposes loading/ready/error state plus a `reload`
 * you can wire to a "Retry" button. Each admin section owns its own
 * instance, so one section failing to load never blocks the others —
 * this is what lets the dashboard show partial data instead of an
 * all-or-nothing spinner.
 *
 * Pass `deps` when the fetcher closes over state that should trigger a
 * refetch when it changes (search text, filters, page number) — e.g.
 * `useAdminResource(() => listProjects({ q }), [q])`. Omit it for a
 * fetch-once-on-mount resource, as most callers do.
 */
export function useAdminResource<T>(
  fetcher: () => Promise<T>,
  deps: DependencyList = []
): ResourceState<T> {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setErrorMessage(null);

    fetcher()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setStatus("ready");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, ...deps]);

  return { data, status, errorMessage, reload };
}
