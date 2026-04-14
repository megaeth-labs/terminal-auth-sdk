# Core Usage

Use `@megaeth-labs/terminal-auth-sdk/core` when you are not using React or need full control.

## Setup

```ts
import { TerminalClient } from "@megaeth-labs/terminal-auth-sdk/core";

const client = new TerminalClient({
  clientId: "your-client-id",
});
```

## Restore session

```ts
const restored = await client.restoreSession(provider);
if (restored) {
  console.log("Session restored");
}
```

`restoreSession(provider?)` returns `Promise<boolean>`.

## Connect

```ts
await client.connect(provider); // popup default on web

await client.connect(provider, { mode: "redirect" });

await client.connect(provider, {
  mode: "redirect",
  redirectUri: "https://your-app.com/auth/terminal-callback",
});

// Query params are fine for driving UI state (must match allowlist exactly)
await client.connect(provider, {
  mode: "redirect",
  redirectUri: "https://your-app.com/auth/terminal-callback?screen=terminal",
});
```

`redirectUri` is just the return location after consent. It does not need a dedicated callback page with business logic.

## Fetch stats

```ts
const stats = await client.getStats();
console.log(stats.rank, stats.totalPoints);
```

## Disconnect

```ts
await client.disconnect();
```

## Redirect callback handling (web)

When using navigate-away redirect on web, run this once during app bootstrap:

```ts
const result = await client.handleRedirectCallback();
if (!result) {
  await client.restoreSession(provider);
}
```

The SDK only consumes OAuth params (`code`, `state`). Keep your callback URL stable and allowlisted exactly.

## Events

```ts
client.on("stateChange", (state) => {
  console.log(state);
});

client.on("error", (err) => {
  console.error(err.message);
});
```
