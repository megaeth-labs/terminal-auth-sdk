import "@rainbow-me/rainbowkit/styles.css";

import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { TerminalWidget, type EIP1193Provider } from "@megaeth-labs/terminal-auth-sdk";

export function App() {
  const { isConnected, connector } = useAccount();
  const [provider, setProvider] = useState<EIP1193Provider>();

  useEffect(() => {
    if (!isConnected || !connector?.getProvider) {
      setProvider(undefined);
      return;
    }
    let cancelled = false;
    connector.getProvider().then((p) => {
      if (!cancelled) setProvider(p as EIP1193Provider);
    });
    return () => {
      cancelled = true;
    };
  }, [isConnected, connector]);

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
          provider={provider}
          onError={(err) => console.error("Terminal error:", err)}
        />
      )}
    </div>
  );
}
