# Examples

This directory contains example projects demonstrating how to integrate `@megaeth-labs/terminal-auth-sdk` with different frameworks and wallet providers.

## Overview

| Example | Framework | Wallet Provider | Auth Mode | Description |
| --- | --- | --- | --- | --- |
| [nextjs](./nextjs) | Next.js (Pages Router) | RainbowKit | Widget (popup) | Full-featured Next.js integration with theme customization |
| [privy](./privy) | Next.js (App Router) | Privy | Widget (popup) | Privy embedded wallet integration |
| [rainbowkit](./rainbowkit) | Vite + React | RainbowKit | Widget (popup) | Minimal SPA setup |
| [rainbowkit-redirect](./rainbowkit-redirect) | Vite + React | RainbowKit | Redirect | Custom UI with redirect auth flow and stats display |

## Getting Started

Each example requires environment variables. Copy the `.env.example` (or `.env.local.example`) file in the example directory and fill in your values:

```bash
cd examples/<example-name>
cp .env.example .env        # or .env.local.example → .env.local for Next.js
npm install
npm run dev
```

### Required Environment Variables

- **WalletConnect Project ID** — Get one at [cloud.walletconnect.com](https://cloud.walletconnect.com)
- **Privy App ID** (privy example only) — Get one at [privy.io](https://www.privy.io)
- **Terminal Client ID** — Your Terminal SDK client ID

## Examples

### Next.js + RainbowKit

Demonstrates a full Next.js Pages Router integration. Shows how to wrap your app with `TerminalProvider`, extract the EIP-1193 provider from wagmi, and render `TerminalWidget` with multiple theme options (dark, light, accent).

```
examples/nextjs/
├── src/pages/_app.tsx        # Provider setup
├── src/pages/index.tsx       # Widget with theme variants
└── src/wagmi.ts              # Chain configuration
```

### Privy

Demonstrates using Privy as the wallet provider instead of RainbowKit. Privy supports embedded wallets for users who don't have a browser wallet installed. Shows how to coordinate login/logout between Privy and Terminal.

```
examples/privy/
├── src/components/providers.tsx        # Privy + Terminal provider composition
├── src/components/terminal-section.tsx # EIP-1193 provider extraction from Privy
└── src/app/page.tsx                    # Login/logout flow
```

### RainbowKit (Vite)

A minimal Vite + React SPA demonstrating the simplest possible integration. Good starting point if you're not using Next.js.

```
examples/rainbowkit/
├── src/main.tsx    # Provider setup
├── src/App.tsx     # Widget rendering with type-safe provider check
└── src/wagmi.ts    # Chain configuration
```

### RainbowKit Redirect

Demonstrates the redirect authentication flow as an alternative to popups. Uses `useTerminal()` to programmatically call `connect()` with `{ mode: "redirect" }`, display the connected address, and fetch user stats (rank and points).

```
examples/rainbowkit-redirect/
├── src/main.tsx    # Provider setup
├── src/App.tsx     # Custom UI with connect/disconnect, state handling, stats
└── src/wagmi.ts    # Chain configuration
```
