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
}
```

| Field      | Type     | Required | Default | Description                                                                                                  |
| ---------- | -------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| `clientId` | `string` | Yes      | —       | Your application's Terminal client ID. Provided by the MegaETH team to partner applications. |

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
  profileId: string;
}
```

| Field         | Type     | Description                                                                                                                        |
| ------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `accessToken` | `string` | Bearer token for authenticated API requests. Held internally by the client and used automatically for `getStats`. |
| `expiresIn`   | `number` | Token lifetime in seconds. The client tracks expiry automatically and rejects calls after the token expires.                        |
| `profileId`   | `string` | The user's Terminal profile ID, decoded from the access token.                                                                     |

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

## TerminalWidgetTheme

```typescript
type TerminalWidgetTheme = "dark" | "light" | "accent";
```

| Value      | Description                                                    |
| ---------- | -------------------------------------------------------------- |
| `"dark"`   | Dark background (`#19191a`), white text, green points.         |
| `"light"`  | Light background (`#ece8e8`), dark text, pink points.          |
| `"accent"` | Green background (`#26de96`), dark text, white points.         |

---

## TerminalWidgetSlot

Names for the internal elements of `TerminalWidget` that can be targeted via the `classNames` and `styles` props.

```typescript
type TerminalWidgetSlot =
  | "root"
  | "logo"
  | "info"
  | "address"
  | "rank"
  | "divider"
  | "points"
  | "label"
  | "arrow";
```

| Value       | Element                                              |
| ----------- | ---------------------------------------------------- |
| `"root"`    | Outer container (connected) or button (disconnected) |
| `"logo"`    | Terminal logo SVG                                    |
| `"info"`    | Address + rank wrapper div                           |
| `"address"` | Address text span                                    |
| `"rank"`    | Rank text span                                       |
| `"divider"` | Vertical divider                                     |
| `"points"`  | Points text span                                     |
| `"label"`   | Button label text (disconnected state only)          |
| `"arrow"`   | Arrow icon (disconnected state only)                 |

Not all slots are rendered in every state. `label` and `arrow` only exist in the disconnected button. `info`, `address`, `rank`, `divider`, and `points` only exist in the connected card.

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
| `request({ method: "personal_sign", params })`        | Signing the SIWE message          |
| `on("accountsChanged", ...)` / `removeListener(...)`  | Detecting wallet account switches |
