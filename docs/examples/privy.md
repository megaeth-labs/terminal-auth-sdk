# Privy Example

This example shows how to use `TerminalWidget` in a Next.js App Router app with [Privy](https://www.privy.io) for authentication. Privy provides embedded wallets — users can sign up with email or social login and get an Ethereum wallet automatically, which the Terminal SDK then uses for profile linking.

**[Live demo](https://auth-sdk-demo-seven.vercel.app/)**

The full source is in [`examples/privy/`](../../examples/privy/).

## Provider setup

Create a client component that wraps `PrivyProvider` and `TerminalProvider`. Place `TerminalProvider` inside `PrivyProvider` so that Privy's wallet is available when Terminal connects.

```tsx
// examples/privy/src/components/providers.tsx
"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { TerminalProvider } from "@megaeth-labs/terminal-auth-sdk";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
        },
      }}
    >
      <TerminalProvider config={{ clientId: "1" }}>
        {children}
      </TerminalProvider>
    </PrivyProvider>
  );
}
```

Then use it in your root layout:

```tsx
// examples/privy/src/app/layout.tsx
import { Providers } from "@/components/providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## Getting the EIP-1193 provider from Privy

Privy's `useWallets` hook returns the user's wallets. Call `getEthereumProvider()` on the first wallet to get an EIP-1193 provider that the Terminal SDK can use.

```tsx
// examples/privy/src/components/terminal-section.tsx
"use client";

import { useEffect, useState } from "react";
import { TerminalWidget, useTerminal, type EIP1193Provider } from "@megaeth-labs/terminal-auth-sdk";
import { useWallets } from "@privy-io/react-auth";

export function TerminalSection() {
  const { state, disconnect, getStats, openTerminalProfile } = useTerminal();
  const { wallets } = useWallets();
  const [provider, setProvider] = useState<EIP1193Provider>();

  useEffect(() => {
    let cancelled = false;
    const w = wallets[0];
    if (!w) { setProvider(undefined); return; }
    w.getEthereumProvider().then(
      (p) => { if (!cancelled) setProvider(p); },
      () => { if (!cancelled) setProvider(undefined); }
    );
    return () => { cancelled = true; };
  }, [wallets]);

  return (
    <div>
      <p>Terminal state: <strong>{state}</strong></p>

      <TerminalWidget
        provider={provider}
        onError={(err) => console.error(err)}
      />

      {state === "connected" && (
        <div>
          <button onClick={() => disconnect()}>Disconnect</button>
          <button onClick={async () => console.log(await getStats())}>Get Stats</button>
          <button onClick={openTerminalProfile}>Open Terminal Profile</button>
        </div>
      )}
    </div>
  );
}
```

## Login and logout

Use Privy's `usePrivy` hook for authentication. When logging out, disconnect from Terminal first to clean up the session.

```tsx
// examples/privy/src/app/page.tsx
"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useTerminal } from "@megaeth-labs/terminal-auth-sdk";
import { TerminalSection } from "@/components/terminal-section";

export default function Home() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { state: terminalState, disconnect: terminalDisconnect } = useTerminal();

  const handleLogout = async () => {
    if (terminalState === "connected") {
      try { await terminalDisconnect(); } catch {}
    }
    logout();
  };

  if (!ready) return <p>Loading...</p>;

  return (
    <main>
      <h1>Terminal SDK + Privy</h1>
      {authenticated ? (
        <>
          <button onClick={handleLogout}>Logout</button>
          <TerminalSection />
        </>
      ) : (
        <button onClick={login}>Login with Privy</button>
      )}
    </main>
  );
}
```

## Environment variables

Create a `.env.local` file based on the example:

```bash
cp examples/privy/.env.local.example examples/privy/.env.local
```

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Yes | Your Privy app ID from [dashboard.privy.io](https://dashboard.privy.io) |
| `NEXT_PUBLIC_TERMINAL_CLIENT_ID` | No | Terminal client ID (defaults to `"1"`) |

## How it works

1. On mount, `TerminalProvider` calls `restoreSession()` to resume any previously saved session.
2. The user logs in via Privy (email, social, or external wallet). Privy creates an embedded Ethereum wallet if the user doesn't have one.
3. The app resolves the EIP-1193 provider from `wallets[0].getEthereumProvider()` and passes it to `TerminalWidget`.
4. The user clicks "Connect To Terminal" in the widget.
5. The SDK runs the full auth flow. If the wallet is not yet linked to a Terminal profile, a consent popup opens.
6. On success, the widget switches to its connected state, showing the address, rank, and points. The session is persisted in `localStorage`.
7. On logout, the app disconnects from Terminal before calling Privy's `logout()` to clean up both sessions.

## Key differences from the RainbowKit examples

| Aspect | RainbowKit examples | Privy example |
|---|---|---|
| Wallet connection | User connects an external wallet via RainbowKit | User logs in with email/social; Privy creates an embedded wallet |
| Provider source | `connector.getProvider()` from Wagmi | `wallets[0].getEthereumProvider()` from Privy |
| Dependencies | wagmi, @tanstack/react-query, @rainbow-me/rainbowkit | @privy-io/react-auth |
| Next.js router | Pages Router | App Router |
