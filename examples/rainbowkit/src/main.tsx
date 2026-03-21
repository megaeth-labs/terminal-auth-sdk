import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { TerminalProvider } from "terminal-auth-sdk";

import { config } from "./wagmi";
import { App } from "./App";

const queryClient = new QueryClient();

const terminalConfig = {
  clientId: import.meta.env.VITE_TERMINAL_CLIENT_ID ?? "1",
  baseUrl: import.meta.env.VITE_TERMINAL_API_URL ?? "http://localhost:8080",
  terminalOrigin:
    import.meta.env.VITE_TERMINAL_ORIGIN ?? "http://localhost:3000",
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <TerminalProvider config={terminalConfig}>
            <App />
          </TerminalProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);
