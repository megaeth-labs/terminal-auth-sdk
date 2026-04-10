import "@rainbow-me/rainbowkit/styles.css";

import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import {
  useTerminal,
  type EIP1193Provider,
  type Stats,
} from "@megaeth-labs/terminal-auth-sdk";

export function App() {
  const { isConnected, connector } = useAccount();
  const { state, address, connect, getStats, disconnect } = useTerminal();
  const [provider, setProvider] = useState<EIP1193Provider>();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !connector?.getProvider) return;
    connector.getProvider().then((p) => setProvider(p as EIP1193Provider));
  }, [isConnected, connector]);

  const connectedStats = state === "connected";

  useEffect(() => {
    if (!connectedStats) return;
    getStats().then(setStats).catch(() => {});
  }, [connectedStats, getStats]);

  const handleConnect = async () => {
    if (!provider) return;
    setError(null);
    try {
      await connect(provider, { mode: "redirect" });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

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
      <h1>Terminal SDK + RainbowKit (Redirect)</h1>

      <ConnectButton />

      {isConnected && state === "disconnected" && (
        <button
          onClick={handleConnect}
          disabled={!provider}
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            fontWeight: 500,
            backgroundColor: "#26de96",
            color: "#19191a",
            border: "none",
            borderRadius: "8px",
            cursor: provider ? "pointer" : "not-allowed",
            opacity: provider ? 1 : 0.5,
          }}
        >
          Connect to Terminal (Redirect)
        </button>
      )}

      {state === "connecting" && <p>Connecting...</p>}

      {state === "connected" && address && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
            padding: "1.5rem",
            backgroundColor: "#19191a",
            border: "0.5px solid #313131",
            borderRadius: "12px",
          }}
        >
          <p>Connected: {address.slice(0, 6)}...{address.slice(-4)}</p>
          {stats && (
            <>
              <p>Rank: {stats.rank}</p>
              <p style={{ color: "#26de96", fontWeight: 700 }}>
                {stats.totalPoints.toLocaleString("en-US")} PT
              </p>
            </>
          )}
          <button
            onClick={() => disconnect()}
            style={{
              marginTop: "0.5rem",
              padding: "8px 16px",
              fontSize: "14px",
              backgroundColor: "transparent",
              color: "#ff4b4b",
              border: "1px solid #ff4b4b",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Disconnect
          </button>
        </div>
      )}

      {error && <p style={{ color: "#ff4b4b" }}>{error}</p>}
    </div>
  );
}
