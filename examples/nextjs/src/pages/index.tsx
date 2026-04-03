import { ConnectButton } from "@rainbow-me/rainbowkit";
import { TerminalWidget, type EIP1193Provider } from "@megaeth-labs/terminal-auth-sdk";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import type { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.css";

const Home: NextPage = () => {
  const { isConnected, connector } = useAccount();
  const [provider, setProvider] = useState<EIP1193Provider | undefined>();

  useEffect(() => {
    if (!connector) {
      setProvider(undefined);
      return;
    }
    connector.getProvider().then((p) => {
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
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
