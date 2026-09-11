/** Where to send a user once they finish signing in. */
export const DEFAULT_CALLBACK = "/dashboard";

/**
 * Narrows an untrusted `?callbackUrl=` to a same-origin path.
 *
 * The value reaches us from the query string, so anything that could leave the
 * origin has to be rejected — an absolute URL ("https://evil.example"), a
 * protocol-relative one ("//evil.example"), and the backslash variant browsers
 * normalise to the same thing ("/\evil.example"). Anything that isn't a plain
 * single-slash path falls back to the dashboard rather than erroring, because
 * a mangled redirect target should never block a valid login.
 */
export function safeCallback(raw: string | string[] | undefined | null): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || typeof value !== "string") return DEFAULT_CALLBACK;
  if (!value.startsWith("/")) return DEFAULT_CALLBACK;
  if (value.startsWith("//") || value.startsWith("/\\")) return DEFAULT_CALLBACK;
  return value;
}

/** Appends a callback to an auth route, so the destination survives a bounce
 *  between the login and register pages. Omitted when it's just the default. */
export function withCallback(path: string, callbackUrl: string): string {
  if (callbackUrl === DEFAULT_CALLBACK) return path;
  return `${path}?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}
