import "@rainbow-me/rainbowkit/styles.css";

import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { TerminalWidget, type EIP1193Provider } from "@megaeth-labs/terminal-auth-sdk";

function isEIP1193Provider(provider: unknown): provider is EIP1193Provider {
  if (!provider || typeof provider !== "object") return false;

  const candidate = provider as Partial<EIP1193Provider>;
  return (
    typeof candidate.request === "function" &&
    typeof candidate.on === "function" &&
    typeof candidate.removeListener === "function"
  );
}

export function App() {
  const { isConnected, connector } = useAccount();
  const [provider, setProvider] = useState<EIP1193Provider | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    if (!connector) return;

    connector
      .getProvider()
      .then((resolvedProvider) => {
        if (!cancelled) {
          setProvider(
            isEIP1193Provider(resolvedProvider) ? resolvedProvider : undefined
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProvider(undefined);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [connector]);

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
