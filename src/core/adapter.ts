/**
 * Platform abstraction for the SDK.
 *
 * The core `TerminalClient` is intended to run on web (browser), React Native
 * (Expo), and potentially other JS environments. Each platform supplies a
 * `PlatformAdapter` that wires up storage, crypto, and the auth-session
 * navigation step. The default web adapter mirrors the SDK's pre-adapter
 * behavior bit-for-bit, so existing browser consumers see no change.
 */

export interface PlatformStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface PlatformCrypto {
  /** Cryptographically secure random bytes. */
  getRandomBytes(length: number): Uint8Array;
  /** SHA-256 digest of the input bytes. */
  sha256(input: Uint8Array): Promise<Uint8Array>;
}

/**
 * The result of opening the consent page and waiting for the redirect back.
 * Returned by `PlatformAdapter.openAuthSession`.
 */
export interface AuthSessionSuccess {
  code: string;
  state: string;
}

export interface PlatformAdapter {
  /** Long-lived session storage (web: `localStorage`). */
  persistent: PlatformStorage;
  /** Single-flow scratch storage (web: `sessionStorage`). */
  ephemeral: PlatformStorage;
  /** Cryptographic primitives. */
  crypto: PlatformCrypto;

  /**
   * Default redirect URI when the consumer doesn't pass one to `connect`.
   * Web returns the current page URL; React Native returns the app's
   * registered deep link.
   */
  getDefaultRedirectUri(): string;

  /**
   * Open the Terminal consent page and wait for the redirect back.
   *
   * Two valid behaviors:
   *
   * 1. **Navigate-away (web)**: set `window.location.href = authorizeUrl` and
   *    return a never-resolving Promise. The page is unloading; on the next
   *    page load, `TerminalClient.handleRedirectCallback()` finishes the flow
   *    by reading the URL params left behind.
   *
   * 2. **In-process (React Native)**: open an in-app browser
   *    (`WebBrowser.openAuthSessionAsync`) that resolves with the callback URL
   *    when the OS sees the registered deep link. Parse `code` + `state` from
   *    that URL and return them. The flow finishes inside the same `connect`
   *    Promise — `handleRedirectCallback` is never called.
   */
  openAuthSession(
    authorizeUrl: string,
    redirectUri: string
  ): Promise<AuthSessionSuccess | null>;

  /**
   * Open an external URL (e.g. the Terminal dashboard).
   * Web: `window.open(url, "_blank")`. React Native: `Linking.openURL(url)`.
   */
  openExternalUrl(url: string): void;
}
