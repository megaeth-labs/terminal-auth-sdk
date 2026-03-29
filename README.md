# @megaeth-labs/terminal-auth-sdk

Authentication SDK for linking wallets to MegaETH Terminal profiles. Handles the full OAuth-style flow: wallet signature challenge, PKCE, consent popup, and token exchange.

> **Beta**: This library is in beta. The API may change between releases. Mobile app support is not yet available and will be included in the next release, along with an alternative to the popup-based consent flow.

## Features

- Wallet-based authentication via SIWE (Sign-In with Ethereum) signatures
- PKCE-secured OAuth authorization flow
- Popup-based consent for Terminal profile linking
- React bindings (`TerminalProvider` + `useTerminal` hook)
- Framework-agnostic core — works with any EIP-1193 provider

## Installation

```bash
npm install @megaeth-labs/terminal-auth-sdk
```

## Quick Start (React)

### 1. Wrap your app with `TerminalProvider`

```tsx
import { TerminalProvider } from "@megaeth-labs/terminal-auth-sdk";

function App() {
  return (
    <TerminalProvider config={{ clientId: "your-client-id" }}>
      {children}
    </TerminalProvider>
  );
}
```

### 2. Use the `useTerminal` hook

```tsx
import { useTerminal } from "@megaeth-labs/terminal-auth-sdk";

function ConnectButton() {
  const { state, connect, disconnect, openTerminalProfile } = useTerminal();

  const handleConnect = async () => {
    const provider = window.ethereum; // or any EIP-1193 provider
    await connect(provider);
    console.log("Connected to Terminal");
  };

  return (
    <button onClick={state === "connected" ? disconnect : handleConnect}>
      {state === "connected" ? "Disconnect" : "Connect Terminal"}
    </button>
  );
}
```

## Core Usage (Framework-agnostic)

```typescript
import { TerminalClient } from "@megaeth-labs/terminal-auth-sdk/core";

const client = new TerminalClient({ clientId: "your-client-id" });

// Connect — opens consent popup if wallet is not yet linked
await client.connect(provider);
console.log("Connected to Terminal");

// Fetch stats
const stats = await client.getStats();
console.log(stats.rank, stats.totalPoints);

// Disconnect (unlinks wallet)
await client.disconnect();
```

## Configuration

```typescript
interface TerminalSDKConfig {
  clientId: string; // Required — provided by the MegaETH team
}
```

The `clientId` is issued by the MegaETH team to partner applications. Reach out to the team to obtain yours.

## API Reference

### `TerminalClient`

```typescript
client.connect(provider); // Authenticate wallet → consent → token exchange
client.disconnect(); // Unlink wallet and clear token
client.getConnectionState(); // → "connected" | "disconnected" | "connecting"
client.openTerminalProfile(); // Open Terminal profile in new tab
client.on(event, callback); // Listen to "stateChange" | "error"
client.off(event, callback); // Remove listener
```

### React

```typescript
// Provider
<TerminalProvider config={{ clientId: "..." }}>{children}</TerminalProvider>

// Hook — must be used within TerminalProvider
const {
  state,                // ConnectionState
  connect,              // (provider: EIP1193Provider) => Promise<ConnectResult>
  disconnect,           // () => Promise<void>
  openTerminalProfile,  // () => void
  client,               // TerminalClient instance (for advanced usage)
} = useTerminal();
```

### Types

```typescript
type ConnectionState = "connected" | "disconnected" | "connecting";

interface ConnectResult {
  accessToken: string;
  expiresIn: number;
}

interface EIP1193Provider {
  request(args: {
    method: string;
    params?: readonly unknown[] | object;
  }): Promise<unknown>;
}
```

## Development

```bash
pnpm install
pnpm build            # Build the library
pnpm dev              # Vite dev server with demo app
pnpm dev:examples     # Run example apps (consent + Next.js)
pnpm lint             # ESLint
```

### Publishing

```bash
pnpm build
npm publish
```

## License

MIT
