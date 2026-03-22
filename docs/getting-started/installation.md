# Installation

The SDK is published as a private package to GitHub Packages. You need a GitHub Personal Access Token with `read:packages` scope before installing.

## 1. Create a GitHub Personal Access Token

Go to [GitHub Settings → Personal access tokens](https://github.com/settings/tokens) and create a **classic token** with the `read:packages` scope.

## 2. Configure `.npmrc`

Create a `.npmrc` file in your project root:

```
@megaeth-labs:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

## 3. Set the environment variable

```bash
export GITHUB_TOKEN="ghp_your_token_here"
```

For persistent access, add this to your `~/.zshrc` or `~/.bashrc`. In CI environments, set it as a secret and expose it to your build process.

## 4. Install the package

```bash
pnpm add @megaeth-labs/terminal-auth-sdk
```

```bash
npm install @megaeth-labs/terminal-auth-sdk
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
