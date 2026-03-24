# React Integration

The SDK ships with three React primitives: `TerminalProvider`, the `useTerminal` hook, and the `TerminalWidget` component.

## TerminalProvider

`TerminalProvider` creates and manages a `TerminalClient` instance for your application. Place it near the root of your component tree, inside any wallet provider (e.g. Wagmi, RainbowKit).

```tsx
import { TerminalProvider } from "@megaeth-labs/terminal-auth-sdk";

function App({ children }) {
  return (
    <TerminalProvider config={{ clientId: "your-client-id" }}>
      {children}
    </TerminalProvider>
  );
}
```

### Props

| Prop | Type | Description |
|---|---|---|
| `config` | `TerminalSDKConfig` | SDK configuration. Only `clientId` is required (provided by the MegaETH team). See [configuration options](../api-reference/types.md#terminalsdkconfig). |
| `children` | `ReactNode` | Your application tree. |

The provider creates a single `TerminalClient` instance on mount. It subscribes to `stateChange` events and keeps `state` and `address` in sync with React state automatically.

---

## useTerminal

`useTerminal` returns the current connection state and all SDK actions. It must be called within a component that is a descendant of `TerminalProvider`.

```tsx
import { useTerminal } from "@megaeth-labs/terminal-auth-sdk";

function MyComponent() {
  const {
    state,
    address,
    connect,
    disconnect,
    getStats,
    openTerminalProfile,
    client,
  } = useTerminal();
}
```

### Returned values

| Property | Type | Description |
|---|---|---|
| `state` | `ConnectionState` | Current connection state: `"connected"`, `"connecting"`, or `"disconnected"`. |
| `address` | `string \| null` | Connected wallet address, or `null` if not connected. |
| `connect` | `(provider: EIP1193Provider) => Promise<ConnectResult>` | Runs the full auth flow. |
| `disconnect` | `() => Promise<void>` | Clears the access token and disconnects. |
| `getStats` | `() => Promise<Stats>` | Fetches the user's season stats. Requires an active connection. |
| `openTerminalProfile` | `() => void` | Opens the user's Terminal profile in a new tab. |
| `client` | `TerminalClient` | The underlying client instance. Use for advanced scenarios. |

### Example — connect and display stats

```tsx
function ConnectButton() {
  const { state, address, connect, getStats } = useTerminal();
  const [stats, setStats] = useState(null);

  const handleConnect = async () => {
    await connect(window.ethereum);
    const s = await getStats();
    setStats(s);
  };

  if (state === "connected") {
    return (
      <div>
        <p>{address}</p>
        {stats && <p>Rank {stats.rank} — {stats.totalPoints} PT</p>}
      </div>
    );
  }

  return (
    <button onClick={handleConnect} disabled={state === "connecting"}>
      Connect to Terminal
    </button>
  );
}
```

---

## TerminalWidget

`TerminalWidget` is a pre-styled button that manages the full connect flow. It renders as a connect button when disconnected and as a profile card when connected.

```tsx
import { TerminalWidget } from "@megaeth-labs/terminal-auth-sdk";

function MyPage() {
  return (
    <TerminalWidget
      provider={window.ethereum}
      onError={(err) => console.error(err)}
      theme="dark"
    />
  );
}
```

### Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `provider` | `EIP1193Provider` | No | — | The wallet provider. The button is disabled until a provider is passed. |
| `onError` | `(error: Error) => void` | No | — | Called if `connect` or `getStats` throws. |
| `theme` | `TerminalWidgetTheme` | No | `"dark"` | Visual theme. `"dark"`, `"light"`, or `"accent"`. |

### Themes

The widget ships with three built-in themes:

- **`"dark"`** — dark background with green points. Designed for dark UIs.
- **`"light"`** — light background with pink points. Designed for light UIs.
- **`"accent"`** — green background with white points. A bold, branded variant.

```tsx
<TerminalWidget provider={provider} theme="light" />
<TerminalWidget provider={provider} theme="accent" />
```

### States

**Disconnected / Connecting** — renders a button with the Terminal logo, the label "Connect To Terminal", and an arrow icon. The button is disabled while `state === "connecting"` or when no `provider` is supplied.

**Connected** — renders a card showing the Terminal logo, the truncated wallet address, the user's rank, a vertical divider, and their points.

The widget automatically calls `getStats` after connecting to populate the rank and points display.

### Styling

`TerminalWidget` uses inline styles only and has no external CSS dependencies. Colors, borders, and logo fills adjust automatically based on the selected `theme`.

For custom styling beyond the built-in themes, use the `classNames` and `styles` props to target individual sub-elements by slot name:

```tsx
<TerminalWidget
  provider={provider}
  theme="dark"
  classNames={{
    root: "rounded-xl shadow-lg",
    address: "font-mono",
  }}
  styles={{
    points: { fontSize: 32, color: "#e94560" },
    divider: { display: "none" },
  }}
/>
```

Available slots: `root`, `logo`, `info`, `address`, `rank`, `divider`, `points`, `label`, `arrow`. See the [full slot reference](../api-reference/react-api.md#customization) for details.

If you need fully custom rendering beyond slot overrides, use `useTerminal` directly and build your own UI.
