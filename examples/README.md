# Examples

This directory contains integration examples for `@megaeth-labs/terminal-auth-sdk`.

## Overview

| Example | Framework | Wallet Provider | Auth Mode | Description |
| --- | --- | --- | --- | --- |
| [nextjs](./nextjs) | Next.js (Pages Router) | RainbowKit | Widget (popup default) | Full Next.js integration |
| [privy](./privy) | Next.js (App Router) | Privy | Widget (popup default) | Privy embedded wallet integration |
| [rainbowkit](./rainbowkit) | Vite + React | RainbowKit | Widget (popup default) | Minimal SPA setup |
| [rainbowkit-redirect](./rainbowkit-redirect) | Vite + React | RainbowKit | Redirect | Manual redirect flow with custom UI |
| [expo-rn](./expo-rn) | Expo (React Native) | Privy | Redirect (deep link) | Native mobile integration |

## Quick start

From repo root:

```bash
pnpm install
pnpm --filter <example-name> run <script>
```

Examples:

```bash
pnpm --filter rainbowkit run dev
pnpm --filter rainbowkit-redirect run dev
pnpm --filter nextjs run dev
pnpm --filter privy run dev
pnpm --filter example-expo-rn run ios
pnpm --filter example-expo-rn run android
```

## Environment variables

Each example includes an env template:

- Vite examples: `.env.example -> .env`
- Next.js examples: `.env.local.example -> .env.local`
- Expo example: `.env.example -> .env`

Common values:

- WalletConnect project id
- Privy app/client ids (Privy and Expo examples)
- Terminal client id

## Notes

- Web examples default to popup flow unless you call `connect(..., { mode: "redirect" })`.
- Expo example uses redirect flow through deep-link callback and requires a development build (`expo run:ios` / `expo run:android`).
