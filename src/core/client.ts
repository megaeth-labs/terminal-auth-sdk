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

// Injected by Vite `define` (see `vite.config.ts`) — the identifier is
// replaced with a string literal at bundle time, so no runtime global
// actually exists. Declared here so both `tsc` passes type-check.
declare const __SDK_VERSION__: string;

const DEFAULT_BASE_URL =
  "https://terminal-backend-six.vercel.app";
const DEFAULT_TERMINAL_ORIGIN =
  "https://terminal.megaeth.com";

type SDKEvents = {
  stateChange: ConnectionState;
  error: Error;
};

interface StoredSession {
  accessToken: string;
  profileId: string;
  tokenExpiresAt: number;
  connectedAddress: string;
  // Optional so sessions persisted by older SDK versions (no refresh token
  // in the wire response) still parse cleanly. Restore treats missing
  // fields as "no refresh available" — once the access token expires the
  // user has to log in again.
  refreshToken?: string;
  refreshTokenExpiresAt?: number;
}

// Refresh proactively if the access token expires within this window.
// Small enough that we don't burn refresh tokens unnecessarily, large
// enough that an in-flight request never lands with a just-expired token.
const REFRESH_BEFORE_EXPIRY_MS = 60 * 1000;

interface RedirectSessionData {
  codeVerifier: string;
  state: string;
  returnUrl: string;
  connectedAddress: string;
}

// Internal token-exchange result. Carries refresh-token fields that the
// public ConnectResult intentionally hides (refresh handling is an SDK
// concern, not something consumers should reach into).
interface TokenExchangeResult {
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
  refreshExpiresIn?: number;
  profileId: string;
}

export class TerminalClient {
  private config: TerminalSDKConfig;
  private adapter: PlatformAdapter;
  private accessToken: string | null = null;
  private tokenExpiresAt: number | null = null;
  private refreshToken: string | null = null;
  private refreshTokenExpiresAt: number | null = null;
  private connectedAddress: string | null = null;
  private profileId: string | null = null;
  private connectionState: ConnectionState = "disconnected";
  private emitter = new TypedEventEmitter<SDKEvents>();
  private connectedProvider: EIP1193Provider | null = null;
  private accountsChangedHandler: ((accounts: string[]) => void) | null = null;
  private pendingConnect: Promise<ConnectResult> | null = null;
  // In-flight refresh dedupe: concurrent expired-request retries collapse
  // to a single network call. Mirrors the pendingConnect pattern above.
  private pendingRefresh: Promise<void> | null = null;

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

