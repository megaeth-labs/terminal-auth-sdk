import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useTerminal, type EIP1193Provider } from "terminal-auth-sdk";
import { useAccount } from "wagmi";
import type { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.css";

function isEIP1193Provider(provider: unknown): provider is EIP1193Provider {
  if (!provider || typeof provider !== "object") return false;

  const candidate = provider as Partial<EIP1193Provider>;
  return (
    typeof candidate.request === "function" &&
    typeof candidate.on === "function" &&
    typeof candidate.removeListener === "function"
  );
}

const Home: NextPage = () => {
  const { isConnected, connector } = useAccount();
  const { state, connect } = useTerminal();

  const handleTerminalConnect = async () => {
    if (!connector) return;
    try {
      const provider = await connector.getProvider();
      if (!isEIP1193Provider(provider)) {
        throw new Error("Connector provider does not implement full EIP-1193");
      }
      await connect(provider);
      console.log("Terminal connected");
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
