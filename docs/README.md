# Terminal Auth SDK

`@megaeth-labs/terminal-auth-sdk` is a TypeScript SDK for linking Web3 wallets to MegaETH Terminal user profiles. It handles the full authentication flow: wallet signature challenge, PKCE, consent popup, and token exchange.

> **Beta**: This library is in beta. The API may change between releases. Mobile app support is not yet available and will be included in the next release, along with an alternative to the popup-based consent flow.

## What it does

When a user connects, the SDK:

1. Requests their wallet address via an EIP-1193 provider
2. Requests a signed challenge (EIP-712 typed data) from the Terminal API
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
