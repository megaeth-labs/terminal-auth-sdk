import { createContext } from "react";
import type { TerminalClient } from "../core/client";
import type {
  ConnectionState,
  ConnectResult,
  EIP1193Provider,
  Profile,
} from "../core/types";

export interface TerminalContextValue {
  state: ConnectionState;
  connect: (provider: EIP1193Provider) => Promise<ConnectResult>;
  disconnect: () => Promise<void>;
  getProfile: () => Promise<Profile>;
  openTerminalProfile: () => void;
  client: TerminalClient;
}

export const TerminalContext = createContext<TerminalContextValue | null>(null);
