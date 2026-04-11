import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  useEmbeddedEthereumWallet,
  useLoginWithEmail,
  usePrivy,
} from "@privy-io/expo";
import {
  useTerminal,
  type EIP1193Provider,
} from "@megaeth-labs/terminal-auth-sdk/react-native";

type Stats = { rank: number; totalPoints: number };

/**
 * Single-screen demo. Two phases:
 *
 * 1. Privy login via email OTP. When complete, `usePrivy().user` becomes
 *    truthy and an embedded Ethereum wallet is available.
 * 2. Terminal connect. The Privy wallet's EIP-1193 provider is handed to
 *    `useTerminal().connect()`, which opens an in-app browser via the
 *    Expo adapter's `openAuthSession` and resolves when the redirect
 *    lands back on the registered deep link scheme.
 *
 * The `connect()` call does not specify a `mode`. The Expo adapter
 * declares `supportedModes: ["redirect"]`, so the SDK picks redirect as
 * the default.
 */
export function Screen() {
  const { user } = usePrivy();

  if (!user) {
    return <LoginView />;
  }
  return <ConnectedView />;
}

function LoginView() {
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleSendCode = async () => {
    setError(undefined);
    setBusy(true);
    try {
      await sendCode({ email });
      setPhase("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    setError(undefined);
    setBusy(true);
    try {
      await loginWithCode({ email, code });
      // On success, usePrivy().user becomes truthy and Screen re-renders
      // into ConnectedView.
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Terminal SDK — Expo Example</Text>
      <Text style={styles.subtitle}>Step 1 of 2: Sign in with Privy</Text>

      {phase === "email" ? (
        <>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Button
            title="Send code"
            onPress={handleSendCode}
            disabled={busy || !email.includes("@")}
          />
        </>
      ) : (
        <>
          <Text style={styles.hint}>We sent a code to {email}</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder="6-digit code"
            inputMode="numeric"
          />
          <Button
            title="Verify"
            onPress={handleVerify}
            disabled={busy || code.length < 6}
          />
          <View style={styles.spacer} />
          <Button
            title="Use a different email"
            onPress={() => {
              setCode("");
              setPhase("email");
            }}
            disabled={busy}
          />
        </>
      )}

      {busy && <ActivityIndicator style={styles.spinner} />}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

function ConnectedView() {
  const { user, logout } = usePrivy();
  const { wallets } = useEmbeddedEthereumWallet();
  const { state, address, connect, disconnect, getStats } = useTerminal();

  const [provider, setProvider] = useState<EIP1193Provider>();
  const [stats, setStats] = useState<Stats>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  // Extract the EIP-1193 provider from the Privy embedded wallet. The
  // first wallet in the array is the primary embedded Ethereum wallet.
  useEffect(() => {
    const wallet = wallets[0];
    if (!wallet) {
      setProvider(undefined);
      return;
    }
    let cancelled = false;
    wallet.getProvider().then(
      (p) => {
        if (!cancelled) setProvider(p as unknown as EIP1193Provider);
      },
      (err) => {
        if (!cancelled) setError(String(err));
      }
    );
    return () => {
      cancelled = true;
    };
  }, [wallets]);

  // Fetch Terminal stats whenever the SDK reports a successful connection.
  useEffect(() => {
    if (state !== "connected") {
      setStats(undefined);
      return;
    }
    let cancelled = false;
    getStats().then(
      (s) => {
        if (!cancelled) setStats(s);
      },
      () => {
        /* swallow — stats are nice-to-have */
      }
    );
    return () => {
      cancelled = true;
    };
  }, [state, getStats]);

  const handleConnect = async () => {
    if (!provider) return;
    setError(undefined);
    setBusy(true);
    try {
      // No `mode` specified — the Expo adapter's supportedModes[0] is
      // "redirect", which is the only mode native apps can drive.
      await connect(provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    setError(undefined);
    try {
      await disconnect();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Terminal SDK — Expo Example</Text>
      <Text style={styles.subtitle}>Step 2 of 2: Connect to Terminal</Text>

      <View style={styles.infoBlock}>
        <Text style={styles.label}>Privy user</Text>
        <Text style={styles.value}>{user?.id ?? "\u2014"}</Text>
      </View>

      <View style={styles.infoBlock}>
        <Text style={styles.label}>Terminal state</Text>
        <Text style={styles.value}>{state}</Text>
      </View>

      {address && (
        <View style={styles.infoBlock}>
          <Text style={styles.label}>Connected address</Text>
          <Text style={styles.valueMono}>{address}</Text>
        </View>
      )}

      {stats && (
        <View style={styles.infoBlock}>
          <Text style={styles.label}>Stats</Text>
          <Text style={styles.value}>
            Rank #{stats.rank} — {stats.totalPoints.toLocaleString()} PT
          </Text>
        </View>
      )}

      {state !== "connected" ? (
        <Button
          title={provider ? "Connect to Terminal" : "Preparing wallet…"}
          onPress={handleConnect}
          disabled={!provider || busy || state === "connecting"}
        />
      ) : (
        <Button title="Disconnect Terminal" onPress={handleDisconnect} />
      )}

      {busy && <ActivityIndicator style={styles.spinner} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.spacer} />
      <Button title="Log out of Privy" onPress={logout} color="#b91c1c" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
  },
  hint: {
    fontSize: 13,
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  infoBlock: {
    paddingVertical: 6,
  },
  label: {
    fontSize: 12,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 15,
    color: "#111827",
  },
  valueMono: {
    fontSize: 12,
    color: "#111827",
    fontFamily: "Courier",
  },
  error: {
    color: "#b91c1c",
    fontSize: 13,
    marginTop: 8,
  },
  spinner: {
    marginTop: 12,
  },
  spacer: {
    height: 16,
  },
});
