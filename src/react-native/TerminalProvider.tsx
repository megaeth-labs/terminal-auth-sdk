"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { TerminalClient } from "../core/client";
import type {
  ConnectionState,
  ConnectOptions,
  EIP1193Provider,
  TerminalSDKConfig,
} from "../core/types";
import { TerminalContext } from "../react/context";
import { createExpoAdapter, type CreateExpoAdapterOptions } from "./adapter";

interface TerminalProviderProps {
  /**
   * SDK configuration. Must include `clientId`. The `adapter` field is
   * ignored — the provider always installs an Expo adapter built from
   * `adapterOptions`. If you need a custom platform adapter, construct
   * a `TerminalClient` directly with `new TerminalClient({ adapter })`
   * and pair it with the shared `TerminalContext`.
   */
  config: TerminalSDKConfig;
  /**
   * Optional overrides forwarded to `createExpoAdapter`. Use this to
   * customize the redirect path (defaults to `terminal-auth`), swap
   * individual services (storage/crypto), or opt into AsyncStorage for
   * platforms that lack SecureStore.
   */
  adapterOptions?: CreateExpoAdapterOptions;
  children: ReactNode;
}

export function TerminalProvider({
  config,
  adapterOptions,
  children,
}: TerminalProviderProps) {
  // Construct the client exactly once. `adapterOptions` is captured in
  // the initializer closure; changing it across re-renders will not
  // rebuild the client. This matches the web provider's behavior where
  // `config` is also frozen after first render.
  const [client] = useState(
    () =>
      new TerminalClient({
        ...config,
        adapter: config.adapter ?? createExpoAdapter(adapterOptions),
      })
  );
  const [state, setState] = useState<ConnectionState>("disconnected");
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    const onStateChange = (newState: ConnectionState) => {
      setState(newState);
      setAddress(client.getConnectedAddress());
    };
    client.on("stateChange", onStateChange);

    // React Native resolves the redirect flow in-process inside
    // `connect()`, so there is no two-phase `handleRedirectCallback`
    // path on this platform. We only need to restore a previously
    // saved session from SecureStore on mount.
    client.restoreSession().catch(() => {
      // Silently ignore — a failed restore just means the user is
      // not logged in. Errors are already emitted through the
      // client's `error` event for consumers who want to observe.
    });

    return () => client.off("stateChange", onStateChange);
  }, [client]);

  const connect = useCallback(
    (provider: EIP1193Provider, options?: ConnectOptions) =>
      client.connect(provider, options),
    [client]
  );

  const disconnect = useCallback(() => client.disconnect(), [client]);

  const getStats = useCallback(() => client.getStats(), [client]);

  const openTerminalProfile = useCallback(
    () => client.openTerminalProfile(),
    [client]
  );

  const value = useMemo(
    () => ({
      state,
      address,
      connect,
      disconnect,
      getStats,
      openTerminalProfile,
      client,
    }),
    [state, address, connect, disconnect, getStats, openTerminalProfile, client]
  );

  return (
    <TerminalContext.Provider value={value}>
      {children}
    </TerminalContext.Provider>
  );
}
