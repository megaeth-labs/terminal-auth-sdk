# @megaeth-labs/terminal-auth-sdk

TypeScript SDK for linking EIP-1193 wallets to MegaETH Terminal profiles.

It handles the full auth flow: wallet signature challenge, PKCE, consent (popup or redirect), and token exchange.

## Installation

```bash
npm install @megaeth-labs/terminal-auth-sdk
```

## Features

- SIWE-style wallet authentication
- PKCE-secured OAuth flow
- Consent via popup (default on web) or redirect
- React bindings for web (`TerminalProvider`, `useTerminal`, `TerminalWidget`)
- React Native / Expo bindings via `@megaeth-labs/terminal-auth-sdk/react-native`
- Framework-agnostic core client (`@megaeth-labs/terminal-auth-sdk/core`)

## Import paths

| Import path | Use case |
| --- | --- |
| `@megaeth-labs/terminal-auth-sdk` | Web SDK (core + React web bindings) |
| `@megaeth-labs/terminal-auth-sdk/core` | Framework-agnostic core client |
| `@megaeth-labs/terminal-auth-sdk/react-native` | React Native / Expo |

## Quick start (web React)

```tsx
import { TerminalProvider, useTerminal } from "@megaeth-labs/terminal-auth-sdk";

function App({ children }) {
  return (
    <TerminalProvider config={{ clientId: "your-client-id" }}>
      {children}
    </TerminalProvider>
  );
}

function ConnectButton({ provider }) {
  const { state, connect, disconnect } = useTerminal();

  const handleConnect = async () => {
    await connect(provider, { mode: "redirect" }); // or omit mode to use popup default on web
  };

  return (
    <button onClick={state === "connected" ? disconnect : handleConnect}>
      {state === "connected" ? "Disconnect" : "Connect Terminal"}
    </button>
  );
}
```

## Quick start (core)

```ts
import { TerminalClient } from "@megaeth-labs/terminal-auth-sdk/core";

const client = new TerminalClient({ clientId: "your-client-id" });
await client.connect(provider, { mode: "redirect" });
const stats = await client.getStats();
```

## Quick start (Expo)

```tsx
import { TerminalProvider } from "@megaeth-labs/terminal-auth-sdk/react-native";

<TerminalProvider config={{ clientId: "your-client-id" }}>
  {children}
</TerminalProvider>;
```

For a full Expo walkthrough, see [`examples/expo-rn/README.md`](./examples/expo-rn/README.md).

## Documentation

- Docs index: [`docs/README.md`](./docs/README.md)
- Authentication types: [`docs/guides/authentication-types.md`](./docs/guides/authentication-types.md)
- Examples overview: [`examples/README.md`](./examples/README.md)

## Development

```bash
pnpm install
pnpm build
pnpm lint
```

## License

MIT
