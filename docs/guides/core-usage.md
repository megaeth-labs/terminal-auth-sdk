# Core Usage

The `@megaeth-labs/terminal-auth-sdk/core` entry point exports `TerminalClient` without any React dependency. Use this if you are not using React, or if you want full manual control over state management.

## Setup

```typescript
import { TerminalClient } from "@megaeth-labs/terminal-auth-sdk/core";

const client = new TerminalClient({
  clientId: "your-client-id",
});
```

## Connecting

Pass any EIP-1193 compatible provider to `connect`. The method resolves with an `accessToken` and `expiresIn` on success, or throws on failure.

```typescript
await client.connect(window.ethereum);
console.log("Connected to Terminal");
```

## Fetching data

`getStats` requires an active connection. It throws if called when disconnected.

```typescript
const stats = await client.getStats();
console.log(stats.rank);        // 42
console.log(stats.totalPoints); // 1500
```

## Disconnecting

```typescript
await client.disconnect();
```

This clears the access token, unsubscribes from wallet account change events, and transitions the state to `"disconnected"`.

## Listening to events

`TerminalClient` is an event emitter. Subscribe to `stateChange` to react to connection state transitions, and to `error` to handle failures.

```typescript
client.on("stateChange", (state) => {
  console.log("State:", state); // "connecting" | "connected" | "disconnected"
});

client.on("error", (err) => {
  console.error("Terminal error:", err.message);
});

// Remove a listener when done
client.off("stateChange", handler);
```

## Checking current state

```typescript
const state = client.getConnectionState();
// "connected" | "connecting" | "disconnected"

const address = client.getConnectedAddress();
// "0xabc..." or null
```

## Opening the Terminal profile

```typescript
client.openTerminalProfile();
// Opens the user's Terminal profile in a new tab
```

## Full example

```typescript
import { TerminalClient } from "@megaeth-labs/terminal-auth-sdk/core";

const client = new TerminalClient({ clientId: "your-client-id" });

client.on("stateChange", (state) => {
  document.getElementById("status").textContent = state;
});

client.on("error", (err) => {
  console.error(err);
});

async function connect() {
  await client.connect(window.ethereum);
  console.log("Connected to Terminal");

  const stats = await client.getStats();
  console.log(`Rank ${stats.rank} — ${stats.totalPoints} PT`);
}

async function disconnect() {
  await client.disconnect();
}
```

## Account change detection

After connecting, the SDK automatically listens for `accountsChanged` events on the provider. If the user switches to a different wallet account, the SDK disconnects automatically and emits `stateChange: disconnected`. No manual cleanup is needed.
