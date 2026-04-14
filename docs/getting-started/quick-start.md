# Quick Start

## Web React

### 1. Wrap your app with `TerminalProvider`

```tsx
import { TerminalProvider } from "@megaeth-labs/terminal-auth-sdk";

function App({ children }) {
  return (
    <TerminalProvider config={{ clientId: "your-client-id" }}>
      {children}
    </TerminalProvider>
  );
}
```

### 2. Call `connect` from `useTerminal`

```tsx
import { useTerminal } from "@megaeth-labs/terminal-auth-sdk";

function ConnectButton({ provider }) {
  const { state, connect, disconnect } = useTerminal();

  const handleConnect = async () => {
    // Popup is default on web. Pass mode: "redirect" when needed.
    await connect(provider, { mode: "redirect" });
  };

  if (state === "connected") {
    return <button onClick={disconnect}>Disconnect</button>;
  }

  return (
    <button onClick={handleConnect} disabled={state === "connecting"}>
      {state === "connecting" ? "Connecting..." : "Connect to Terminal"}
    </button>
  );
}
```

`redirectUri` does not need a dedicated callback page with custom logic. It is simply the URL the user returns to after consent. You can use a normal route that already drives UI state (for example with query params), as long as it is allowlisted exactly for your `clientId`. When you use `TerminalProvider` on web, redirect callback handling is automatic on app load.

## Framework-agnostic core

```ts
import { TerminalClient } from "@megaeth-labs/terminal-auth-sdk/core";

const client = new TerminalClient({ clientId: "your-client-id" });
await client.connect(provider, { mode: "redirect" });
const stats = await client.getStats();
console.log(stats.rank, stats.totalPoints);
```

## React Native / Expo

Use the React Native entrypoint:

```tsx
import { TerminalProvider } from "@megaeth-labs/terminal-auth-sdk/react-native";

function Root() {
  return (
    <TerminalProvider config={{ clientId: "your-client-id" }}>
      {children}
    </TerminalProvider>
  );
}
```

Expo flow uses redirect mode with deep links. For a full setup (app scheme, env vars, dev build requirements), see [`examples/expo-rn/README.md`](../../examples/expo-rn/README.md).

## Next steps

- [Authentication Types](../guides/authentication-types.md)
- [Authentication Flow](../guides/authentication-flow.md)
- [React Integration](../guides/react-integration.md)
- [Examples](../../examples/README.md)
