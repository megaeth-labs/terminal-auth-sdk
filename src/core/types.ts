interface RequestArguments {
    readonly method: string;
    readonly params?: readonly unknown[] | object;
  }
  
  interface EIP1193Provider {
    request(args: RequestArguments): Promise<unknown>;
  }



  interface TerminalSDKConfig {
    clientId: string;
    baseUrl?: string;          // defaults to production
    autoConnect?: boolean;      // defaults to true
  }

  interface Profile {
    rank: number;
    points: number;
    username: string;
  }

  interface TerminalSDK {
    config: TerminalSDKConfig;
    provider: EIP1193Provider;
    connect: (provider: EIP1193Provider) => Promise<void>;
    getProfile: () => Promise<Profile>;
    getConnectionState(): 'connected' | 'disconnected' | 'connecting';
    onConnectionStateChange(callback: (state: 'connected' | 'disconnected' | 'connecting') => void): void;
  }