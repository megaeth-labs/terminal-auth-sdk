import "../styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import type { AppProps } from "next/app";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { TerminalProvider } from "terminal-auth-sdk";

import { config } from "../wagmi";

const queryClient = new QueryClient();

const terminalConfig = {
  clientId: process.env.NEXT_PUBLIC_TERMINAL_CLIENT_ID ?? "1",
  baseUrl: process.env.NEXT_PUBLIC_TERMINAL_API_URL ?? "http://localhost:8080",
  terminalOrigin:
    process.env.NEXT_PUBLIC_TERMINAL_ORIGIN ?? "http://localhost:3000",
};

function MyApp({ Component, pageProps }: AppProps) {
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
