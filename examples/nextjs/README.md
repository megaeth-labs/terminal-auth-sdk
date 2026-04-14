# Terminal SDK + Next.js (RainbowKit) Example

A Next.js Pages Router example that integrates `@megaeth-labs/terminal-auth-sdk` with Wagmi + RainbowKit.

## What this example covers

- Provider composition in `_app.tsx` (Wagmi -> QueryClient -> RainbowKit -> TerminalProvider)
- Manual Terminal connect button using `useTerminal()`
- EIP-1193 provider extraction from Wagmi connector
- Session persistence + restore behavior

## Setup

From repo root:

```bash
cp examples/nextjs/.env.local.example examples/nextjs/.env.local
pnpm install
pnpm --filter nextjs run dev
```

Open <http://localhost:3000>.

## Required env vars

- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `NEXT_PUBLIC_TERMINAL_CLIENT_ID` (optional, defaults to `1` in this example)

Optional overrides:

- `NEXT_PUBLIC_TERMINAL_API_URL`
- `NEXT_PUBLIC_TERMINAL_ORIGIN`

## Auth mode

This example uses the web default flow (popup). To test redirect mode, call:

```ts
await connect(provider, { mode: "redirect" });
```

in `src/pages/index.tsx`.

## Related docs

- [Docs example walkthrough](../../docs/examples/nextjs.md)
- [Authentication types](../../docs/guides/authentication-types.md)
