# Terminal Auth SDK — Expo example

End-to-end reference implementation of [`@megaeth-labs/terminal-auth-sdk`](../..) on React Native via Expo. Uses [Privy](https://www.privy.io/) for embedded wallet creation + email OTP login, then connects to the Terminal backend using the SDK's React Native binding (`@megaeth-labs/terminal-auth-sdk/react-native`).

## What this demonstrates

- The `TerminalProvider` from `@megaeth-labs/terminal-auth-sdk/react-native` wiring into a real Expo app
- Extracting an EIP-1193 provider from a Privy embedded wallet and handing it to `useTerminal().connect()`
- The redirect flow end-to-end: in-app browser → Terminal consent page → deep link callback → token exchange → session stored in `expo-secure-store`
- Session restore on app relaunch

## Development build required (Expo Go is NOT supported)

`WebBrowser.openAuthSessionAsync` + deep links do not round-trip reliably inside Expo Go — see [expo/expo#34187](https://github.com/expo/expo/issues/34187). You **must** run this example as a development build via `expo run:ios` or `expo run:android`. This requires Xcode (for iOS) or Android Studio (for Android) installed locally.

## Prerequisites

- Node 20+
- pnpm 10+
- Xcode 16+ (macOS, for iOS)
- Android Studio + an emulator (for Android)
- A Privy account with an app created at [dashboard.privy.io](https://dashboard.privy.io)
- Backend team has allowlisted `auth-sdk-expo-example://terminal-auth` as a redirect URI for the `clientId` set in `.env`

## Setup

1. From the monorepo root, install dependencies:

   ```bash
   pnpm install
   ```

2. Copy the env template and fill in your Privy credentials:

   ```bash
   cp examples/expo-rn/.env.example examples/expo-rn/.env
   ```

   Edit `examples/expo-rn/.env`:
   - `EXPO_PUBLIC_PRIVY_APP_ID` — from the Privy dashboard (App settings)
   - `EXPO_PUBLIC_PRIVY_CLIENT_ID` — from the Privy dashboard (Clients section, starts with `client-`)
   - `EXPO_PUBLIC_TERMINAL_CLIENT_ID` — the Terminal client ID the backend team has allowlisted for `auth-sdk-expo-example://terminal-auth`

3. In your Privy dashboard, add this example's app identifier + URL scheme to the allowlist for your app. The values are:
   - App identifier: `com.megaethlabs.terminalauthsdk.example`
   - URL scheme: `auth-sdk-expo-example`

## Run

From the monorepo root:

```bash
# iOS (requires Xcode)
pnpm --filter example-expo-rn run ios

# Android (requires Android Studio + an emulator running)
pnpm --filter example-expo-rn run android
```

The first build takes 5–15 minutes because it compiles the native side of the app. Subsequent runs are near-instant thanks to Metro + hot reload.

## Expected flow

1. App launches, shows "Sign in with Privy" screen
2. Enter email → tap "Send code" → check your email for the OTP
3. Enter the code → tap "Verify" → Privy creates an embedded wallet
4. Screen transitions to "Connect to Terminal", showing the Privy user ID
5. Tap "Connect to Terminal" → an in-app browser opens the staging consent page
6. Approve on the consent page → the browser closes, `state` flips to `connected`, the wallet address appears
7. `getStats()` fires automatically; rank + points appear
8. Force-quit the app and reopen — the session restores from `expo-secure-store` and you land directly on the connected view

## Troubleshooting

- **`"SecureStore is not available on this platform"`** — you're running in Expo Go or a web build. Use `expo run:ios` / `run:android`.
- **`"Terminal auth session did not complete (type=cancel)"`** — you closed the in-app browser before approving. Try again.
- **`"state mismatch"` or `"callback URL mismatch"`** — the redirect URI coming back from the backend doesn't match the example's scheme. Confirm with the backend team that `auth-sdk-expo-example://terminal-auth` is on the allowlist for your `clientId`.
- **`"Missing Privy credentials"`** — `.env` isn't being read. Confirm the file exists at `examples/expo-rn/.env` and has both `EXPO_PUBLIC_PRIVY_APP_ID` and `EXPO_PUBLIC_PRIVY_CLIENT_ID` set.
- **Privy login errors about app identifier** — register `com.megaethlabs.terminalauthsdk.example` as an allowed app identifier in your Privy dashboard.

## How it differs from the web examples

Unlike [`examples/rainbowkit-redirect`](../rainbowkit-redirect) (which imports from `@megaeth-labs/terminal-auth-sdk`), this example imports from `@megaeth-labs/terminal-auth-sdk/react-native`. The subpath is intentional — importing the default entry on React Native would pull in the web adapter and crash on `window is not defined` at module load.

The `connect()` call does not pass a `mode` option. The Expo adapter declares `supportedModes: ["redirect"]`, so the SDK picks redirect automatically. If you explicitly pass `mode: "popup"`, the SDK throws a descriptive error before any native code runs.
