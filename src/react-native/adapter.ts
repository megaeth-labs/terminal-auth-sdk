import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
  AuthSessionSuccess,
  PlatformAdapter,
  PlatformCrypto,
  PlatformStorage,
} from "../core/adapter";
import { parseRedirectResult } from "../core/redirect";

/**
 * Options for customizing the Expo adapter. Every field is optional —
 * leave them all unset to get the default behavior described in
 * `createExpoAdapter` below. Pass overrides to substitute individual
 * services (useful for tests or for advanced integrations that want to
 * keep everything else).
 */
export interface CreateExpoAdapterOptions {
  /**
   * Path segment to append to the app's registered deep link scheme when
   * building the default redirect URI. Defaults to `"terminal-auth"`.
   * The consumer must also register the matching scheme in `app.json`
   * (the `expo.scheme` field) so the OS routes the callback back into
   * the app.
   */
  redirectPath?: string;
  /**
   * Override the persistent storage (access token + profile id). Defaults
   * to `expo-secure-store` (iOS Keychain / Android Keystore). If
   * SecureStore is unavailable on the current platform (e.g. Expo web
   * preview), the default backend refuses to run rather than silently
   * falling back to plaintext disk storage.
   *
   * To opt into plaintext AsyncStorage explicitly — for example on a
   * platform that lacks SecureStore and where the consumer has decided
   * the trade-off is acceptable — pass `createAsyncStorageBackend()`.
   * Doing so is a conscious choice to store bearer tokens in plaintext.
   */
  persistent?: PlatformStorage;
  /**
   * Override the ephemeral (single-flow) storage. Defaults to an
   * in-memory `Map` — the redirect flow on React Native is in-process,
   * so PKCE scratch state does not need to survive a process restart.
   */
  ephemeral?: PlatformStorage;
  /** Override the crypto implementation. Defaults to `expo-crypto`. */
  crypto?: PlatformCrypto;
}

/**
 * Build a `PlatformAdapter` backed by Expo's native modules.
 *
 * Intended for use with `TerminalClient` in a React Native (Expo) app.
 * The consumer is responsible for installing the required peer
 * dependencies (`expo-crypto`, `expo-web-browser`, `expo-linking`,
 * `expo-secure-store`, `@react-native-async-storage/async-storage`) at
 * versions compatible with their Expo SDK — see this package's
 * `peerDependencies` in `package.json`.
 *
 * The redirect path appended to the app's deep link scheme defaults to
 * `"terminal-auth"` (yielding e.g. `myapp://terminal-auth`). The
 * matching `expo.scheme` must be registered in the consumer's
 * `app.json`, and the full redirect URI must be allowlisted on the
 * Terminal backend for the consumer's `clientId`.
 */
export function createExpoAdapter(
  options: CreateExpoAdapterOptions = {}
): PlatformAdapter {
  const redirectPath = options.redirectPath ?? "terminal-auth";

  return {
    persistent: options.persistent ?? createSecureStoreBackend(),
    ephemeral: options.ephemeral ?? createMemoryStorage(),
    crypto: options.crypto ?? createExpoCrypto(),
    getDefaultRedirectUri: () => Linking.createURL(redirectPath),
    openAuthSession,
    consumeRedirectCallback,
    openExternalUrl,
  };
}

/**
 * The default persistent storage: SecureStore only. If SecureStore is
 * not available on the current platform (e.g. Expo web preview), every
 * read/write rejects with a descriptive error rather than falling back
 * to plaintext AsyncStorage. Consumers who genuinely want AsyncStorage
 * must opt in via `createExpoAdapter({ persistent: createAsyncStorageBackend() })`.
 *
 * Availability is probed lazily on first access so that adapter
 * construction remains synchronous; the check is cached after the
 * first call.
 */
