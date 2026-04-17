import type {
  ConnectionState,
  ConnectOptions,
  ConnectResult,
  EIP1193Provider,
  Stats,
  TerminalSDKConfig,
} from "./types";
import type { PlatformAdapter } from "./adapter";
import { TypedEventEmitter } from "./events";
import { generatePKCEPair } from "./pkce";
import { openPopupAndWaitForCode } from "./popup";
import { generateState } from "./redirect";
import { createWebAdapter } from "./adapters/web";

const DEFAULT_BASE_URL =
  "https://terminal-backend-git-staging-mega-eth.vercel.app";
const DEFAULT_TERMINAL_ORIGIN =
  "https://staging-terminal.megaeth.com";

type SDKEvents = {
  stateChange: ConnectionState;
  error: Error;
};

interface StoredSession {
  accessToken: string;
  profileId: string;
  tokenExpiresAt: number;
  connectedAddress: string;
}

interface RedirectSessionData {
  codeVerifier: string;
  state: string;
  returnUrl: string;
  connectedAddress: string;
}

export class TerminalClient {
  private config: TerminalSDKConfig;
  private adapter: PlatformAdapter;
  private accessToken: string | null = null;
  private tokenExpiresAt: number | null = null;
  private connectedAddress: string | null = null;
  private profileId: string | null = null;
  private connectionState: ConnectionState = "disconnected";
  private emitter = new TypedEventEmitter<SDKEvents>();
  private connectedProvider: EIP1193Provider | null = null;
  private accountsChangedHandler: ((accounts: string[]) => void) | null = null;
  private pendingConnect: Promise<ConnectResult> | null = null;

  private get storageKey(): string {
    return `terminal_session_${this.config.clientId}`;
  }

  private get redirectStorageKey(): string {
    return `terminal_redirect_${this.config.clientId}`;
  }

  private get baseUrl(): string {
    return this.config.baseUrl ?? DEFAULT_BASE_URL;
  }

  private get terminalOrigin(): string {
    return this.config.terminalOrigin ?? DEFAULT_TERMINAL_ORIGIN;
  }

  private get useCookieTransport(): boolean {
    const t = this.config.authTransport ?? "bearer";
    if (t === "auto") {
      return this.adapter.supportedModes.includes("popup");
    }
    return t === "cookie";
  }

  constructor(config: TerminalSDKConfig) {
    this.config = config;
    this.adapter = config.adapter ?? createWebAdapter();

    if (
      config.authTransport === "cookie" &&
      !this.adapter.supportedModes.includes("popup")
    ) {
      throw new Error(
        'authTransport "cookie" is only supported on web platforms. ' +
          'Use "bearer" or "auto" for React Native.'
      );
    }
  }

  async connect(
    provider: EIP1193Provider,
    options?: ConnectOptions
  ): Promise<ConnectResult> {
    if (this.pendingConnect) return this.pendingConnect;
    this.pendingConnect = this.connectInner(provider, options).finally(() => {
      this.pendingConnect = null;
    });
    return this.pendingConnect;
  }

