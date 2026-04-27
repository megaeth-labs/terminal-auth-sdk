# Types

Types are exported from:

```ts
import type { ... } from "@megaeth-labs/terminal-auth-sdk";
import type { ... } from "@megaeth-labs/terminal-auth-sdk/core";
import type { ... } from "@megaeth-labs/terminal-auth-sdk/react-native";
```

## TerminalSDKConfig

```ts
interface TerminalSDKConfig {
  clientId: string;
  baseUrl?: string;
  terminalOrigin?: string;
  adapter?: PlatformAdapter;
  authTransport?: AuthTransport;
}
```

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `clientId` | `string` | Yes | Terminal client id issued by MegaETH |
| `baseUrl` | `string` | No | Override API base URL |
| `terminalOrigin` | `string` | No | Override Terminal origin used for consent/profile URLs |
| `adapter` | `PlatformAdapter` | No | Custom platform adapter (storage/crypto/auth-session behavior) |
| `authTransport` | `AuthTransport` | No | Credential transport. Defaults to `"bearer"` |

## AuthTransport

```ts
type AuthTransport = "bearer";
```

`"bearer"` is the only supported auth transport. Cookie-backed transports were not shipped as public SDK behavior; TypeScript does not accept them and runtime configuration rejects non-`"bearer"` values.

## ConnectMode

```ts
type ConnectMode = "popup" | "redirect";
```

## ConnectOptions

```ts
interface ConnectOptions {
  mode?: ConnectMode;
  redirectUri?: string;
}
```

## ConnectResult

```ts
interface ConnectResult {
  accessToken: string;
  expiresIn: number;
  profileId: string;
}
```

## ConnectionState

```ts
type ConnectionState = "connected" | "disconnected" | "connecting";
```

## Stats

```ts
interface Stats {
  rank: number;
  totalPoints: number;
}
```

## EIP1193Provider

```ts
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

## TerminalWidgetTheme

```ts
type TerminalWidgetTheme = "dark" | "light" | "accent";
```

## TerminalWidgetSlot

```ts
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
