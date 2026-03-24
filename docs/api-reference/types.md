# Types

All types are exported from both entry points:

```typescript
import type { ... } from "@megaeth-labs/terminal-auth-sdk";
import type { ... } from "@megaeth-labs/terminal-auth-sdk/core";
```

---

## TerminalSDKConfig

Configuration passed to `TerminalClient` and `TerminalProvider`.

```typescript
interface TerminalSDKConfig {
  clientId: string;
  baseUrl?: string;
  terminalOrigin?: string;
  autoConnect?: boolean;
}
```

| Field            | Type      | Required | Default                            | Description                                                                                            |
| ---------------- | --------- | -------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `clientId`       | `string`  | Yes      | —                                  | Your application's Terminal client ID.                                                                 |
| `baseUrl`        | `string`  | No       | `https://api.terminal.megaeth.com` | Terminal API base URL. Override for self-hosted or staging environments.                               |
| `terminalOrigin` | `string`  | No       | `https://terminal.megaeth.com`     | Origin of the Terminal consent popup. Must match the origin the popup uses when sending `postMessage`. |
| `autoConnect`    | `boolean` | No       | —                                  | Reserved for future use.                                                                               |

---

## ConnectionState

```typescript
type ConnectionState = "connected" | "disconnected" | "connecting";
```

| Value            | Description                                                          |
| ---------------- | -------------------------------------------------------------------- |
| `"disconnected"` | No active session. Initial state.                                    |
| `"connecting"`   | Auth flow in progress.                                               |
| `"connected"`    | Auth flow completed successfully. An access token is held in memory. |

---

## ConnectResult

Returned by `client.connect()` and `context.connect()` on success.

```typescript
interface ConnectResult {
  accessToken: string;
  expiresIn: number;
}
```

| Field         | Type     | Description                                                                                                                        |
| ------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `accessToken` | `string` | Bearer token for authenticated API requests. Held internally by the client and used automatically for `getStats`. |
| `expiresIn`   | `number` | Token lifetime in seconds. The client tracks expiry automatically and rejects calls after the token expires.                        |

---

## Stats

Returned by `client.getStats()`.

```typescript
interface Stats {
  rank: number;
  totalPoints: number;
}
```

| Field         | Type     | Description                                     |
| ------------- | -------- | ----------------------------------------------- |
| `rank`        | `number` | The user's rank position within the current season. |
| `totalPoints` | `number` | Total points accumulated in the current season.     |

---

## EIP1193Provider

Minimal interface for any EIP-1193 compatible wallet provider (e.g. `window.ethereum`, a provider from `await connector.getProvider()` in Wagmi, or MetaMask SDK).

```typescript
interface EIP1193Provider {
  request(args: {
    method: string;
    params?: readonly unknown[] | object;
  }): Promise<unknown>;
  on(event: "accountsChanged", listener: (accounts: string[]) => void): void;
  removeListener(
    event: "accountsChanged",
    listener: (accounts: string[]) => void,
  ): void;
}
```

The SDK uses three methods on the provider:

| Method                                                | Used for                          |
| ----------------------------------------------------- | --------------------------------- |
| `request({ method: "eth_requestAccounts" })`          | Getting the wallet address        |
| `request({ method: "eth_signTypedData_v4", params })` | Signing the EIP-712 challenge     |
| `on("accountsChanged", ...)` / `removeListener(...)`  | Detecting wallet account switches |
