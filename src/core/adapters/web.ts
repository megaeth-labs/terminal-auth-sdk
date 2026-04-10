import type {
  AuthSessionSuccess,
  PlatformAdapter,
  PlatformCrypto,
  PlatformStorage,
} from "../adapter";
import { parseRedirectResult, stripRedirectParams } from "../redirect";

/**
 * Default web (browser) adapter. Mirrors the SDK's pre-adapter behavior:
 * `localStorage` for persistent session, `sessionStorage` for the redirect
 * scratch state, `crypto.subtle` for PKCE, and full-page navigation for the
 * consent step. SSR-safe — if `window` is unavailable, reads return `null`
 * and writes throw (callers wrap in try/catch, matching the existing
 * behavior in `TerminalClient`).
 */
export function createWebAdapter(): PlatformAdapter {
  return {
    persistent: webStorage(() => globalThis.localStorage),
    ephemeral: webStorage(() => globalThis.sessionStorage),
    crypto: webCrypto(),
    getDefaultRedirectUri,
    openAuthSession,
    consumeRedirectCallback,
    openExternalUrl,
  };
}

function webStorage(getStore: () => Storage | undefined): PlatformStorage {
  return {
    async getItem(key) {
      const store = getStore();
      if (!store) return null;
      return store.getItem(key);
    },
    async setItem(key, value) {
      const store = getStore();
      if (!store) throw new Error("Storage unavailable");
      store.setItem(key, value);
    },
    async removeItem(key) {
      const store = getStore();
      if (!store) return;
      store.removeItem(key);
    },
  };
}

function webCrypto(): PlatformCrypto {
  return {
    getRandomBytes(length) {
      return crypto.getRandomValues(new Uint8Array(length));
    },
    async sha256(input) {
      // Copy into a fresh Uint8Array to guarantee an ArrayBuffer-backed
      // BufferSource (TS strict mode rejects SharedArrayBuffer-typed views).
      const copy = new Uint8Array(input);
      const digest = await crypto.subtle.digest("SHA-256", copy);
      return new Uint8Array(digest);
    },
  };
}

function getDefaultRedirectUri(): string {
  return (
    window.location.origin +
    window.location.pathname +
    window.location.search
  );
}

function openAuthSession(
  authorizeUrl: string,
  _redirectUri: string
): Promise<AuthSessionSuccess | null> {
  // Navigate-away flow. The page is unloading; the returned Promise
  // intentionally never resolves. On the next page load,
  // `TerminalClient.handleRedirectCallback()` finishes the flow by reading
  // the URL params left behind by the consent page redirect.
  window.location.href = authorizeUrl;
  return new Promise(() => {});
}

function consumeRedirectCallback(): AuthSessionSuccess | null {
  if (typeof window === "undefined") return null;
  const result = parseRedirectResult(window.location.search);
  if (!result) return null;
  const cleaned = stripRedirectParams(window.location.href);
  window.history.replaceState(null, "", cleaned);
  return result;
}

function openExternalUrl(url: string): void {
  if (typeof window !== "undefined") {
    window.open(url, "_blank");
  }
}
