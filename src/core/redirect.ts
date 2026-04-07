const STATE_CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

export function generateState(length = 32): string {
  const random = crypto.getRandomValues(new Uint8Array(length));
  let result = "";
  for (let i = 0; i < length; i++) {
    result += STATE_CHARSET[random[i] % STATE_CHARSET.length];
  }
  return result;
}

export function parseRedirectFragment(): {
  code: string;
  state: string;
} | null {
  if (typeof window === "undefined") return null;

  const hash = window.location.hash;
  if (!hash || hash.length < 2) return null;

  const params = new URLSearchParams(hash.substring(1));
  const code = params.get("code");
  const state = params.get("state");

  if (!code || !state) return null;

  return { code, state };
}

export function stripFragment(): void {
  if (typeof window === "undefined") return;
  window.history.replaceState(
    null,
    "",
    window.location.pathname + window.location.search
  );
}