  private async connectInner(
    provider: EIP1193Provider,
    options?: ConnectOptions
  ): Promise<ConnectResult> {
    // If already connected (e.g. from redirect callback or restored session),
    // verify the wallet still matches and attach provider for account monitoring.
    if (
      this.connectionState === "connected" &&
      (this.accessToken || this.useCookieTransport) &&
      this.connectedAddress &&
      this.profileId &&
      this.tokenExpiresAt
    ) {
      const accounts = (await provider.request({
        method: "eth_accounts",
      })) as string[];
      const currentWallet = accounts[0]?.toLowerCase();

      if (!currentWallet || currentWallet !== this.connectedAddress.toLowerCase()) {
        // Wallet changed — tear down session and proceed with fresh auth
        await this.clearSession();
        this.accessToken = null;
        this.profileId = null;
        this.tokenExpiresAt = null;
        this.connectedAddress = null;
        this.unsubscribeAccountChanges();
        this.setState("disconnected");
      } else {
        this.subscribeAccountChanges(provider);
        return {
          accessToken: this.useCookieTransport ? "" : this.accessToken!,
          expiresIn: Math.floor((this.tokenExpiresAt - Date.now()) / 1000),
          profileId: this.profileId,
        };
      }
    }

    this.setState("connecting");

    // Choose the auth mode. When the caller doesn't specify, fall back
    // to the adapter's preferred default (first entry in `supportedModes`).
    // When the caller does specify, validate against the adapter's
    // capabilities so a consumer on React Native can't accidentally
    // request popup mode and crash on `window is not defined`.
    const mode = options?.mode ?? this.adapter.supportedModes[0];
    if (!this.adapter.supportedModes.includes(mode)) {
      this.setState("disconnected");
      throw new Error(
        `Connect mode "${mode}" is not supported by the active platform adapter ` +
          `(supported: ${this.adapter.supportedModes.join(", ")})`
      );
    }

    try {
      const address = await this.getAddress(provider);

      const { challengeId, message } = await this.requestNonce(address);

      const { codeVerifier, codeChallenge } = await generatePKCEPair(
        this.adapter.crypto
      );

      const signature = await this.signMessage(provider, address, message);

      let redirectUri: string | undefined;
      let state: string | undefined;

      if (mode === "redirect") {
        redirectUri = options?.redirectUri ?? this.adapter.getDefaultRedirectUri();
        state = generateState(this.adapter.crypto);
      }

      const verifyResult = await this.verifySignature(
        challengeId,
        signature,
        codeChallenge,
        redirectUri,
        state
      );

      let authCode: string;

      if (verifyResult.status === "linked" && verifyResult.code) {
        authCode = verifyResult.code;
      } else if (mode === "redirect") {
        const authorizeUrl = verifyResult.authorizeUrl;
        if (!authorizeUrl) {
          throw new Error("No authorizeUrl returned for redirect flow");
        }

        const expectedOrigin = this.parseOriginOrThrow(
          this.terminalOrigin,
          "terminalOrigin"
        );
        const redirectOrigin = this.parseOriginOrThrow(
          authorizeUrl,
          "authorizeUrl"
        );
        if (redirectOrigin !== expectedOrigin) {
          throw new Error(
            `authorizeUrl origin mismatch: expected ${expectedOrigin}, got ${redirectOrigin}`
          );
        }

        // Persist the PKCE verifier + state so the navigate-away (web) flow
        // can recover them after the consent page redirects back. The
        // in-process (React Native) flow doesn't strictly need this, but
        // writing it unconditionally keeps the code path uniform.
        await this.saveRedirectData({
          codeVerifier,
          state: state!,
          returnUrl: redirectUri!,
          connectedAddress: address,
        });

        const sessionResult = await this.adapter.openAuthSession(
          authorizeUrl,
          redirectUri!
        );

        // Navigate-away adapters (web) never resolve this promise; the
        // page is unloading. We only get here on in-process adapters
        // (React Native), in which case the redirect callback came back
        // with the code+state inside the same connect() call.
        if (!sessionResult) {
          throw new Error(
            "openAuthSession returned no result on a non-navigating adapter"
          );
        }

        if (sessionResult.state !== state) {
          throw new Error("State mismatch — possible CSRF attack");
        }

        // Drop the ephemeral redirect data we wrote pre-flight; in-process
        // adapters never need it again.
        await this.loadAndClearRedirectData();

        authCode = sessionResult.code;
      } else {
        const expectedOrigin = this.parseOriginOrThrow(
          this.terminalOrigin,
          "terminalOrigin"
        );
        const popupUrl = verifyResult.authorizeUrl
          ? new URL(verifyResult.authorizeUrl, expectedOrigin).toString()
          : `${expectedOrigin}/authorize?challenge_id=${encodeURIComponent(
              challengeId
            )}`;
        const popupOrigin = this.parseOriginOrThrow(popupUrl, "authorizeUrl");

        if (popupOrigin !== expectedOrigin) {
          throw new Error(
            `authorizeUrl origin mismatch: expected ${expectedOrigin}, got ${popupOrigin}`
          );
        }

        authCode = await openPopupAndWaitForCode({
          url: popupUrl,
          expectedOrigin,
        });
      }

      const result = await this.exchangeToken(authCode, codeVerifier);

      this.accessToken = result.accessToken;
      this.profileId = result.profileId;
      this.tokenExpiresAt = Date.now() + result.expiresIn * 1000;
      this.connectedAddress = address;
      await this.saveSession();
      this.subscribeAccountChanges(provider);
      this.setState("connected");

      return result;
    } catch (err) {
      await this.clearSession();
      this.accessToken = null;
      this.profileId = null;
      this.tokenExpiresAt = null;
      this.connectedAddress = null;
      this.unsubscribeAccountChanges();
      this.setState("disconnected");
      const error =
        err instanceof Error ? err : new Error(String(err));
      this.emitter.emit("error", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.accessToken && !this.useCookieTransport) {
      throw new Error("Not connected");
    }

    if (this.useCookieTransport) {
      try {
        await this.fetchJSON("POST", "/api/v1/auth/logout", undefined, true);
      } catch {
        // Best effort — clear local state regardless.
      }
    }

    await this.clearSession();
    this.accessToken = null;
    this.profileId = null;
    this.tokenExpiresAt = null;
    this.connectedAddress = null;
    this.unsubscribeAccountChanges();
    this.setState("disconnected");
  }



  async getStats(): Promise<Stats> {
    if ((!this.accessToken && !this.useCookieTransport) || !this.profileId || this.isTokenExpired()) {
      throw new Error("Not connected");
    }
    return this.fetchJSON<Stats>(
      "GET",
      `/api/v1/profiles/${this.profileId}/stats`,
      undefined,
      true
    );
  }

  private isTokenExpired(): boolean {
    return this.tokenExpiresAt !== null && Date.now() >= this.tokenExpiresAt;
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  getConnectedAddress(): string | null {
    return this.connectedAddress;
  }

  getProfileId(): string | null {
    return this.profileId;
  }

  async restoreSession(provider?: EIP1193Provider): Promise<boolean> {
    if (this.connectionState === "connected") {
      return true;
    }

    if (this.useCookieTransport) {
      return this.restoreSessionFromCookie(provider);
    }

    try {
      const raw = await this.adapter.persistent.getItem(this.storageKey);
      if (!raw) return false;

      const data: StoredSession = JSON.parse(raw);

      if (
        typeof data.accessToken !== "string" ||
        typeof data.profileId !== "string" ||
        typeof data.tokenExpiresAt !== "number" ||
        typeof data.connectedAddress !== "string"
      ) {
        await this.clearSession();
        return false;
      }

      if (Date.now() >= data.tokenExpiresAt) {
        await this.clearSession();
        return false;
      }

      // If a provider is given, verify the currently selected wallet still
      // matches the stored session before trusting it. Without this guard, a
      // user who switched wallets while the app was closed would be restored
      // as the previous wallet.
      if (provider) {
        try {
          const accounts = (await provider.request({
            method: "eth_accounts",
          })) as string[];
          const currentWallet = accounts[0]?.toLowerCase();
          if (
            !currentWallet ||
            currentWallet !== data.connectedAddress.toLowerCase()
          ) {
            await this.clearSession();
            return false;
          }
        } catch {
          await this.clearSession();
          return false;
        }
      }

      this.accessToken = data.accessToken;
      this.profileId = data.profileId;
      this.tokenExpiresAt = data.tokenExpiresAt;
      this.connectedAddress = data.connectedAddress;
      if (provider) {
        this.subscribeAccountChanges(provider);
      }
      this.setState("connected");

      return true;
    } catch {
      await this.clearSession();
      return false;
    }
  }

  private async restoreSessionFromCookie(
    provider?: EIP1193Provider
  ): Promise<boolean> {
    try {
      // Validate the cookie against the backend.
      const session = await this.fetchJSON<{
        profileId: string;
        scope?: string;
        expiresIn: number;
      }>("GET", "/api/v1/auth/session", undefined, true);

      // Load local metadata (connectedAddress) from storage.
      let connectedAddress: string | null = null;
      const raw = await this.adapter.persistent.getItem(this.storageKey);
      if (raw) {
        try {
          const data = JSON.parse(raw);
          connectedAddress = data.connectedAddress ?? null;
        } catch {
          // ignore parse errors
        }
      }

      // Verify wallet match if provider is available.
      if (provider && connectedAddress) {
        try {
          const accounts = (await provider.request({
            method: "eth_accounts",
          })) as string[];
          const currentWallet = accounts[0]?.toLowerCase();
          if (
            !currentWallet ||
            currentWallet !== connectedAddress.toLowerCase()
          ) {
            await this.clearSession();
            return false;
          }
        } catch {
          await this.clearSession();
          return false;
        }
      }

      this.accessToken = null;
      this.profileId = session.profileId;
      this.tokenExpiresAt = Date.now() + session.expiresIn * 1000;
      this.connectedAddress = connectedAddress;
      if (provider) {
        this.subscribeAccountChanges(provider);
      }
      this.setState("connected");
      return true;
    } catch {
      // Session endpoint returned 401 or network error.
      await this.clearSession();
      return false;
    }
  }

  on<K extends keyof SDKEvents>(
    event: K,
    callback: (payload: SDKEvents[K]) => void
  ): void {
    this.emitter.on(event, callback);
  }

  off<K extends keyof SDKEvents>(
    event: K,
    callback: (payload: SDKEvents[K]) => void
  ): void {
    this.emitter.off(event, callback);
  }

  openTerminalProfile(): void {
    this.adapter.openExternalUrl(`${this.terminalOrigin}/dashboard`);
  }

  // --- Private helpers ---

  private async saveSession(): Promise<void> {
    if (
      (!this.accessToken && !this.useCookieTransport) ||
      !this.profileId ||
      !this.tokenExpiresAt ||
      !this.connectedAddress
    ) {
      return;
    }
    try {
      const data: StoredSession = {
        accessToken: this.useCookieTransport ? "" : this.accessToken!,
        profileId: this.profileId,
        tokenExpiresAt: this.tokenExpiresAt,
        connectedAddress: this.connectedAddress,
      };
      await this.adapter.persistent.setItem(
        this.storageKey,
        JSON.stringify(data)
      );
    } catch {
      // Storage unavailable (SSR, privacy mode, quota exceeded, etc.)
    }
  }

  private async clearSession(): Promise<void> {
    try {
      await this.adapter.persistent.removeItem(this.storageKey);
    } catch {
      // Storage unavailable
    }
  }

  private async saveRedirectData(data: RedirectSessionData): Promise<void> {
    try {
      await this.adapter.ephemeral.setItem(
        this.redirectStorageKey,
        JSON.stringify(data)
      );
    } catch {
      // Storage unavailable
    }
  }

  private async loadAndClearRedirectData(): Promise<RedirectSessionData | null> {
    try {
      const raw = await this.adapter.ephemeral.getItem(this.redirectStorageKey);
      if (!raw) return null;
      await this.adapter.ephemeral.removeItem(this.redirectStorageKey);
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async handleRedirectCallback(): Promise<ConnectResult | null> {
    const fragment = this.adapter.consumeRedirectCallback();
    if (!fragment) return null;

    const savedData = await this.loadAndClearRedirectData();
    if (!savedData) {
      throw new Error(
        "Missing redirect session data — possible CSRF or session expired"
      );
    }

    if (fragment.state !== savedData.state) {
      throw new Error("State mismatch — possible CSRF attack");
    }

    this.setState("connecting");

    try {
      const result = await this.exchangeToken(
        fragment.code,
        savedData.codeVerifier
      );

      this.accessToken = result.accessToken;
      this.profileId = result.profileId;
      this.tokenExpiresAt = Date.now() + result.expiresIn * 1000;
      this.connectedAddress = savedData.connectedAddress;
      await this.saveSession();
      this.setState("connected");

      return result;
    } catch (err) {
      this.setState("disconnected");
      const error = err instanceof Error ? err : new Error(String(err));
      this.emitter.emit("error", error);
      throw error;
    }
  }

  private subscribeAccountChanges(provider: EIP1193Provider): void {
    this.unsubscribeAccountChanges();
    this.connectedProvider = provider;
    this.accountsChangedHandler = (accounts: string[]) => {
      const newAddress = accounts[0]?.toLowerCase();
      const currentAddress = this.connectedAddress?.toLowerCase();
      if (!newAddress || newAddress !== currentAddress) {
        // EIP-1193 listeners are sync; fire-and-forget the storage clear.
        // In-memory state is reset synchronously below so subsequent reads
        // see the disconnected state immediately.
        void this.clearSession();
        this.accessToken = null;
        this.profileId = null;
        this.tokenExpiresAt = null;
        this.connectedAddress = null;
        this.unsubscribeAccountChanges();
        this.setState("disconnected");
      }
    };
    provider.on("accountsChanged", this.accountsChangedHandler);
  }

  private unsubscribeAccountChanges(): void {
    if (this.connectedProvider && this.accountsChangedHandler) {
      this.connectedProvider.removeListener(
        "accountsChanged",
        this.accountsChangedHandler
      );
    }
    this.connectedProvider = null;
    this.accountsChangedHandler = null;
  }

  private setState(state: ConnectionState): void {
    this.connectionState = state;
    this.emitter.emit("stateChange", state);
  }

  private parseOriginOrThrow(value: string, label: string): string {
    try {
      return new URL(value).origin;
    } catch {
      throw new Error(`Invalid ${label}: ${value}`);
    }
  }

  private async getAddress(provider: EIP1193Provider): Promise<string> {
    const accounts = (await provider.request({
      method: "eth_requestAccounts",
    })) as string[];

    if (!accounts[0]) {
      throw new Error("No accounts returned by wallet");
    }

    return accounts[0];
  }

  private async requestNonce(
    address: string
  ): Promise<{ challengeId: string; nonce: string; message: string }> {
    return this.fetchJSON("POST", "/api/v1/auth/nonce", {
      wallet: address,
      clientId: this.config.clientId,
    });
  }

  private async signMessage(
    provider: EIP1193Provider,
    address: string,
    message: string
  ): Promise<string> {
    return (await provider.request({
      method: "personal_sign",
      params: [message, address],
    })) as string;
  }

  private async verifySignature(
    challengeId: string,
    signature: string,
    codeChallenge: string,
    redirectUri?: string,
    state?: string
  ): Promise<{ status: string; code?: string; authorizeUrl?: string }> {
    const body: Record<string, string> = {
      challengeId,
      signature,
      codeChallenge,
      codeChallengeMethod: "S256",
      scope: "read:stats",
    };
    if (redirectUri) body.redirectUri = redirectUri;
    if (state) body.state = state;

    return this.fetchJSON("POST", "/api/v1/auth/verify-signature", body);
  }

  private async exchangeToken(
    code: string,
    codeVerifier: string
  ): Promise<ConnectResult> {
    const res = await this.fetchJSON<{
      accessToken: string;
      tokenType: string;
      expiresIn: number;
      profileId?: string;
    }>("POST", "/api/v1/auth/token", {
      grantType: "authorization_code",
      code,
      codeVerifier,
      clientId: this.config.clientId,
    });

    // Prefer profileId from response body (required for cookie mode where
    // the JWT is HttpOnly). Fall back to JWT decode for backward compat
    // with backends that haven't been updated yet.
    const profileId = res.profileId || this.decodeProfileId(res.accessToken);

    return {
      accessToken: this.useCookieTransport ? "" : res.accessToken,
      expiresIn: res.expiresIn,
      profileId,
    };
  }

  private decodeProfileId(token: string): string {
    const parts = token.split(".");
    if (parts.length !== 3 || !parts[1]) {
      throw new Error("Invalid access token format");
    }
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    if (typeof payload.profile_id !== "string" || !payload.profile_id) {
      throw new Error("Access token missing profile_id");
    }
    return payload.profile_id;
  }

  private async fetchJSON<T>(
    method: string,
    path: string,
    body?: object,
    authenticated = false
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (authenticated && this.accessToken && !this.useCookieTransport) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        ...(this.useCookieTransport ? { credentials: "include" as RequestCredentials } : {}),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`API error ${res.status}: ${text}`);
      }

      const json = await res.json();
      return (json.data ?? json) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}
