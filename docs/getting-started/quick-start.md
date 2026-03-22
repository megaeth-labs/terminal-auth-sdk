# Quick Start

## React

### 1. Wrap your app with `TerminalProvider`

Add `TerminalProvider` near the root of your component tree. Pass your `clientId` in the config.

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

### 2. Use the `useTerminal` hook

Call `connect` with any EIP-1193 provider (e.g. `window.ethereum` or a Wagmi connector client).

```tsx
import { useTerminal } from "@megaeth-labs/terminal-auth-sdk";

function ConnectButton() {
  const { state, connect, disconnect } = useTerminal();

  const handleConnect = async () => {
    const result = await connect(window.ethereum);
    console.log("Access token:", result.accessToken);
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

### 3. Drop in the pre-built widget (optional)

`TerminalWidget` handles the connect/connected states for you.

```tsx
import { TerminalWidget } from "@megaeth-labs/terminal-auth-sdk";

function MyPage() {
  return (
    <TerminalWidget
      provider={window.ethereum}
      onError={(err) => console.error(err)}
    />
  );
}
```

---

## Framework-agnostic (no React)

```typescript
import { TerminalClient } from "@megaeth-labs/terminal-auth-sdk/core";

const client = new TerminalClient({ clientId: "your-client-id" });

const result = await client.connect(window.ethereum);
console.log("Access token:", result.accessToken);

const profile = await client.getProfile();
console.log(profile.username, profile.rank, profile.points);
```

---

## Next steps

- [Authentication Flow](../guides/authentication-flow.md) — understand what happens under the hood
- [React Integration](../guides/react-integration.md) — detailed guide to all React APIs
- [RainbowKit Example](../examples/rainbowkit.md) — full working example with Wagmi + RainbowKit
