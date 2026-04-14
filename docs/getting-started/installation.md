# Installation

## Choose a release channel

```bash
# stable
npm install @megaeth-labs/terminal-auth-sdk

# beta (use when you want newest features before stable promotion)
npm install @megaeth-labs/terminal-auth-sdk@beta
```

Equivalent commands:

```bash
pnpm add @megaeth-labs/terminal-auth-sdk
# or
pnpm add @megaeth-labs/terminal-auth-sdk@beta
```

```bash
yarn add @megaeth-labs/terminal-auth-sdk
# or
yarn add @megaeth-labs/terminal-auth-sdk@beta
```

## Peer dependencies

### Web React bindings

If you use `TerminalProvider`, `useTerminal`, or `TerminalWidget` on web:

```bash
pnpm add react react-dom
```

### React Native / Expo bindings

If you use `@megaeth-labs/terminal-auth-sdk/react-native`, install peer deps compatible with your Expo SDK:

```bash
pnpm add react react-native expo expo-web-browser expo-linking expo-crypto expo-secure-store @react-native-async-storage/async-storage
```

## Import paths

| Import | Contents |
|---|---|
| `@megaeth-labs/terminal-auth-sdk` | Web SDK (core + React web bindings) |
| `@megaeth-labs/terminal-auth-sdk/core` | Framework-agnostic core client |
| `@megaeth-labs/terminal-auth-sdk/react-native` | React Native / Expo bindings |
