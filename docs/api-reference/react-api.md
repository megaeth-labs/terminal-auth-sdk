# React API

## TerminalProvider

Provides a `TerminalClient` instance and connection state to all descendant components via React context.

**Import**

```typescript
import { TerminalProvider } from "@megaeth-labs/terminal-auth-sdk";
```

**Usage**

```tsx
<TerminalProvider config={{ clientId: "your-client-id" }}>
  {children}
</TerminalProvider>
```

### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `config` | `TerminalSDKConfig` | Yes | SDK configuration. See [TerminalSDKConfig](./types.md#terminalsdkconfig). |
| `children` | `ReactNode` | Yes | Component tree that will have access to the context. |

The provider creates one `TerminalClient` on mount and keeps it stable for the lifetime of the component. State changes from the client are synced to React state automatically.

---

## useTerminal

Returns the current Terminal connection state and all available actions. Must be used inside a `TerminalProvider`.

**Import**

```typescript
import { useTerminal } from "@megaeth-labs/terminal-auth-sdk";
```

**Usage**

```typescript
const {
  state,
  address,
  connect,
  disconnect,
  getProfile,
  getStats,
  openTerminalProfile,
  client,
} = useTerminal();
```

### Return value

| Property | Type | Description |
|---|---|---|
| `state` | `ConnectionState` | Current connection state: `"connected"`, `"connecting"`, or `"disconnected"`. Reactive — updates trigger re-renders. |
| `address` | `string \| null` | Connected wallet address. `null` when disconnected. Reactive. |
| `connect` | `(provider: EIP1193Provider) => Promise<ConnectResult>` | Runs the full auth flow with the given provider. |
| `disconnect` | `() => Promise<void>` | Clears the session. Throws if not connected. |
| `getProfile` | `() => Promise<Profile>` | Fetches the user's Terminal profile. Throws if not connected. |
| `getStats` | `() => Promise<Stats>` | Fetches the user's season stats. Throws if not connected. |
| `openTerminalProfile` | `() => void` | Opens the user's Terminal profile page in a new tab. |
| `client` | `TerminalClient` | The underlying `TerminalClient` instance. Use for advanced scenarios such as custom event subscriptions. |

Throws an error if called outside of a `TerminalProvider`.

---

## TerminalWidget

A pre-styled button and connected-state card that handles the full connect flow. Renders as a button when disconnected and as a profile display when connected.

**Import**

```typescript
import { TerminalWidget } from "@megaeth-labs/terminal-auth-sdk";
```

**Usage**

```tsx
<TerminalWidget
  provider={connectorClient}
  onError={(err) => console.error(err)}
/>
```

### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `provider` | `EIP1193Provider` | No | The EIP-1193 wallet provider. The button is disabled until a provider is passed. |
| `onError` | `(error: Error) => void` | No | Called when `connect` or the profile fetch fails. |

### Behavior

**Disconnected state** — renders a button with the Terminal logo, the label "Connect To Terminal", and an arrow icon. The button is disabled when `provider` is `undefined` or `state === "connecting"`.

**Connected state** — renders a display card with the Terminal logo, the truncated wallet address (first 6 + last 4 characters), the user's rank, and their points.

After a successful connect, the widget calls `getProfile` automatically. If `getProfile` fails, the `onError` callback is invoked and the rank/points are not displayed.

The widget must be used inside a `TerminalProvider`.
