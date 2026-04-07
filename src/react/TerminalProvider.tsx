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
import { TerminalContext } from "./context";

interface TerminalProviderProps {
  config: TerminalSDKConfig;
  children: ReactNode;
}

export function TerminalProvider({ config, children }: TerminalProviderProps) {
  const [client] = useState(() => new TerminalClient(config));
  const [state, setState] = useState<ConnectionState>("disconnected");
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    const onStateChange = (newState: ConnectionState) => {
      setState(newState);
      setAddress(client.getConnectedAddress());
    };
    client.on("stateChange", onStateChange);

    client
      .handleRedirectCallback()
      .then((result) => {
        if (!result) {
          client.restoreSession();
        }
      })
      .catch(() => {
        client.restoreSession();
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
    () => ({ state, address, connect, disconnect, getStats, openTerminalProfile, client }),
    [state, address, connect, disconnect, getStats, openTerminalProfile, client]
  );

  return (
    <TerminalContext.Provider value={value}>
      {children}
    </TerminalContext.Provider>
  );
}
