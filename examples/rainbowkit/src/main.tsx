import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { TerminalProvider } from "@megaeth-labs/terminal-auth-sdk";

import { config } from "./wagmi";
import { App } from "./App";

const queryClient = new QueryClient();

const terminalConfig = {
  clientId: import.meta.env.VITE_TERMINAL_CLIENT_ID ?? "1",
  ...(import.meta.env.VITE_TERMINAL_API_URL && { baseUrl: import.meta.env.VITE_TERMINAL_API_URL }),
  ...(import.meta.env.VITE_TERMINAL_ORIGIN && { terminalOrigin: import.meta.env.VITE_TERMINAL_ORIGIN }),
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
