import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  TerminalWidget,
  useTerminal,
  type EIP1193Provider,
  type Stats,
} from "@megaeth-labs/terminal-auth-sdk";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import type { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.css";

const Home: NextPage = () => {
  const { isConnected, connector } = useAccount();
  const [provider, setProvider] = useState<EIP1193Provider | undefined>();

  useEffect(() => {
    if (!connector) return;
    let cancelled = false;
    connector.getProvider().then((p) => {
      if (cancelled) return;
      const candidate = p as Partial<EIP1193Provider>;
      if (
        candidate &&
        typeof candidate.request === "function" &&
        typeof candidate.on === "function" &&
        typeof candidate.removeListener === "function"
      ) {
        setProvider(candidate as EIP1193Provider);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [connector]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Terminal SDK — RainbowKit + Next.js Example</title>
        <meta
          content="Terminal Auth SDK with RainbowKit and Next.js"
          name="description"
        />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Terminal SDK +{" "}
          <a href="https://www.rainbowkit.com">RainbowKit</a>
        </h1>

        <div style={{ marginTop: "2rem" }}>
          <ConnectButton />
        </div>

        {isConnected && (
          <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Dark (default)</h3>
            <TerminalWidget
              provider={provider}
              theme="dark"
              onError={(err) => console.error("Terminal error:", err)}
            />

            <h3 style={{ margin: 0 }}>Light</h3>
            <TerminalWidget
              provider={provider}
              theme="light"
              onError={(err) => console.error("Terminal error:", err)}
            />

            <h3 style={{ margin: 0 }}>Accent</h3>
            <TerminalWidget
              provider={provider}
              theme="accent"
              onError={(err) => console.error("Terminal error:", err)}
            />

            <h3 style={{ margin: 0 }}>Custom styles</h3>
            <TerminalWidget
              provider={provider}
              theme="dark"
              styles={{
                root: { borderRadius: "9999px", padding: "10px 24px" },
                points: { color: "#f0b90b" },
                address: { fontWeight: 700 },
              }}
              onError={(err) => console.error("Terminal error:", err)}
            />

            <h3 style={{ margin: 0 }}>getStats() — read:stats scope</h3>
            <StatsPanel />
          </div>
        )}
      </main>
    </div>
  );
};

function StatsPanel() {
  const { state, getStats } = useTerminal();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state !== "connected") return;
    let cancelled = false;
    getStats()
      .then((s) => {
        if (!cancelled) {
          setStats(s);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [state, getStats]);

  if (state !== "connected") return null;

  return (
    <div
      style={{
        minWidth: "320px",
        padding: "16px 20px",
        borderRadius: "10px",
        border: "1px solid #313131",
        background: "#19191a",
        color: "#dfd9d9",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: "13px",
        lineHeight: 1.6,
      }}
    >
      {error ? (
        <div style={{ color: "#ff5c5c" }}>{error}</div>
      ) : !stats ? (
        <div style={{ opacity: 0.6 }}>Loading…</div>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          <li>
            <span style={{ opacity: 0.6 }}>rank</span>: {stats.rank}
          </li>
          <li>
            <span style={{ opacity: 0.6 }}>totalPoints</span>:{" "}
            {stats.totalPoints}
          </li>
          <li>
            <span style={{ opacity: 0.6 }}>isBoosted</span>:{" "}
            <span
              style={{
                color: stats.isBoosted ? "#26de96" : "#dfd9d9",
                fontWeight: 600,
              }}
            >
              {String(stats.isBoosted)}
            </span>
          </li>
        </ul>
      )}
    </div>
  );
}

export default Home;
