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

export function parseRedirectResult(): {
  code: string;
  state: string;
} | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");

  if (!code || !state) return null;

  return { code, state };
}

export function stripRedirectParams(): void {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  window.history.replaceState(null, "", url.pathname + url.search + url.hash);
}
