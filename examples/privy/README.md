# Terminal SDK + Privy Example

A [Next.js](https://nextjs.org/) App Router example demonstrating how to integrate `@megaeth-labs/terminal-auth-sdk` with [Privy](https://www.privy.io) as the wallet provider.

## Features

- Privy authentication with embedded wallets for users without a browser wallet
- EIP-1193 provider extraction from Privy's wallet API
- Coordinated login/logout between Privy and Terminal SDK
- `TerminalWidget` rendering after wallet connection

## Getting Started

1. Copy the environment file and fill in your values:

```bash
cp .env.local.example .env.local
```

2. Set your Privy App ID (get one at [dashboard.privy.io](https://dashboard.privy.io)):

```
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
```

3. Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Login/logout flow with Privy + Terminal
├── components/
│   ├── providers.tsx           # PrivyProvider + TerminalProvider composition
│   └── terminal-section.tsx    # EIP-1193 provider extraction and TerminalWidget
└── styles/
    └── Home.module.css
```

## How It Works

1. **`providers.tsx`** — Wraps the app with `PrivyProvider` (configured with embedded wallets) and `TerminalProvider`.
2. **`page.tsx`** — Uses Privy's `usePrivy()` for authentication and Terminal's `useTerminal()` to coordinate disconnect on logout.
3. **`terminal-section.tsx`** — Gets the first connected wallet from Privy via `useWallets()`, calls `getEthereumProvider()` to obtain an EIP-1193 provider, and passes it to `TerminalWidget`.

## Learn More

- [Terminal SDK Documentation](https://github.com/megaeth-labs/terminal-auth-sdk)
- [Privy Documentation](https://docs.privy.io)
- [Next.js Documentation](https://nextjs.org/docs)
