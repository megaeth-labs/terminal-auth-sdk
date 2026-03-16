import type {
  ConnectionState,
  ConnectResult,
  EIP1193Provider,
  Profile,
  TerminalSDKConfig,
} from "./types";
import { TypedEventEmitter } from "./events";
import { generatePKCEPair } from "./pkce";
import { openPopupAndWaitForCode } from "./popup";

const DEFAULT_BASE_URL = "https://api.terminal.megaeth.com";
const DEFAULT_TERMINAL_ORIGIN = "https://terminal.megaeth.com";

type SDKEvents = {
  stateChange: ConnectionState;
  error: Error;
};

export class TerminalClient {
  private config: TerminalSDKConfig;
  private accessToken: string | null = null;
  private connectionState: ConnectionState = "disconnected";
  private emitter = new TypedEventEmitter<SDKEvents>();

  private get baseUrl(): string {
    return this.config.baseUrl ?? DEFAULT_BASE_URL;
  }

  private get terminalOrigin(): string {
    return this.config.terminalOrigin ?? DEFAULT_TERMINAL_ORIGIN;
  }

  constructor(config: TerminalSDKConfig) {
    this.config = config;
  }

  async connect(provider: EIP1193Provider): Promise<ConnectResult> {
    this.setState("connecting");

    try {
      const address = await this.getAddress(provider);

      const { challengeId, eip712Data } = await this.requestNonce(address);

      const { codeVerifier, codeChallenge } = await generatePKCEPair();

      const signature = await this.signChallenge(provider, address, eip712Data);

      const verifyResult = await this.verifySignature(
        challengeId,
        signature,
        codeChallenge
      );

      let authCode: string;

      if (verifyResult.status === "linked" && verifyResult.code) {
        authCode = verifyResult.code;
      } else {
        const popupUrl =
          verifyResult.authorizeUrl ??
          `${this.terminalOrigin}/link?challenge_id=${challengeId}`;
        authCode = await openPopupAndWaitForCode({
          url: popupUrl,
          expectedOrigin: this.terminalOrigin,
        });
      }

      const result = await this.exchangeToken(authCode, codeVerifier);

      this.accessToken = result.accessToken;
      this.setState("connected");

      return result;
    } catch (err) {
      this.accessToken = null;
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

    await this.fetchJSON("DELETE", "/api/v1/delete-wallet", undefined, true);

    this.accessToken = null;
    this.setState("disconnected");
  }

  async getProfile(): Promise<Profile> {
    if (!this.accessToken) {
      throw new Error("Not connected");
    }
    return this.fetchJSON<Profile>("GET", "/api/v1/profile", undefined, true);
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
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
    window.open(`${this.terminalOrigin}/profile`, "_blank");
  }

  // --- Private helpers ---

  private setState(state: ConnectionState): void {
    this.connectionState = state;
    this.emitter.emit("stateChange", state);
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
  ): Promise<{ challengeId: string; nonce: string; eip712Data: object }> {
    return this.fetchJSON("POST", "/api/v1/auth/nonce", {
      wallet: address,
      clientId: this.config.clientId,
    });
  }

  private async signChallenge(
    provider: EIP1193Provider,
    address: string,
    eip712Data: object
  ): Promise<string> {
    return (await provider.request({
      method: "eth_signTypedData_v4",
      params: [address, JSON.stringify(eip712Data)],
    })) as string;
  }

  private async verifySignature(
    challengeId: string,
    signature: string,
    codeChallenge: string
  ): Promise<{ status: string; code?: string; authorizeUrl?: string }> {
    return this.fetchJSON("POST", "/api/v1/auth/verify-signature", {
      challengeId,
      signature,
      codeChallenge,
      codeChallengeMethod: "S256",
    });
  }

  private async exchangeToken(
    code: string,
    codeVerifier: string
  ): Promise<ConnectResult> {
    const res = await this.fetchJSON<{
      accessToken: string;
      tokenType: string;
      expiresIn: number;
    }>("POST", "/api/v1/auth/token", {
      grantType: "authorization_code",
      code,
      codeVerifier,
      clientId: this.config.clientId,
    });

    return {
      accessToken: res.accessToken,
      profileId: "",
    };
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

    if (authenticated && this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API error ${res.status}: ${text}`);
    }

    const json = await res.json();
    return (json.data ?? json) as T;
  }
}
