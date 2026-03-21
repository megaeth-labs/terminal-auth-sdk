import { createContext } from "react";
import type { TerminalClient } from "../core/client";
import type {
  ConnectionState,
  ConnectResult,
  EIP1193Provider,
  Profile,
  Stats,
} from "../core/types";

export interface TerminalContextValue {
  state: ConnectionState;
  address: string | null;
  connect: (provider: EIP1193Provider) => Promise<ConnectResult>;
  disconnect: () => Promise<void>;
  getProfile: () => Promise<Profile>;
  getStats: () => Promise<Stats>;
  openTerminalProfile: () => void;
  client: TerminalClient;
}

export const TerminalContext = createContext<TerminalContextValue | null>(null);
