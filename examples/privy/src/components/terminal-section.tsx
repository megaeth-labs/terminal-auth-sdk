"use client";

import { useEffect, useState } from "react";
import {
  TerminalWidget,
  useTerminal,
  type EIP1193Provider,
  type Stats,
} from "@megaeth-labs/terminal-auth-sdk";
import { useWallets } from "@privy-io/react-auth";
import styles from "../styles/Home.module.css";

export function TerminalSection() {
  const { state, disconnect, getStats, openTerminalProfile } = useTerminal();
  const { wallets } = useWallets();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [eip1193Provider, setEip1193Provider] = useState<
    EIP1193Provider | undefined
  >(undefined);

  useEffect(() => {
    let cancelled = false;
    const w = wallets[0];
    if (!w) {
      setEip1193Provider(undefined);
      return;
    }
    w.getEthereumProvider().then(
      (provider) => {
        if (!cancelled) setEip1193Provider(provider);
      },
      () => {
        if (!cancelled) setEip1193Provider(undefined);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [wallets]);

  const handleDisconnect = async () => {
    try {
      setError(null);
      await disconnect();
      setStats(null);
    } catch (err) {
      console.error(err);
      setError("Failed to disconnect from Terminal");
    }
  };

  const handleGetStats = async () => {
    try {
      setError(null);
      const s = await getStats();
      setStats(s);
    } catch (err) {
      console.error(err);
      setError("Failed to get stats");
    }
  };

  const isConnected = state === "connected";

  return (
    <div className={styles.terminalSection}>
      <p className={styles.stateText}>
        Terminal state: <strong>{state}</strong>
      </p>

      {!wallets[0] && (
        <p className={styles.hint}>
          Waiting for Privy to provision an Ethereum wallet...
        </p>
      )}

      <TerminalWidget
        provider={eip1193Provider}
        onError={(err) => {
          console.error(err);
          setError(err.message);
        }}
      />

      <div className={styles.actions}>
        <button
          className={styles.actionButton}
          onClick={handleDisconnect}
          disabled={!isConnected}
        >
          Disconnect
        </button>
        <button
          className={styles.actionButton}
          onClick={handleGetStats}
          disabled={!isConnected}
        >
          Get Stats
        </button>
        <button
          className={styles.actionButton}
          onClick={openTerminalProfile}
          disabled={!isConnected}
        >
          Open Terminal Profile
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {stats && (
        <div className={styles.stats}>
          <p>
            <strong>Rank:</strong> #{stats.rank}
          </p>
          <p>
            <strong>Total Points:</strong> {stats.totalPoints}
          </p>
        </div>
      )}
    </div>
  );
}
