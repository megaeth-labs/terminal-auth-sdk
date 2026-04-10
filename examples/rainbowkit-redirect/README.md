# Terminal SDK + RainbowKit (Redirect) Example

A [Vite](https://vite.dev/) + [React](https://react.dev/) example demonstrating how to integrate `@megaeth-labs/terminal-auth-sdk` with [RainbowKit](https://rainbowkit.com/) using the **redirect** authentication flow.

## Features

- RainbowKit wallet connection with EIP-1193 provider extraction
- Redirect mode authentication via `connect(provider, { mode: "redirect" })`
- Terminal user stats display (rank, points) after connection
- Coordinated connect/disconnect between RainbowKit and Terminal SDK

## Getting Started

1. Copy the environment file and fill in your values:

```bash
cp .env.example .env
```

2. Set your WalletConnect Project ID (get one at [cloud.walletconnect.com](https://cloud.walletconnect.com)):

```
VITE_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
```

3. Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
src/
├── main.tsx    # Provider composition (Wagmi → Query → RainbowKit → Terminal)
├── App.tsx     # Redirect flow connect/disconnect logic and stats display
└── wagmi.ts    # RainbowKit + wagmi chain configuration
```

## How It Works

1. **`main.tsx`** — Wraps the app with `WagmiProvider`, `QueryClientProvider`, `RainbowKitProvider`, and `TerminalProvider` configured via environment variables.
2. **`App.tsx`** — Extracts an EIP-1193 provider from the RainbowKit connector, then calls `connect(provider, { mode: "redirect" })` to authenticate via the redirect flow. Once connected, fetches and displays the user's Terminal stats.
3. **`wagmi.ts`** — Configures RainbowKit with a WalletConnect project ID and supported chains (mainnet, sepolia).

## Learn More

- [Terminal SDK Documentation](https://github.com/megaeth-labs/terminal-auth-sdk)
- [RainbowKit Documentation](https://rainbowkit.com) - Learn how to customize your wallet connection flow.
- [wagmi Documentation](https://wagmi.sh) - Learn how to interact with Ethereum.
- [Vite Documentation](https://vite.dev/guide/) - Learn how to build with Vite.
