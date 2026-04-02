# Terminal Auth SDK

`@megaeth-labs/terminal-auth-sdk` is a TypeScript SDK for linking Web3 wallets to MegaETH Terminal user profiles. It handles the full authentication flow: wallet signature challenge, PKCE, consent popup, and token exchange.

**[Live demo](https://auth-sdk-demo-seven.vercel.app/)**

> **Beta**: This library is in beta. The API may change between releases. The current authentication uses a popup-based consent flow. A redirect-based flow for mobile browsers, PWAs, and embedded contexts is coming soon. See [Authentication Types](guides/authentication-types.md) for details.

## What it does

When a user connects, the SDK:

1. Requests their wallet address via an EIP-1193 provider
2. Requests a SIWE message from the Terminal API for the wallet to sign
3. Runs a PKCE-secured authorization flow
4. Opens a consent popup for first-time wallet linking
5. Exchanges the authorization code for an access token

The resulting access token can be used to read the user's Terminal profile and stats.

## What's included

- Framework-agnostic core (`TerminalClient`) — works with any EIP-1193 provider
- React bindings — `TerminalProvider`, `useTerminal` hook, and `TerminalWidget` drop-in component
- Full TypeScript types

## Where to start

- [Installation](getting-started/installation.md) — set up your environment and install the package
- [Quick Start](getting-started/quick-start.md) — connect a wallet in a few lines of code
- [Authentication Flow](guides/authentication-flow.md) — understand how the auth flow works end to end
