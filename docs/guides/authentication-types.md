# Authentication Types

The SDK supports two consent flows: **popup** and **redirect**.

Both use the same SIWE + PKCE backend flow. The only difference is how the user completes consent.

## Popup

Popup opens Terminal consent in a separate window while your app stays on the current page.

### How it works

1. SDK opens consent window.
2. User approves wallet link.
3. Popup posts the auth code to the opener and closes.
4. SDK exchanges the code for a token.

### Best for

- Desktop web apps with rich in-memory UI (games, media editors, dashboards)
- Flows where you want to avoid full-page navigation

## Redirect

Redirect navigates the user to Terminal consent and returns to your callback URL (web) or deep link (native).

### How it works

1. SDK prepares PKCE + state and requests `authorizeUrl`.
2. App navigates to Terminal consent page.
3. User approves wallet link.
4. Terminal redirects back with `code` + `state`.
5. SDK validates state and exchanges code for token.

### Best for

- Mobile web / PWA contexts where popups are unreliable
- Embedded/iframe contexts with popup restrictions
- React Native / Expo apps (deep-link callback)

## Which one should I use?

| Use case | Recommended flow | Why |
| --- | --- | --- |
| Desktop web app | Popup (default) | Keeps app state in memory; no page navigation |
| Mobile browser / PWA | Redirect | Popup support is inconsistent |
| Embedded iframe | Redirect | Popup is commonly blocked |
| React Native / Expo | Redirect | Native auth session + deep-link callback |

## Code examples

### Popup (web default)

```ts
await connect(provider);
```

### Redirect (web)

```ts
await connect(provider, { mode: "redirect" });
```

### Redirect with explicit callback URL (web)

```ts
await connect(provider, {
  mode: "redirect",
  redirectUri: "https://your-app.com/auth/terminal-callback",
});
```

### Redirect with UI route state (web)

```ts
await connect(provider, {
  mode: "redirect",
  redirectUri: "https://your-app.com/auth/terminal-callback?tab=stats",
});
```

The callback URL does not need to run special logic. It is just where the user lands after consent.

Make sure the same `redirectUri` (including path/query if used) is allowlisted for your `clientId`. Fragment (`#...`) values are not accepted by backend redirect URI validation.

### Redirect (Expo)

Use `@megaeth-labs/terminal-auth-sdk/react-native` and configure your app scheme/deep link.

## Release channel note

Feature availability depends on the version/channel you install (`latest` vs `@beta`). If you need newest redirect/mobile updates before stable promotion, install `@beta`.
