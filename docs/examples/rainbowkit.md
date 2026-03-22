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

Inside your application, use Wagmi's `useConnectorClient` to get the active wallet provider and pass it to `TerminalWidget`. The widget only renders the connect button once the user has connected their wallet.

```tsx
// examples/rainbowkit/src/App.tsx
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useConnectorClient } from "wagmi";
import { TerminalWidget } from "@megaeth-labs/terminal-auth-sdk";

export function App() {
  const { isConnected } = useAccount();
  const { data: connectorClient } = useConnectorClient();

  return (
    <div>
      <ConnectButton />

      {isConnected && (
        <TerminalWidget
          provider={connectorClient ?? undefined}
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
| `VITE_TERMINAL_CLIENT_ID` | Your Terminal client ID |
| `VITE_TERMINAL_API_URL` | API base URL (defaults to `https://api.terminal.megaeth.com`) |
| `VITE_TERMINAL_ORIGIN` | Terminal origin for the consent popup (defaults to `https://terminal.megaeth.com`) |

## How it works

1. The user clicks the RainbowKit `ConnectButton` and connects their wallet.
2. `isConnected` becomes `true`, which renders `TerminalWidget`.
3. Wagmi's `useConnectorClient` exposes the active connector as an EIP-1193 provider.
4. The user clicks "Connect To Terminal" in the widget.
5. The SDK runs the full auth flow. If the wallet is not yet linked to a Terminal profile, a consent popup opens.
6. On success, the widget switches to its connected state, showing the truncated address, rank, and points.
