const POPUP_TIMEOUT_MS = 120_000;
const POLL_INTERVAL_MS = 500;

export interface PopupOptions {
  url: string;
  expectedOrigin: string;
}

function parseOrigin(value: string, label: string): string {
  try {
    return new URL(value).origin;
  } catch {
    throw new Error(`Invalid ${label}: ${value}`);
  }
}

export function openPopupAndWaitForCode(options: PopupOptions): Promise<string> {
  const { url, expectedOrigin } = options;
  const normalizedExpectedOrigin = parseOrigin(expectedOrigin, "expected origin");
  const popupOrigin = parseOrigin(url, "popup URL");

  if (popupOrigin !== normalizedExpectedOrigin) {
    return Promise.reject(
      new Error(
        `Popup URL origin mismatch: expected ${normalizedExpectedOrigin}, got ${popupOrigin}`
      )
    );
  }

  return new Promise<string>((resolve, reject) => {
    const popup = window.open(url, "terminal-auth", "width=720,height=800");

    if (!popup) {
      reject(new Error("Popup blocked by browser"));
      return;
    }

    let settled = false;

    const cleanup = () => {
      settled = true;
      window.removeEventListener("message", onMessage);
      clearInterval(closedPoll);
      clearTimeout(timeout);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== normalizedExpectedOrigin) return;

      const code = event.data?.code;
      if (typeof code !== "string" || code.length === 0) return;

      cleanup();
      try {
        popup.close();
      } catch {
        // COOP can sever the WindowProxy; the popup closes itself anyway.
      }
      resolve(code);
    };

    const closedPoll = setInterval(() => {
      if (settled || !popup.closed) return;
      clearInterval(closedPoll);
      // Grace period: a successful flow does postMessage(code) then window.close(),
      // so popup.closed can flip true before the queued message event runs. Wait
      // briefly to let onMessage win the race before reporting a user-cancel.
      setTimeout(() => {
        if (settled) return;
        cleanup();
        reject(new Error("User closed the popup"));
      }, 300);
    }, POLL_INTERVAL_MS);

    const timeout = setTimeout(() => {
      if (!settled) {
        cleanup();
        popup.close();
        reject(new Error("Popup timed out after 2 minutes"));
      }
    }, POPUP_TIMEOUT_MS);

    window.addEventListener("message", onMessage);
  });
}
