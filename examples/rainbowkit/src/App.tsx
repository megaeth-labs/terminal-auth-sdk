import "@rainbow-me/rainbowkit/styles.css";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useConnectorClient } from "wagmi";
import { TerminalWidget } from "terminal-auth-sdk";

export function App() {
  const { isConnected } = useAccount();
  const { data: connectorClient } = useConnectorClient();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "2rem",
        backgroundColor: "#0a0a0a",
        color: "white",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <h1>Terminal SDK + RainbowKit</h1>

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
