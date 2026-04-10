import type { PlatformCrypto } from "./adapter";

const STATE_CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

// Rejection sampling: only accept bytes below `max` so the modulo distribution
// across `STATE_CHARSET` is uniform. Same approach as `generateRandomString`
// in pkce.ts — both generate OAuth-related random tokens that need an even
// distribution across the URL-safe alphabet.
export function generateState(
  crypto: PlatformCrypto,
  length = 32
): string {
  const max = Math.floor(256 / STATE_CHARSET.length) * STATE_CHARSET.length;
  let result = "";
  while (result.length < length) {
    const buf = crypto.getRandomBytes(length);
    for (let i = 0; i < buf.length && result.length < length; i++) {
      if (buf[i] < max) {
        result += STATE_CHARSET[buf[i] % STATE_CHARSET.length];
      }
    }
  }
  return result;
}

/**
 * Parse the `code` and `state` query params from a URL search string
 * (e.g. `window.location.search`). Returns null if either is missing.
 */
export function parseRedirectResult(
  search: string
): { code: string; state: string } | null {
  const params = new URLSearchParams(search);
  const code = params.get("code");
  const state = params.get("state");

  if (!code || !state) return null;

  return { code, state };
}

/**
 * Given a full URL, return the path+search+hash with `code` and `state`
 * query params removed. Caller is responsible for actually replacing the
 * URL in whichever way is appropriate (e.g. `window.history.replaceState`).
 */
export function stripRedirectParams(href: string): string {
  const url = new URL(href);
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  return url.pathname + url.search + url.hash;
}
