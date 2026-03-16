# @megaeth-labs/terminal-auth-sdk

Authentication SDK for linking wallets to MegaETH Terminal profiles. Handles the full OAuth-style flow: wallet signature challenge, PKCE, consent popup, and token exchange.

> **Access Control**: This package is published as a private package via [GitHub Packages](https://github.com/orgs/megaeth-labs/packages). Only `megaeth-labs` organization members can install it.

## Features

- Wallet-based authentication via EIP-712 typed data signatures
- PKCE-secured OAuth authorization flow
- Popup-based consent for Terminal profile linking
- React bindings (`TerminalProvider` + `useTerminal` hook)
- Framework-agnostic core — works with any EIP-1193 provider

## Installation

### 1. Create a GitHub Personal Access Token

Go to [GitHub Settings → Personal access tokens](https://github.com/settings/tokens) and create a **classic token** with the `read:packages` scope.

### 2. Configure `.npmrc`

Create a `.npmrc` file in your project root:

```
@megaeth-labs:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

### 3. Set the environment variable

```bash
export GITHUB_TOKEN="ghp_your_token_here"
```

We recommend adding `GITHUB_TOKEN` to your `~/.zshrc` or `~/.bashrc`, or managing it via `.env` files in CI.

### 4. Install

```bash
pnpm add @megaeth-labs/terminal-auth-sdk
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
  const { state, connect, disconnect, getProfile, openTerminalProfile } = useTerminal();

  const handleConnect = async () => {
    const provider = window.ethereum; // or any EIP-1193 provider
    const result = await connect(provider);
    console.log("Connected:", result.accessToken);
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
const result = await client.connect(provider);
console.log(result.accessToken);

// Fetch profile
const profile = await client.getProfile();
console.log(profile.username, profile.rank, profile.points);

// Disconnect (unlinks wallet)
await client.disconnect();
```

## Configuration

```typescript
interface TerminalSDKConfig {
  clientId: string;           // Required — your app's client ID
  baseUrl?: string;           // API base URL (default: https://api.terminal.megaeth.com)
  terminalOrigin?: string;    // Terminal UI origin (default: https://terminal.megaeth.com)
}
```

## API Reference

### `TerminalClient`

```typescript
client.connect(provider)         // Authenticate wallet → consent → token exchange
client.disconnect()              // Unlink wallet and clear token
client.getProfile()              // → { username, rank, points }
client.getConnectionState()      // → "connected" | "disconnected" | "connecting"
client.openTerminalProfile()     // Open Terminal profile in new tab
client.on(event, callback)       // Listen to "stateChange" | "error"
client.off(event, callback)      // Remove listener
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
  getProfile,           // () => Promise<Profile>
  openTerminalProfile,  // () => void
  client,               // TerminalClient instance (for advanced usage)
} = useTerminal();
```

### Types

```typescript
type ConnectionState = "connected" | "disconnected" | "connecting";

interface ConnectResult {
  accessToken: string;
  profileId: string;
}

interface Profile {
  rank: number;
  points: number;
  username: string;
}

interface EIP1193Provider {
  request(args: { method: string; params?: readonly unknown[] | object }): Promise<unknown>;
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

Published to GitHub Packages (`npm.pkg.github.com`).

```bash
npm login --registry=https://npm.pkg.github.com   # PAT needs write:packages scope
pnpm build
npm publish
```

## License

MIT
