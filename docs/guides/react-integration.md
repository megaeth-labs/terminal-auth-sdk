# React Integration

The SDK provides three web React primitives:

- `TerminalProvider`
- `useTerminal`
- `TerminalWidget`

## TerminalProvider

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

Behavior on mount:

- Creates one `TerminalClient`
- Subscribes to `stateChange`
- Processes redirect callback when present
- Otherwise attempts `restoreSession()`

## useTerminal

```tsx
import { useTerminal } from "@megaeth-labs/terminal-auth-sdk";

function TerminalButton({ provider }) {
  const { state, connect, disconnect, getStats } = useTerminal();

  const handleConnect = async () => {
    await connect(provider, { mode: "redirect" });
    const stats = await getStats();
    console.log(stats);
  };

  return state === "connected" ? (
    <button onClick={disconnect}>Disconnect</button>
  ) : (
    <button onClick={handleConnect} disabled={state === "connecting"}>
      Connect to Terminal
    </button>
  );
}
```

`connect` signature:

```ts
connect(provider: EIP1193Provider, options?: ConnectOptions): Promise<ConnectResult>
```

## TerminalWidget

```tsx
import { TerminalWidget } from "@megaeth-labs/terminal-auth-sdk";

<TerminalWidget provider={provider} theme="light" onError={console.error} />;
```

Use `classNames`/`styles` slot overrides for custom visuals.

## React Native note

For Expo/React Native, use the dedicated entrypoint:

```ts
import { TerminalProvider, useTerminal } from "@megaeth-labs/terminal-auth-sdk/react-native";
```

See [`examples/expo-rn/README.md`](../../examples/expo-rn/README.md) for full setup.
