"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { TerminalProvider } from "@megaeth-labs/terminal-auth-sdk";

const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

const terminalConfig = {
  clientId: process.env.NEXT_PUBLIC_TERMINAL_CLIENT_ID ?? "1",
  ...(process.env.NEXT_PUBLIC_TERMINAL_API_URL && {
    baseUrl: process.env.NEXT_PUBLIC_TERMINAL_API_URL,
  }),
  ...(process.env.NEXT_PUBLIC_TERMINAL_ORIGIN && {
    terminalOrigin: process.env.NEXT_PUBLIC_TERMINAL_ORIGIN,
  }),
};

export function Providers({ children }: { children: React.ReactNode }) {
  if (!privyAppId) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>
          Missing <code>NEXT_PUBLIC_PRIVY_APP_ID</code>. Copy{" "}
          <code>.env.local.example</code> to <code>.env.local</code> and set
          your Privy app ID.
        </p>
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
        },
      }}
    >
      <TerminalProvider config={terminalConfig}>{children}</TerminalProvider>
    </PrivyProvider>
  );
}
