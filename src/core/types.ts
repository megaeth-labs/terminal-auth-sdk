interface RequestArguments {
    readonly method: string;
    readonly params?: readonly unknown[] | object;
  }
  
  interface EIP1193Provider {
    request(args: RequestArguments): Promise<unknown>;
    on(event: 'accountsChanged', listener: (accounts: string[]) => void): void;
    removeListener(event: 'accountsChanged', listener: (accounts: string[]) => void): void;
  }



  interface TerminalSDKConfig {
    clientId: string;
    baseUrl?: string;
    terminalOrigin?: string;
    autoConnect?: boolean;
  }


  interface Stats {
    rank: number;
    totalPoints: number;
  }

  interface ConnectResult {
    accessToken: string;
    expiresIn: number;
  }

  type ConnectionState = 'connected' | 'disconnected' | 'connecting';

  interface TerminalSDK {
    config: TerminalSDKConfig;
    connect: (provider: EIP1193Provider) => Promise<ConnectResult>;
    disconnect: () => Promise<void>;
    getStats: () => Promise<Stats>;
    getConnectionState(): ConnectionState;
    on(event: 'stateChange', callback: (state: ConnectionState) => void): void;
    on(event: 'error', callback: (error: Error) => void): void;
    off(event: 'stateChange', callback: (state: ConnectionState) => void): void;
    off(event: 'error', callback: (error: Error) => void): void;
    openTerminalProfile(): void;
  }

  export type { TerminalSDKConfig, Stats, TerminalSDK, ConnectionState, EIP1193Provider, ConnectResult };