import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

interface ChallengeInfo {
  wallet: string;
  appName: string;
  clientId: string;
}

export function ConsentPage() {
  const { login, logout, authenticated, ready, getAccessToken, user } = usePrivy();
  const [challenge, setChallenge] = useState<ChallengeInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const challengeId = params.get("challenge_id");

  useEffect(() => {
    if (!challengeId) {
      setError("Missing challenge_id in URL");
      return;
    }

    fetch(`${API_BASE}/api/v1/auth/challenge/${challengeId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load challenge: ${res.status}`);
        return res.json();
      })
      .then((json) => setChallenge(json.data ?? json))
      .catch((err) => setError(err.message));
  }, [challengeId]);

  const authorize = async () => {
    if (!challengeId) return;

    setSubmitting(true);
    try {
      const token = await getAccessToken();

      const res = await fetch(`${API_BASE}/api/v1/auth/authorize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ challengeId }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Authorization failed: ${text}`);
      }

      const json = await res.json();
      const { code } = json.data ?? json;

      if (window.opener) {
        window.opener.postMessage({ code }, "*");
        setTimeout(() => window.close(), 300);
      } else {
        setError("Lost connection to parent window. Please copy this code: " + code);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
        <h2>Error</h2>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div
        style={{
          padding: "2rem",
          fontFamily: "system-ui",
          maxWidth: "400px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <h2>Link Wallet to Terminal</h2>
        <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "1.5rem" }}>
          Log in with your Terminal account to continue.
        </p>
        <button
          onClick={() => login()}
          style={{
            width: "100%",
            padding: "0.75rem",
            fontSize: "1rem",
            background: "#000",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Log in
        </button>
        <button
          onClick={() => window.close()}
          style={{
            width: "100%",
            padding: "0.75rem",
            fontSize: "1rem",
            background: "transparent",
            border: "1px solid #ccc",
            borderRadius: "8px",
            cursor: "pointer",
            marginTop: "0.5rem",
          }}
        >
          Cancel
        </button>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "system-ui",
        maxWidth: "400px",
        margin: "0 auto",
      }}
    >
      <h2>Link Wallet to Terminal</h2>
      <div
        style={{
          background: "#f5f5f5",
          borderRadius: "8px",
          padding: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.5rem" }}>
          Logged in as:
        </p>
        <p style={{ fontFamily: "monospace", fontSize: "0.85rem", wordBreak: "break-all", marginBottom: "1rem" }}>
          {user?.wallet?.address ?? user?.email?.address ?? user?.id}
        </p>
        <p>
          <strong>{challenge.appName}</strong> wants to link your wallet:
        </p>
        <p style={{ fontFamily: "monospace", fontSize: "0.85rem", wordBreak: "break-all" }}>
          {challenge.wallet}
        </p>
      </div>
      <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "1.5rem" }}>
        By approving, this app will be able to view your Terminal profile and
        points. You can unlink at any time.
      </p>
      <button
        onClick={authorize}
        disabled={submitting}
        style={{
          width: "100%",
          padding: "0.75rem",
          fontSize: "1rem",
          background: "#000",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: submitting ? "wait" : "pointer",
        }}
      >
        {submitting ? "Approving..." : "Approve Link"}
      </button>
      <button
        onClick={() => window.close()}
        style={{
          width: "100%",
          padding: "0.75rem",
          fontSize: "1rem",
          background: "transparent",
          border: "1px solid #ccc",
          borderRadius: "8px",
          cursor: "pointer",
          marginTop: "0.5rem",
        }}
      >
        Cancel
      </button>
      <button
        onClick={() => logout()}
        style={{
          width: "100%",
          padding: "0.75rem",
          fontSize: "0.85rem",
          background: "transparent",
          border: "none",
          color: "#999",
          cursor: "pointer",
          marginTop: "0.5rem",
        }}
      >
        Log out
      </button>
    </div>
  );
}
