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
| `config` | `TerminalSDKConfig` | SDK configuration. See [configuration options](../api-reference/types.md#terminalsdkconfig). |
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
    getProfile,
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
| `getProfile` | `() => Promise<Profile>` | Fetches the user's Terminal profile. Requires an active connection. |
| `getStats` | `() => Promise<Stats>` | Fetches the user's season stats. Requires an active connection. |
| `openTerminalProfile` | `() => void` | Opens the user's Terminal profile in a new tab. |
| `client` | `TerminalClient` | The underlying client instance. Use for advanced scenarios. |

### Example — connect and display profile

```tsx
function ConnectButton() {
  const { state, address, connect, getProfile } = useTerminal();
  const [profile, setProfile] = useState(null);

  const handleConnect = async () => {
    await connect(window.ethereum);
    const p = await getProfile();
    setProfile(p);
  };

  if (state === "connected") {
    return (
      <div>
        <p>{address}</p>
        {profile && <p>Rank {profile.rank} — {profile.points} PT</p>}
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
    />
  );
}
```

### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `provider` | `EIP1193Provider` | No | The wallet provider. The button is disabled until a provider is passed. |
| `onError` | `(error: Error) => void` | No | Called if `connect` or `getProfile` throws. |

### States

**Disconnected / Connecting** — renders a button with the Terminal logo, the label "Connect To Terminal", and an arrow icon. The button is disabled while `state === "connecting"` or when no `provider` is supplied.

**Connected** — renders a card showing the Terminal logo, the truncated wallet address, the user's rank, and their points.

The widget automatically calls `getProfile` after connecting to populate the rank and points display.

### Styling

`TerminalWidget` uses inline styles only and has no external CSS dependencies. It is designed for dark backgrounds (`#1a1a1a` background, white text, green points indicator). If you need custom styling, use `useTerminal` directly and build your own UI.
