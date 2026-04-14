# React API

## TerminalProvider

Provides Terminal context to descendants.

### Import (web)

```ts
import { TerminalProvider } from "@megaeth-labs/terminal-auth-sdk";
```

### Usage

```tsx
<TerminalProvider config={{ clientId: "your-client-id" }}>
  {children}
</TerminalProvider>
```

### Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `config` | `TerminalSDKConfig` | Yes | SDK configuration |
| `children` | `ReactNode` | Yes | Child tree |

The web provider creates one `TerminalClient`, subscribes to state events, handles redirect callback when present, and restores session when no callback is pending.

For Expo/React Native, use `TerminalProvider` from `@megaeth-labs/terminal-auth-sdk/react-native`.

## useTerminal

Returns connection state and actions. Must be used within a provider.

### Import

```ts
import { useTerminal } from "@megaeth-labs/terminal-auth-sdk";
```

### Return value

| Property | Type | Description |
| --- | --- | --- |
| `state` | `ConnectionState` | Current auth state |
| `address` | `string \| null` | Connected wallet address |
| `connect` | `(provider: EIP1193Provider, options?: ConnectOptions) => Promise<ConnectResult>` | Start auth flow |
| `disconnect` | `() => Promise<void>` | Clear session |
| `getStats` | `() => Promise<Stats>` | Fetch stats |
| `openTerminalProfile` | `() => void` | Open Terminal profile/dashboard |
| `client` | `TerminalClient` | Underlying client |

## TerminalWidget

Prebuilt web UI component for connect/connected states.

### Import

```ts
import { TerminalWidget } from "@megaeth-labs/terminal-auth-sdk";
```

### Usage

```tsx
<TerminalWidget provider={window.ethereum} onError={console.error} theme="dark" />
```

### Props

| Prop | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `provider` | `EIP1193Provider` | No | — | Wallet provider |
| `onError` | `(error: Error) => void` | No | — | Error callback |
| `theme` | `TerminalWidgetTheme` | No | `"dark"` | Built-in theme |
| `classNames` | `Partial<Record<TerminalWidgetSlot, string>>` | No | — | Slot class overrides |
| `styles` | `Partial<Record<TerminalWidgetSlot, CSSProperties>>` | No | — | Slot style overrides |

Available slots: `root`, `logo`, `info`, `address`, `rank`, `divider`, `points`, `label`, `arrow`.
