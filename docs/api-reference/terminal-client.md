# TerminalClient

`TerminalClient` is the core class that drives the authentication flow. It is framework-agnostic and can be used directly or through the React bindings.

**Import**

```typescript
import { TerminalClient } from "@megaeth-labs/terminal-auth-sdk/core";
// or from the full package:
import { TerminalClient } from "@megaeth-labs/terminal-auth-sdk";
```

## Constructor

```typescript
new TerminalClient(config: TerminalSDKConfig)
```

| Parameter | Type | Description |
|---|---|---|
| `config` | `TerminalSDKConfig` | SDK configuration. See [TerminalSDKConfig](./types.md#terminalsdkconfig). |

**Example**

```typescript
const client = new TerminalClient({ clientId: "your-client-id" });
```

---

## Methods

### `connect`

```typescript
connect(provider: EIP1193Provider): Promise<ConnectResult>
```

Runs the full authentication flow:

1. Requests the wallet address from the provider
2. Requests a nonce from the Terminal API
3. Generates a PKCE pair
4. Signs the EIP-712 challenge
5. Verifies the signature
6. Opens the consent popup if the wallet is not yet linked
7. Exchanges the authorization code for an access token

Sets the connection state to `"connecting"` at the start and `"connected"` on success. On failure, resets to `"disconnected"` and emits an `error` event.

**Throws** if any step in the flow fails (network error, user rejection, popup closed, etc).

---

### `disconnect`

```typescript
disconnect(): Promise<void>
```

Clears the access token, unsubscribes from wallet account change events, and sets the connection state to `"disconnected"`.

**Throws** `Error("Not connected")` if called when there is no active session.

---

### `getProfile`

```typescript
getProfile(): Promise<Profile>
```

Fetches the connected user's Terminal profile.

**Throws** `Error("Not connected")` if called before a successful `connect`.

**Returns** a [`Profile`](./types.md#profile) object.

---

### `getStats`

```typescript
getStats(): Promise<Stats>
```

Fetches the connected user's season statistics.

**Throws** `Error("Not connected")` if called before a successful `connect`.

**Returns** a [`Stats`](./types.md#stats) object.

---

### `getConnectionState`

```typescript
getConnectionState(): ConnectionState
```

Returns the current connection state synchronously. Useful for checking state without subscribing to events.

**Returns** `"connected"` | `"connecting"` | `"disconnected"`.

---

### `getConnectedAddress`

```typescript
getConnectedAddress(): string | null
```

Returns the currently connected wallet address, or `null` if not connected.

---

### `on`

```typescript
on(event: "stateChange", callback: (state: ConnectionState) => void): void
on(event: "error", callback: (error: Error) => void): void
```

Subscribes to a client event.

| Event | Payload | Description |
|---|---|---|
| `stateChange` | `ConnectionState` | Fired whenever the connection state changes. |
| `error` | `Error` | Fired when `connect` encounters an unrecoverable error. |

---

### `off`

```typescript
off(event: "stateChange", callback: (state: ConnectionState) => void): void
off(event: "error", callback: (error: Error) => void): void
```

Removes a previously registered listener. The `callback` reference must match the one passed to `on`.

---

### `openTerminalProfile`

```typescript
openTerminalProfile(): void
```

Opens `https://terminal.megaeth.com/profile` in a new browser tab. Does not require an active connection.
