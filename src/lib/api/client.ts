export const API_URL = import.meta.env.VITE_API_URL;

// The API base includes /api/v1, but uploaded media is served from the
// API's root (e.g. /uploads/abc.jpg) — strip the version prefix once here
// rather than re-deriving it everywhere an image needs to be displayed.
const ASSET_BASE_URL = API_URL.replace(/\/api\/v\d+\/?$/, "");

/**
 * Turns a stored imageUrl/videoUrl into something an <img>/<video> src can
 * use. Absolute URLs (someone pasted an external link) pass through
 * unchanged; root-relative paths (from our own upload endpoint) get the
 * API's origin prefixed on.
 */
export function resolveAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${ASSET_BASE_URL}${url}`;
}

/**
 * Thrown for every non-2xx response. Carries the same `code` the backend
 * sends (e.g. "INVALID_CREDENTIALS", "UNAUTHENTICATED", "VALIDATION_ERROR")
 * so callers can branch on it instead of parsing message strings.
 */
export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
}

/**
 * Every admin API call goes through here. `credentials: "include"` is
 * required on every request, not just login, so the httpOnly session
 * cookie rides along automatically — nothing in this app ever touches
 * the token itself.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      credentials: "include",
      headers: options.body ? { "Content-Type": "application/json" } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    // Network failure — API unreachable, CORS misconfigured, offline, etc.
    throw new ApiError(0, "NETWORK_ERROR", "Couldn't reach the server. Check your connection.");
  }

  // 204s and logout-style empty responses have nothing to parse.
  const raw = await response.text();
  const data = raw ? JSON.parse(raw) : null;

  if (!response.ok) {
    const message = data?.error?.message ?? "Something went wrong. Please try again.";
    const code = data?.error?.code ?? "UNKNOWN_ERROR";
    throw new ApiError(response.status, code, message, data?.error?.details);
  }

  return data as T;
}
