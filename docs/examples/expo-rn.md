# Expo (React Native) Example

This example demonstrates `@megaeth-labs/terminal-auth-sdk/react-native` in a real Expo app with Privy embedded wallets.

Source: [`examples/expo-rn/`](../../examples/expo-rn/)

## What it covers

- Expo `TerminalProvider` setup
- Privy email OTP login + embedded wallet
- Redirect auth flow via deep-link callback
- Session persistence using `expo-secure-store`

## Run

From repo root:

```bash
pnpm install
pnpm --filter example-expo-rn run ios
# or
pnpm --filter example-expo-rn run android
```

Use a development build (`expo run:*`), not Expo Go.

## Environment setup

```bash
cp examples/expo-rn/.env.example examples/expo-rn/.env
```

Set:

- `EXPO_PUBLIC_PRIVY_APP_ID`
- `EXPO_PUBLIC_PRIVY_CLIENT_ID`
- `EXPO_PUBLIC_TERMINAL_CLIENT_ID`

Optional overrides:

- `EXPO_PUBLIC_TERMINAL_API_URL`
- `EXPO_PUBLIC_TERMINAL_ORIGIN`

## Deep-link requirement

Ensure your app scheme in `app.json` matches the redirect URI allowlisted for your Terminal `clientId`.

See full walkthrough and troubleshooting in [`examples/expo-rn/README.md`](../../examples/expo-rn/README.md).
