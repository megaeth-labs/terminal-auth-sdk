// Polyfills must run before any other import. Privy and its underlying
// crypto libraries read `crypto.getRandomValues` eagerly at module load.
import "./src/polyfills";

import { PrivyProvider } from "@privy-io/expo";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { TerminalProvider } from "@megaeth-labs/terminal-auth-sdk/react-native";

import { Screen } from "./src/Screen";

const privyAppId = process.env.EXPO_PUBLIC_PRIVY_APP_ID;
const privyClientId = process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID;

const terminalConfig = {
  clientId: process.env.EXPO_PUBLIC_TERMINAL_CLIENT_ID ?? "test",
  ...(process.env.EXPO_PUBLIC_TERMINAL_API_URL && {
    baseUrl: process.env.EXPO_PUBLIC_TERMINAL_API_URL,
  }),
  ...(process.env.EXPO_PUBLIC_TERMINAL_ORIGIN && {
    terminalOrigin: process.env.EXPO_PUBLIC_TERMINAL_ORIGIN,
  }),
};

export default function App() {
  if (!privyAppId || !privyClientId) {
    return <MissingEnvScreen />;
  }

  return (
    <PrivyProvider appId={privyAppId} clientId={privyClientId}>
      <TerminalProvider config={terminalConfig}>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="auto" />
          <Screen />
        </SafeAreaView>
      </TerminalProvider>
    </PrivyProvider>
  );
}

function MissingEnvScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.missingEnv}>
        <Text style={styles.missingEnvTitle}>Missing Privy credentials</Text>
        <Text style={styles.missingEnvBody}>
          Copy <Text style={styles.mono}>.env.example</Text> to{" "}
          <Text style={styles.mono}>.env</Text> and set{" "}
          <Text style={styles.mono}>EXPO_PUBLIC_PRIVY_APP_ID</Text> and{" "}
          <Text style={styles.mono}>EXPO_PUBLIC_PRIVY_CLIENT_ID</Text> from your
          Privy dashboard.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  missingEnv: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  missingEnvTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  missingEnvBody: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  mono: {
    fontFamily: "Courier",
    fontSize: 13,
  },
});
