# Installation

```bash
npm install @megaeth-labs/terminal-auth-sdk
```

```bash
pnpm add @megaeth-labs/terminal-auth-sdk
```

```bash
yarn add @megaeth-labs/terminal-auth-sdk
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
