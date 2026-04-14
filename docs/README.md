# Terminal Auth SDK

`@megaeth-labs/terminal-auth-sdk` links EIP-1193 wallets to MegaETH Terminal profiles.

The SDK handles wallet signature challenge, PKCE, consent (popup or redirect), and token exchange.

**[Live demo](https://auth-sdk-demo-seven.vercel.app/)**

## What it does

When a user connects, the SDK:

1. Requests wallet access via EIP-1193
2. Requests a SIWE challenge from Terminal API
3. Generates PKCE verifier/challenge
4. Verifies signature
5. Completes consent via popup or redirect
6. Exchanges auth code for access token

## Platform support

- **Web**: popup (default) and redirect
- **React Native / Expo**: redirect via app deep link (`@megaeth-labs/terminal-auth-sdk/react-native`)

## Where to start

- [Installation](getting-started/installation.md)
- [Quick Start](getting-started/quick-start.md)
- [Authentication Types](guides/authentication-types.md)
- [Authentication Flow](guides/authentication-flow.md)
