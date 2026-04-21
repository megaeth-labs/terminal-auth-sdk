// React Native entry point. Consumers import from
// `@megaeth-labs/terminal-auth-sdk/react-native`.
//
// The default export path (`@megaeth-labs/terminal-auth-sdk`) targets
// web browsers and will crash in a React Native runtime because the
// web adapter references `window` and `localStorage`. Always use this
// subpath in a React Native app.

export { TerminalProvider } from "./TerminalProvider";
export { useTerminal } from "../react/useTerminal";
export type { TerminalContextValue } from "../react/context";

export {
  createExpoAdapter,
  createAsyncStorageBackend,
  type CreateExpoAdapterOptions,
} from "./adapter";

// Re-export the core client and types so consumers can construct a
// TerminalClient directly (e.g. outside of React) without needing a
// second import path.
export { TerminalClient } from "../core/client";
export type {
  AuthTransport,
  ConnectionState,
  ConnectMode,
  ConnectOptions,
  ConnectResult,
  EIP1193Provider,
  Stats,
  TerminalSDKConfig,
} from "../core/types";
export type {
  AuthSessionSuccess,
  PlatformAdapter,
  PlatformCrypto,
  PlatformStorage,
} from "../core/adapter";
