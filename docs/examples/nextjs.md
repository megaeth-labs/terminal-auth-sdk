# Next.js Example

This example shows how to use the `useTerminal` hook manually in a Next.js pages-router app with [Wagmi](https://wagmi.sh) and [RainbowKit](https://www.rainbowkit.com). Unlike the RainbowKit example, this wires up the connect button manually to give you full control over the UI.

The full source is in [`examples/nextjs/`](../../examples/nextjs/).

## Provider setup

Add providers in `_app.tsx`. Place `TerminalProvider` inside `RainbowKitProvider`.

```tsx
// examples/nextjs/src/pages/_app.tsx
import { WagmiProvider } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { TerminalProvider } from "@megaeth-labs/terminal-auth-sdk";
import { config } from "../wagmi";

const terminalConfig = {
  clientId: process.env.NEXT_PUBLIC_TERMINAL_CLIENT_ID,
};

function MyApp({ Component, pageProps }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <TerminalProvider config={terminalConfig}>
            <Component {...pageProps} />
          </TerminalProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default MyApp;
```

## Using the hook manually

Use `useTerminal` to access `state` and `connect` directly. This lets you build any custom UI around the connection state.

```tsx
// examples/nextjs/src/pages/index.tsx
import { useTerminal } from "@megaeth-labs/terminal-auth-sdk";
import { useAccount, useConnectorClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const Home = () => {
  const { isConnected } = useAccount();
  const { data: connectorClient } = useConnectorClient();
  const { state, connect } = useTerminal();

  const handleTerminalConnect = async () => {
    if (!connectorClient) return;
    try {
      const result = await connect(connectorClient);
      console.log("Terminal connected:", result);
    } catch (err) {
      console.error("Terminal connect failed:", err);
    }
  };

  return (
    <main>
      <ConnectButton />

      {isConnected && (
        <div>
          <p>Terminal state: <strong>{state}</strong></p>
          <button
            onClick={handleTerminalConnect}
            disabled={state === "connecting" || state === "connected"}
          >
            {state === "connected"
              ? "Connected to Terminal"
              : state === "connecting"
              ? "Connecting..."
              : "Connect to Terminal"}
          </button>
        </div>
      )}
    </main>
  );
};

export default Home;
```

## Environment variables

Create a `.env.local` file based on the example:

```bash
cp examples/nextjs/.env.local.example examples/nextjs/.env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_TERMINAL_CLIENT_ID` | Your Terminal client ID |
| `NEXT_PUBLIC_TERMINAL_API_URL` | API base URL (defaults to `https://api.terminal.megaeth.com`) |
| `NEXT_PUBLIC_TERMINAL_ORIGIN` | Terminal origin for the consent popup (defaults to `https://terminal.megaeth.com`) |

All environment variables must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser.

## How it works

1. The user connects their wallet with RainbowKit.
2. `isConnected` becomes `true`, which renders the Terminal connect button.
3. The user clicks the button. `handleTerminalConnect` calls `connect(connectorClient)`.
4. The SDK runs the full auth flow. If the wallet is not linked to a Terminal profile, a consent popup opens.
5. The `state` value updates from `"connecting"` to `"connected"` on success. The button becomes disabled with the label "Connected to Terminal".
