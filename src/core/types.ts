import type { PlatformAdapter } from "./adapter";

interface RequestArguments {
    readonly method: string;
    readonly params?: readonly unknown[] | object;
  }

  interface EIP1193Provider {
    request(args: RequestArguments): Promise<unknown>;
    on(event: 'accountsChanged', listener: (accounts: string[]) => void): void;
    removeListener(event: 'accountsChanged', listener: (accounts: string[]) => void): void;
  }



  /**
   * How the SDK sends credentials to the backend.
   * - `"bearer"` — Authorization header only (default, existing behavior).
   * - `"cookie"` — HttpOnly cookie set by the backend. Web only.
   * - `"auto"` — Cookie on web, bearer on React Native.
   */
  type AuthTransport = "bearer" | "cookie" | "auto";

  interface TerminalSDKConfig {
    clientId: string;
    baseUrl?: string;
    terminalOrigin?: string;
    /**
     * Platform adapter that provides storage, crypto, and the auth-session
     * navigation step. Defaults to a browser adapter built from `window`,
     * `localStorage`, `sessionStorage`, and `crypto.subtle`. Pass an explicit
     * adapter (e.g. the Expo adapter) when running outside the browser.
     */
    adapter?: PlatformAdapter;
    /**
     * Controls how auth credentials are transmitted to the backend.
     * Defaults to `"bearer"` for backward compatibility.
     */
    authTransport?: AuthTransport;
  }


  interface Stats {
    rank: number;
    totalPoints: number;
    isBoosted: boolean;
  }

  interface ConnectResult {
    accessToken: string;
    expiresIn: number;
    profileId: string;
  }

  type ConnectionState = 'connected' | 'disconnected' | 'connecting';

  interface TerminalSDK {
    config: TerminalSDKConfig;
    connect: (provider: EIP1193Provider, options?: ConnectOptions) => Promise<ConnectResult>;
    disconnect: () => Promise<void>;
    getStats: () => Promise<Stats>;
    getConnectionState(): ConnectionState;
    getProfileId(): string | null;
    restoreSession(provider?: EIP1193Provider): Promise<boolean>;
    on(event: 'stateChange', callback: (state: ConnectionState) => void): void;
    on(event: 'error', callback: (error: Error) => void): void;
    off(event: 'stateChange', callback: (state: ConnectionState) => void): void;
    off(event: 'error', callback: (error: Error) => void): void;
    openTerminalProfile(): void;
  }

  type ConnectMode = 'popup' | 'redirect';

  interface ConnectOptions {
    mode?: ConnectMode;
    redirectUri?: string;
  }

  export type { AuthTransport, TerminalSDKConfig, Stats, TerminalSDK, ConnectionState, EIP1193Provider, ConnectResult, ConnectMode, ConnectOptions };