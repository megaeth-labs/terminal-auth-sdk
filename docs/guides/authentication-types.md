# Authentication Types

The SDK supports two authentication flows for the consent step: **popup** and **redirect**. This page explains the differences and when to use each.

## Popup (current default)

The popup flow opens a small browser window for the user to approve linking their wallet to their Terminal profile. The parent app stays open in the background and receives the authorization code via `postMessage` when the user approves.

This is the current standard implementation and works well for most desktop web applications.

### How it works

1. The SDK opens a 500x600px popup window pointing to the Terminal consent page.
2. The user approves the wallet link in the popup.
3. The popup sends the authorization code back to the parent window via `postMessage` and closes itself.
4. The parent app continues without ever leaving the page.

### Advantages

- The app stays in memory — no page reload, no lost state.
- Works well for apps that maintain complex client-side state (game engines, media players, real-time connections).
- Faster perceived flow since the main app never navigates away.

## Redirect (coming soon)

The redirect flow navigates the user away from your app to the Terminal consent page, then redirects them back with the authorization code in the URL. This is the standard OAuth approach and is required in environments where popups are blocked.

> **Status**: The redirect flow is a work in progress and will be available in a future release.

### How it will work

1. The SDK redirects the browser to the Terminal consent page.
2. The user approves the wallet link.
3. Terminal redirects back to your app's callback URL with the authorization code.
4. The SDK picks up the code from the URL and completes the token exchange.

### Advantages

- Works in environments where popups are blocked (mobile browsers, PWAs, iframes).
- More predictable behavior across all platforms.
- Required for native mobile apps using a system browser with custom URL schemes.

## Best flow by use case

| Use case                        | Recommended flow              | Why                                                                                                                                                                                                                 |
| ------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Games, real-time apps           | Popup                         | Games maintain WebGL contexts, audio, and game state in memory. A full page redirect would destroy all of this and force a reload — potentially losing unsaved progress or disconnecting from multiplayer sessions. |
| Media apps (streaming, editors) | Popup                         | Active media streams, audio playback, and canvas state don't survive navigation.                                                                                                                                    |
| Desktop web (general)           | Popup (default)               | Better UX when the browser supports it. The app stays responsive throughout.                                                                                                                                        |
| Mobile web browsers             | Redirect                      | Popups are blocked or unreliable. Redirect is the only reliable option.                                                                                                                                             |
| PWAs (installed)                | Redirect                      | Popup behavior is inconsistent in standalone mode. Redirect is more predictable.                                                                                                                                    |
| Embedded / iframe contexts      | Redirect                      | Popups from iframes are almost always blocked by browsers.                                                                                                                                                          |
| Native mobile apps              | Redirect (via system browser) | Uses the same redirect infrastructure with a custom URL scheme. The OS routes the callback back to the app.                                                                                                         |

## Current status

| Flow     | Status      | Availability  |
| -------- | ----------- | ------------- |
| Popup    | Stable      | Available now |
| Redirect | In progress | Coming soon   |

Until the redirect flow is released, the popup flow is used for all `connect()` calls. If you are building for mobile or an environment where popups are blocked, the redirect flow will be required. Check back for updates.

## Mobile support

Native mobile SDKs are planned and will ship after the redirect flow is available:

- **React Native** — a wrapper package for React Native apps
- **Swift** — a native iOS SDK

Both will use the redirect flow with custom URL schemes to handle the OAuth callback. Until these are released, mobile apps can use the web SDK inside a WebView with the redirect flow.
