import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useTerminal } from "terminal-auth-sdk";
import { useAccount, useConnectorClient } from "wagmi";
import type { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.css";

const Home: NextPage = () => {
  const { isConnected } = useAccount();
  const { data: connectorClient } = useConnectorClient();
  const { state, connect } = useTerminal();

  const handleTerminalConnect = async () => {
    if (!connectorClient) return;
    try {
      const result = await connect(connectorClient);
      console.log("Terminal connected:", result);
    } catch (err) {
      console.error("Terminal connect failed:", err);
    }
  };

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
          <div style={{ marginTop: "2rem", textAlign: "center" }}>
            <p>Terminal state: <strong>{state}</strong></p>
            <button
              onClick={handleTerminalConnect}
              disabled={state === "connecting" || state === "connected"}
              style={{
                marginTop: "1rem",
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                cursor: state === "connecting" ? "wait" : "pointer",
              }}
            >
              {state === "connected"
                ? "Connected to Terminal"
                : state === "connecting"
                  ? "Connecting..."
                  : "Connect to Terminal"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
