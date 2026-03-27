# RainbowKit Example

This example shows how to use `TerminalWidget` in a Vite + React app with [Wagmi](https://wagmi.sh) and [RainbowKit](https://www.rainbowkit.com). The widget appears after the user connects their wallet and handles Terminal auth automatically.

The full source is in [`examples/rainbowkit/`](../../examples/rainbowkit/).

## Provider setup

Wrap your application with the required providers. `TerminalProvider` should be placed inside `RainbowKitProvider`.

```tsx
// examples/rainbowkit/src/main.tsx
import { WagmiProvider } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { TerminalProvider } from "@megaeth-labs/terminal-auth-sdk";
import { config } from "./wagmi";

const terminalConfig = {
  clientId: import.meta.env.VITE_TERMINAL_CLIENT_ID,
};

createRoot(document.getElementById("root")).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider>
        <TerminalProvider config={terminalConfig}>
          <App />
        </TerminalProvider>
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);
```

## Using TerminalWidget

Inside your application, resolve the EIP-1193 provider from the active Wagmi connector (`connector.getProvider()`) and pass it to `TerminalWidget`. The widget only renders the connect button once the user has connected their wallet.

```tsx
// examples/rainbowkit/src/App.tsx
import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import {
  TerminalWidget,
  type EIP1193Provider,
} from "@megaeth-labs/terminal-auth-sdk";

export function App() {
  const { isConnected, connector } = useAccount();
  const [provider, setProvider] = useState<EIP1193Provider>();

  useEffect(() => {
    let cancelled = false;
    if (!connector) return;
    connector.getProvider().then((p) => {
      if (!cancelled) setProvider(p as EIP1193Provider);
    });
    return () => {
      cancelled = true;
    };
  }, [connector]);

  return (
    <div>
      <ConnectButton />

      {isConnected && (
        <TerminalWidget
          provider={provider}
          onError={(err) => console.error("Terminal error:", err)}
        />
      )}
    </div>
  );
}
```

## Environment variables

Create a `.env` file based on the example:

```bash
cp examples/rainbowkit/.env.example examples/rainbowkit/.env
```

| Variable | Description |
|---|---|
| `VITE_TERMINAL_CLIENT_ID` | Your Terminal client ID (provided by the MegaETH team) |

## How it works

1. On mount, `TerminalProvider` automatically restores any previously saved session from `localStorage`.
2. The user clicks the RainbowKit `ConnectButton` and connects their wallet.
3. `isConnected` becomes `true`, which renders `TerminalWidget`.
4. The app resolves the active connector's EIP-1193 provider via `connector.getProvider()`.
5. The user clicks "Connect To Terminal" in the widget.
6. The SDK runs the full auth flow. If the wallet is not yet linked to a Terminal profile, a consent popup opens.
7. On success, the widget switches to its connected state, showing the truncated address, rank, and points. The session is persisted so it survives page reloads.
