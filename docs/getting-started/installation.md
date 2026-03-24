# Installation

## Install the package

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

If you are using the React bindings, you need React 18 or 19:

```bash
pnpm add react react-dom
```

The framework-agnostic core (`@megaeth-labs/terminal-auth-sdk/core`) has no peer dependencies.

## Import paths

The package exposes two entry points:

| Import | Contents |
|---|---|
| `@megaeth-labs/terminal-auth-sdk` | Full SDK — core + React bindings |
| `@megaeth-labs/terminal-auth-sdk/core` | Framework-agnostic core only |
