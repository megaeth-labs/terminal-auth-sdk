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

| Prop       | Type                | Required | Description                                                               |
| ---------- | ------------------- | -------- | ------------------------------------------------------------------------- |
| `config`   | `TerminalSDKConfig` | Yes      | SDK configuration. Only `clientId` is required (provided by the MegaETH team). See [TerminalSDKConfig](./types.md#terminalsdkconfig). |
| `children` | `ReactNode`         | Yes      | Component tree that will have access to the context.                      |

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
  getStats,
  openTerminalProfile,
  client,
} = useTerminal();
```

### Return value

| Property              | Type                                                    | Description                                                                                                          |
| --------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `state`               | `ConnectionState`                                       | Current connection state: `"connected"`, `"connecting"`, or `"disconnected"`. Reactive — updates trigger re-renders. |
| `address`             | `string \| null`                                        | Connected wallet address. `null` when disconnected. Reactive.                                                        |
| `connect`             | `(provider: EIP1193Provider) => Promise<ConnectResult>` | Runs the full auth flow with the given provider.                                                                     |
| `disconnect`          | `() => Promise<void>`                                   | Clears the session. Throws if not connected.                                                                         |
| `getStats`            | `() => Promise<Stats>`                                  | Fetches the user's season stats. Throws if not connected.                                                            |
| `openTerminalProfile` | `() => void`                                            | Opens the user's Terminal profile page in a new tab.                                                                 |
| `client`              | `TerminalClient`                                        | The underlying `TerminalClient` instance. Use for advanced scenarios such as custom event subscriptions.             |

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
  provider={window.ethereum}
  onError={(err) => console.error(err)}
  theme="dark"
/>
```

### Props

| Prop         | Type                                                | Required | Default  | Description                                                                      |
| ------------ | --------------------------------------------------- | -------- | -------- | -------------------------------------------------------------------------------- |
| `provider`   | `EIP1193Provider`                                   | No       | —        | The EIP-1193 wallet provider. The button is disabled until a provider is passed. |
| `onError`    | `(error: Error) => void`                            | No       | —        | Called when `connect` or the profile fetch fails.                                |
| `theme`      | `TerminalWidgetTheme`                               | No       | `"dark"` | Visual theme. `"dark"`, `"light"`, or `"accent"`. See [TerminalWidgetTheme](./types.md#terminalwidgettheme). |
| `classNames` | `Partial<Record<TerminalWidgetSlot, string>>`       | No       | —        | CSS class overrides per slot. See [Customization](#customization) and [TerminalWidgetSlot](./types.md#terminalwidgetslot). |
| `styles`     | `Partial<Record<TerminalWidgetSlot, CSSProperties>>` | No       | —        | Inline style overrides per slot. See [Customization](#customization) and [TerminalWidgetSlot](./types.md#terminalwidgetslot). |

### Themes

| Theme    | Background | Text      | Points    | Border              |
| -------- | ---------- | --------- | --------- | ------------------- |
| `dark`   | `#19191a`  | white     | `#26de96` | `0.5px solid #313131` |
| `light`  | `#ece8e8`  | `#19191a` | `#ff4bc9` | `0.5px solid #bebebe` |
| `accent` | `#26de96`  | `#19191a` | white     | none                |

### Customization

The widget exposes named **slots** that map to its internal elements. Use `classNames` to apply CSS classes or `styles` to apply inline style overrides to any slot.

```tsx
<TerminalWidget
  provider={provider}
  theme="dark"
  classNames={{
    root: "rounded-xl shadow-lg",
    points: "text-pink-500 font-black",
    address: "font-mono",
  }}
  styles={{
    divider: { display: "none" },
    points: { fontSize: 32 },
  }}
/>
```

User-provided styles are applied after the built-in styles, so they always take precedence. The `root` slot targets the outer element (the `<div>` container when connected or the `<button>` when disconnected), so a separate top-level `className` or `style` prop is not needed.

For the `logo` and `arrow` slots, the `color` style property is forwarded to the SVG fill/stroke.

**Available slots**

| Slot        | Element                                         |
| ----------- | ----------------------------------------------- |
| `root`      | Outer container (connected) or button (disconnected) |
| `logo`      | Terminal logo SVG                               |
| `info`      | Address + rank wrapper div                      |
| `address`   | Address text span                               |
| `rank`      | Rank text span                                  |
| `divider`   | Vertical divider                                |
| `points`    | Points text span                                |
| `label`     | Button label text (disconnected state only)     |
| `arrow`     | Arrow icon (disconnected state only)            |

See [TerminalWidgetSlot](./types.md#terminalwidgetslot) for the type definition.

If you need fully custom rendering beyond slot overrides, use the `useTerminal` hook directly and build your own UI.

### Behavior

**Disconnected state** — renders a button with the Terminal logo, the label "Connect To Terminal", and an arrow icon. The button is disabled when `provider` is `undefined` or `state === "connecting"`.

**Connected state** — renders a display card with the Terminal logo, the truncated wallet address (first 6 + last 4 characters), the user's rank, a vertical divider, and their points.

After a successful connect, the widget calls `getStats` automatically. If `getStats` fails, the `onError` callback is invoked and the rank/points are not displayed.

The widget must be used inside a `TerminalProvider`.
