interface RequestArguments {
    readonly method: string;
    readonly params?: readonly unknown[] | object;
  }
  
  interface EIP1193Provider {
    request(args: RequestArguments): Promise<unknown>;
  }



  interface TerminalSDKConfig {
    clientId: string;
    baseUrl?: string;
    terminalOrigin?: string;
    autoConnect?: boolean;
  }

  interface Profile {
    rank: number;
    points: number;
    username: string;
  }

  interface ConnectResult {
    accessToken: string;
    profileId: string;
  }

  type ConnectionState = 'connected' | 'disconnected' | 'connecting';

  interface TerminalSDK {
    config: TerminalSDKConfig;
    connect: (provider: EIP1193Provider) => Promise<ConnectResult>;
    disconnect: () => Promise<void>;
    getProfile: () => Promise<Profile>;
    getConnectionState(): ConnectionState;
    on(event: 'stateChange', callback: (state: ConnectionState) => void): void;
    on(event: 'error', callback: (error: Error) => void): void;
    off(event: 'stateChange', callback: (state: ConnectionState) => void): void;
    off(event: 'error', callback: (error: Error) => void): void;
    openTerminalProfile(): void;
  }

  export type { TerminalSDKConfig, Profile, TerminalSDK, ConnectionState, EIP1193Provider, ConnectResult };