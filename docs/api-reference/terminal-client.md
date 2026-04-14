# TerminalClient

`TerminalClient` is the framework-agnostic auth client.

## Import

```ts
import { TerminalClient } from "@megaeth-labs/terminal-auth-sdk/core";
// or
import { TerminalClient } from "@megaeth-labs/terminal-auth-sdk";
```

## Constructor

```ts
new TerminalClient(config: TerminalSDKConfig)
```

`clientId` is required. `baseUrl`, `terminalOrigin`, and `adapter` are optional.

## Methods

### `connect`

```ts
connect(
  provider: EIP1193Provider,
  options?: ConnectOptions,
): Promise<ConnectResult>
```

Runs the auth flow and resolves with `{ accessToken, expiresIn, profileId }`.

`ConnectOptions`:

- `mode?: "popup" | "redirect"`
- `redirectUri?: string` (used for redirect mode; this is the return URL after consent and can include your own query UI state if allowlisted)

If `mode` is omitted, SDK uses the first mode supported by the active adapter.

### `handleRedirectCallback`

```ts
handleRedirectCallback(): Promise<ConnectResult | null>
```

Consumes an inbound redirect callback (when present) and completes token exchange.

- Web navigate-away redirect flow: used on return page load
- Expo in-process redirect flow: typically returns `null` (callback is handled inside connect)

On web, this can run on your normal app route bootstrap; you do not need a dedicated callback page with custom business logic.

### `disconnect`

```ts
disconnect(): Promise<void>
```

Clears active session and transitions to `"disconnected"`.

### `getStats`

```ts
getStats(): Promise<Stats>
```

Fetches current user's Terminal stats. Requires active, non-expired session.

### `getConnectionState`

```ts
getConnectionState(): ConnectionState
```

Returns `"connected" | "connecting" | "disconnected"`.

### `getConnectedAddress`

```ts
getConnectedAddress(): string | null
```

Returns connected wallet address, or `null`.

### `getProfileId`

```ts
getProfileId(): string | null
```

Returns connected Terminal profile id, or `null`.

### `restoreSession`

```ts
restoreSession(provider?: EIP1193Provider): Promise<boolean>
```

Restores a valid stored session. If `provider` is provided, SDK also validates the currently selected wallet still matches the stored session wallet.

### `on` / `off`

```ts
on(event: "stateChange", cb: (state: ConnectionState) => void): void
on(event: "error", cb: (error: Error) => void): void

off(event: "stateChange", cb: (state: ConnectionState) => void): void
off(event: "error", cb: (error: Error) => void): void
```

Subscribes/unsubscribes client events.

### `openTerminalProfile`

```ts
openTerminalProfile(): void
```

Opens Terminal dashboard/profile URL through the active platform adapter.

## Session behavior

Sessions are stored under keys derived from `clientId` through the active adapter's persistent storage backend.

- Web default adapter: `localStorage`
- Expo adapter: `expo-secure-store`

Ephemeral redirect state uses adapter ephemeral storage (web `sessionStorage`, Expo in-memory by default).