  constructor(config: TerminalSDKConfig) {
    this.config = config;
    this.adapter = config.adapter ?? createWebAdapter();

    const authTransport = config.authTransport as string | undefined;
    if (authTransport && authTransport !== "bearer") {
      throw new Error(
        `authTransport "${authTransport}" is disabled. Use "bearer".`
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
      this.accessToken &&
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
        this.resetSessionState();
        this.unsubscribeAccountChanges();
        this.setState("disconnected");
      } else {
        this.subscribeAccountChanges(provider);
        return {
          accessToken: this.accessToken,
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

      this.hydrateTokens(result);
      this.connectedAddress = address;
      await this.saveSession();
      this.subscribeAccountChanges(provider);
      this.setState("connected");

      return this.toConnectResult(result);
    } catch (err) {
      await this.clearSession();
      this.resetSessionState();
      this.unsubscribeAccountChanges();
      this.setState("disconnected");
      const error =
        err instanceof Error ? err : new Error(String(err));
      this.emitter.emit("error", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.accessToken) {
      throw new Error("Not connected");
    }

    await this.clearSession();
    this.resetSessionState();
    this.unsubscribeAccountChanges();
    this.setState("disconnected");
  }



  async getStats(): Promise<Stats> {
    // We accept an expired access token here when a refresh token is
    // available — fetchJSON will silently rotate before sending.
    // "Not connected" should mean "no credentials at all", not "the
    // access token happens to be past its TTL".
    if (
      !this.accessToken ||
      !this.profileId ||
      (this.isTokenExpired() && !this.isRefreshTokenUsable())
    ) {
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

    try {
      const raw = await this.adapter.persistent.getItem(this.storageKey);
      if (!raw) return false;

      const data: StoredSession = JSON.parse(raw);

      if (
        typeof data.accessToken !== "string" ||
        !data.accessToken ||
        typeof data.profileId !== "string" ||
        typeof data.tokenExpiresAt !== "number" ||
        typeof data.connectedAddress !== "string"
      ) {
        await this.clearSession();
        return false;
      }

      const now = Date.now();
      const accessValid = now < data.tokenExpiresAt;
      const refreshUsable =
        typeof data.refreshToken === "string" &&
        data.refreshToken.length > 0 &&
        (typeof data.refreshTokenExpiresAt !== "number" ||
          now < data.refreshTokenExpiresAt);

      // Both access and refresh dead → nothing to restore.
      if (!accessValid && !refreshUsable) {
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
      this.refreshToken = data.refreshToken ?? null;
      this.refreshTokenExpiresAt = data.refreshTokenExpiresAt ?? null;

      // Legacy migration: a still-valid access token with no refresh
      // token means this session was minted by a pre-refresh-token SDK
      // build (or the backend's pre-refresh-token deploy). One-shot
      // /auth/upgrade swaps it for a fresh access + refresh pair with
      // a real refresh-token chain. Failure is treated as "session
      // unrecoverable, log in again" — same fallback as today's UX
      // before this change shipped.
      //
      // TODO(refresh-token-migration): remove this branch ~30d after
      // backend deploy when no legacy 24h tokens remain in any client's
      // localStorage. The /auth/upgrade endpoint is being retired on
      // the same schedule; see backend handler comment.
      if (accessValid && !refreshUsable) {
        try {
          await this.upgradeLegacySession();
        } catch {
          await this.clearSession();
          this.resetSessionState();
          return false;
        }
      } else if (this.isAccessTokenExpiringSoon() && this.isRefreshTokenUsable()) {
        // Non-legacy path: access is dead or about to die — rotate
        // before handing control back to the caller. Doing this here
        // means the first authenticated call after restore lands on a
        // fresh token instead of paying a guaranteed 401-and-retry
        // round-trip.
        try {
          await this.refreshAccessToken();
        } catch {
          await this.clearSession();
          this.resetSessionState();
          return false;
        }
      }

      if (provider) {
        this.subscribeAccountChanges(provider);
      }
      this.setState("connected");

      return true;
    } catch {
      await this.clearSession();
      this.resetSessionState();
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
    this.adapter.openExternalUrl(`${this.terminalOrigin}/cluster`);
  }

  // --- Private helpers ---

  private hydrateTokens(result: TokenExchangeResult): void {
    this.accessToken = result.accessToken;
    this.profileId = result.profileId;
    this.tokenExpiresAt = Date.now() + result.expiresIn * 1000;
    this.refreshToken = result.refreshToken ?? null;
    this.refreshTokenExpiresAt =
      typeof result.refreshExpiresIn === "number"
        ? Date.now() + result.refreshExpiresIn * 1000
        : null;
  }

  private toConnectResult(result: TokenExchangeResult): ConnectResult {
    return {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      profileId: result.profileId,
    };
  }

  private async saveSession(): Promise<void> {
    if (
      !this.accessToken ||
      !this.profileId ||
      !this.tokenExpiresAt ||
      !this.connectedAddress
    ) {
      return;
    }
    try {
      const data: StoredSession = {
        accessToken: this.accessToken,
        profileId: this.profileId,
        tokenExpiresAt: this.tokenExpiresAt,
        connectedAddress: this.connectedAddress,
      };
      // Only persist refresh fields when present so older sessions stay
      // recognisable on disk and the JSON shape matches what restoreSession
      // expects. Missing fields = "no refresh available", same as before.
      if (this.refreshToken) {
        data.refreshToken = this.refreshToken;
      }
      if (this.refreshTokenExpiresAt !== null) {
        data.refreshTokenExpiresAt = this.refreshTokenExpiresAt;
      }
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

      this.hydrateTokens(result);
      this.connectedAddress = savedData.connectedAddress;
      await this.saveSession();
      this.setState("connected");

      return this.toConnectResult(result);
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
        this.resetSessionState();
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

  private resetSessionState(): void {
    this.accessToken = null;
    this.profileId = null;
    this.tokenExpiresAt = null;
    this.refreshToken = null;
    this.refreshTokenExpiresAt = null;
    this.connectedAddress = null;
  }

  private setState(state: ConnectionState): void {
    this.connectionState = state;
    this.emitter.emit("stateChange", state);
  }

  private isAccessTokenExpiringSoon(): boolean {
    if (this.tokenExpiresAt === null) return true;
    return Date.now() >= this.tokenExpiresAt - REFRESH_BEFORE_EXPIRY_MS;
  }

  private isRefreshTokenUsable(): boolean {
    if (!this.refreshToken) return false;
    if (this.refreshTokenExpiresAt === null) {
      // Server didn't tell us refresh expiry — trust the token's own
      // signature lifetime and let the server reject it if expired.
      return true;
    }
    return Date.now() < this.refreshTokenExpiresAt;
  }

  /**
   * Rotate the access (and refresh) tokens by calling /auth/refresh.
   * Concurrent callers collapse to a single network round-trip via the
   * pendingRefresh guard. Awaits saveSession before resolving so a tab
   * close mid-rotation never leaves the SDK with the old refresh token
   * in storage and the new one lost.
   */
  private refreshAccessToken(): Promise<void> {
    if (this.pendingRefresh) return this.pendingRefresh;
    this.pendingRefresh = this.refreshAccessTokenInner().finally(() => {
      this.pendingRefresh = null;
    });
    return this.pendingRefresh;
  }

  private async refreshAccessTokenInner(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error("No refresh token available");
    }
    const res = await this.fetchJSON<{
      accessToken: string;
      tokenType: string;
      expiresIn: number;
      refreshToken?: string;
      refreshExpiresIn?: number;
      profileId?: string;
    }>("POST", "/api/v1/auth/refresh", {
      refreshToken: this.refreshToken,
    });

    this.accessToken = res.accessToken;
    this.tokenExpiresAt = Date.now() + res.expiresIn * 1000;
    if (res.refreshToken) {
      this.refreshToken = res.refreshToken;
    }
    if (typeof res.refreshExpiresIn === "number") {
      this.refreshTokenExpiresAt = Date.now() + res.refreshExpiresIn * 1000;
    }
    // Persist BEFORE resolving so a crash here doesn't lose the rotated
    // refresh token. Without this guarantee a tab-close mid-rotation
    // would leave the old (already-rotated-past) token in storage and
    // the next refresh attempt would 401.
    await this.saveSession();
  }

  /**
   * One-shot migration for sessions persisted by a pre-refresh-token SDK
   * build. Calls POST /auth/upgrade with the legacy access token in the
   * Authorization header (the backend's standard Auth() middleware
   * validates it via the access secret). On success we replace the
   * single-token state with a fresh access + refresh pair and persist.
   *
   * Only valid as long as the legacy access token is still alive — caller
   * (restoreSession) gates on accessValid before invoking. Backend rejects
   * new short access tokens (typ:"access") at this endpoint to prevent a
   * leaked 15-min credential being promoted into a 30-day refresh; that
   * rejection bubbles up here as an API error and the caller clears.
   *
   * TODO(refresh-token-migration): delete alongside the /auth/upgrade
   * endpoint ~30d after backend deploy.
   */
  private async upgradeLegacySession(): Promise<void> {
    if (!this.accessToken) {
      throw new Error("No access token available for upgrade");
    }
    const res = await this.fetchJSON<{
      accessToken: string;
      tokenType: string;
      expiresIn: number;
      refreshToken?: string;
      refreshExpiresIn?: number;
      profileId?: string;
    }>("POST", "/api/v1/auth/upgrade", undefined, true);

    this.accessToken = res.accessToken;
    this.tokenExpiresAt = Date.now() + res.expiresIn * 1000;
    if (res.refreshToken) {
      this.refreshToken = res.refreshToken;
    }
    if (typeof res.refreshExpiresIn === "number") {
      this.refreshTokenExpiresAt = Date.now() + res.refreshExpiresIn * 1000;
    }
    // Persist before resolving — same reasoning as refreshAccessTokenInner.
    await this.saveSession();
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
  ): Promise<TokenExchangeResult> {
    const res = await this.fetchJSON<{
      accessToken: string;
      tokenType: string;
      expiresIn: number;
      refreshToken?: string;
      refreshExpiresIn?: number;
      profileId?: string;
    }>("POST", "/api/v1/auth/token", {
      grantType: "authorization_code",
      code,
      codeVerifier,
      clientId: this.config.clientId,
    });

    const profileId = res.profileId || this.decodeProfileId(res.accessToken);

    if (!profileId) {
      throw new Error("Server did not return profileId");
    }

    return {
      accessToken: res.accessToken,
      expiresIn: res.expiresIn,
      refreshToken: res.refreshToken,
      refreshExpiresIn: res.refreshExpiresIn,
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
    // Proactive refresh: if the bearer is expired (or about to be) and
    // we have a refresh credential, rotate first instead of paying a
    // guaranteed 401-and-retry round-trip. Refresh failure is not fatal
    // here — the call still goes out, the reactive 401 path below gets
    // one more attempt.
    if (
      authenticated &&
      this.accessToken &&
      this.isAccessTokenExpiringSoon() &&
      this.isRefreshTokenUsable()
    ) {
      try {
        await this.refreshAccessToken();
      } catch {
        // Fall through.
      }
    }

    let res = await this.doFetch(method, path, body, authenticated);

    // Reactive 401 retry: server rejected our token. If we have a
    // refresh credential, rotate and replay once. Capped at one retry
    // — a second 401 propagates out as the original API error.
    if (
      res.status === 401 &&
      authenticated &&
      this.isRefreshTokenUsable()
    ) {
      try {
        await this.refreshAccessToken();
        res = await this.doFetch(method, path, body, authenticated);
      } catch {
        // Refresh itself failed — fall through with the most recent
        // response (the original 401) so the caller sees a meaningful
        // error rather than a refresh-side network failure.
      }
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API error ${res.status}: ${text}`);
    }

    const json = await res.json();
    return (json.data ?? json) as T;
  }

  private async doFetch(
    method: string,
    path: string,
    body: object | undefined,
    authenticated: boolean
  ): Promise<Response> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      // Analytics headers so the backend can slice funnel metrics per
      // SDK build and platform. Backend treats them as optional, so
      // older SDK builds that predate this change still authenticate
      // correctly — they just show up as `sdk_version=unknown`.
      "X-Terminal-SDK-Version": __SDK_VERSION__,
      "X-Terminal-SDK-Platform": sdkPlatform(this.adapter),
      "X-Terminal-SDK-Adapter": this.adapter.name,
    };

    if (authenticated && this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      return await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}

/**
 * Derive the coarse-grained platform label from the adapter. Adapter
 * names are free-form (consumers can supply custom adapters), so we map
 * the two first-party adapter names to their canonical platforms and
 * fall back to the adapter name otherwise. `"unknown"` guards against
 * an adapter that omits `name` — the interface now requires it, but
 * TypeScript can't enforce that on arbitrary JS consumers.
 */
function sdkPlatform(adapter: PlatformAdapter): string {
  const name = adapter.name?.toLowerCase?.() ?? "";
  if (name === "expo") return "react-native";
  if (name === "web") return "web";
  return name || "unknown";
}