function createSecureStoreBackend(): PlatformStorage {
  let checked: Promise<void> | null = null;

  const ensureAvailable = (): Promise<void> => {
    if (!checked) {
      checked = SecureStore.isAvailableAsync().then(
        (available) => {
          if (!available) {
            throw new Error(
              "[terminal-auth-sdk] expo-secure-store is not available on this platform. " +
                "SecureStore is required to persist bearer tokens securely. " +
                "If this is an expected environment (e.g. Expo web preview), " +
                "opt into plaintext storage explicitly by passing " +
                "`persistent: createAsyncStorageBackend()` to `createExpoAdapter`."
            );
          }
        },
        (cause) => {
          throw new Error(
            "[terminal-auth-sdk] expo-secure-store availability check failed: " +
              String(cause)
          );
        }
      );
    }
    return checked;
  };

  return {
    async getItem(key) {
      await ensureAvailable();
      return SecureStore.getItemAsync(normalizeSecureStoreKey(key));
    },
    async setItem(key, value) {
      await ensureAvailable();
      await SecureStore.setItemAsync(normalizeSecureStoreKey(key), value);
    },
    async removeItem(key) {
      await ensureAvailable();
      await SecureStore.deleteItemAsync(normalizeSecureStoreKey(key));
    },
  };
}

/**
 * Opt-in AsyncStorage backend. Not used by default. Exported so that
 * consumers who want to run on platforms without SecureStore can make
 * the trade-off explicit:
 *
 *   createExpoAdapter({ persistent: createAsyncStorageBackend() })
 *
 * Storing bearer tokens in AsyncStorage means they land in plaintext on
 * disk and are readable by any other code with access to the app's
 * sandbox. Consider whether that is acceptable for your threat model
 * before using this.
 */
export function createAsyncStorageBackend(): PlatformStorage {
  return {
    getItem: (key) => AsyncStorage.getItem(key),
    setItem: (key, value) => AsyncStorage.setItem(key, value),
    removeItem: (key) => AsyncStorage.removeItem(key),
  };
}

/**
 * SecureStore keys on iOS/Android accept only alphanumerics plus
 * `.-_`. The SDK's storage keys (e.g. `terminal_session_<clientId>`)
 * may contain characters outside this set depending on the clientId,
 * so non-matching characters are collapsed to `_` to produce a safe
 * key. Collisions between substitutions are acceptable because the
 * clientId is fixed per app install, so only one key ever exists.
 */
function normalizeSecureStoreKey(key: string): string {
  return key.replace(/[^A-Za-z0-9._-]/g, "_");
}

/**
 * In-memory storage used for ephemeral (single-flow) state. The
 * redirect flow on React Native resolves inside a single `connect()`
 * call, so this state never needs to outlive the current process.
 */
function createMemoryStorage(): PlatformStorage {
  const store = new Map<string, string>();
  return {
    async getItem(key) {
      return store.get(key) ?? null;
    },
    async setItem(key, value) {
      store.set(key, value);
    },
    async removeItem(key) {
      store.delete(key);
    },
  };
}

function createExpoCrypto(): PlatformCrypto {
  return {
    getRandomBytes(length) {
      // expo-crypto's `getRandomBytes` is a synchronous native call on
      // iOS/Android/web. In development with the JS debugger attached
      // it falls back to `Math.random` — a reminder that production
      // builds must be used for any security-critical flow. The upper
      // bound is 1024 bytes; the SDK never asks for more than 128.
      return Crypto.getRandomBytes(length);
    },
    async sha256(input) {
      const digest = await Crypto.digest(
        Crypto.CryptoDigestAlgorithm.SHA256,
        input
      );
      return new Uint8Array(digest);
    },
  };
}

async function openAuthSession(
  authorizeUrl: string,
  redirectUri: string
): Promise<AuthSessionSuccess | null> {
  const result = await WebBrowser.openAuthSessionAsync(
    authorizeUrl,
    redirectUri
  );

  if (result.type !== "success") {
    throw new Error(
      `Terminal auth session did not complete (type=${result.type})`
    );
  }

  const queryIndex = result.url.indexOf("?");
  const search = queryIndex === -1 ? "" : result.url.slice(queryIndex);
  const parsed = parseRedirectResult(search);
  if (!parsed) {
    throw new Error(
      "Terminal auth session returned a URL without code/state params"
    );
  }
  return parsed;
}

function consumeRedirectCallback(): AuthSessionSuccess | null {
  // React Native resolves the redirect flow in-process inside
  // `openAuthSession`, so there is never an inbound URL for
  // `TerminalClient.handleRedirectCallback()` to consume on a later
  // mount. This is always a no-op.
  return null;
}

function openExternalUrl(url: string): void {
  // Fire-and-forget: Linking.openURL returns a Promise but the
  // PlatformAdapter contract is sync. Surface errors via console so
  // they're not silently swallowed.
  Linking.openURL(url).catch((err) => {
    console.warn("[terminal-auth-sdk] Linking.openURL failed", err);
  });
}
