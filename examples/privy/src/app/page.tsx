"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useTerminal } from "@megaeth-labs/terminal-auth-sdk";
import { TerminalSection } from "@/components/terminal-section";
import styles from "../styles/Home.module.css";

export default function Home() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { state: terminalState, disconnect: terminalDisconnect } =
    useTerminal();

  const handleLogout = async () => {
    if (terminalState === "connected") {
      try {
        await terminalDisconnect();
      } catch {}
    }
    logout();
  };

  if (!ready) {
    return (
      <div className={styles.container}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          Terminal SDK + <a href="https://www.privy.io">Privy</a>
        </h1>

        {authenticated ? (
          <>
            <button className={styles.logoutButton} onClick={handleLogout}>
              Logout
            </button>
            <TerminalSection />
          </>
        ) : (
          <button className={styles.loginButton} onClick={login}>
            Login with Privy
          </button>
        )}
      </main>
    </div>
  );
}
