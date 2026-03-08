const POPUP_TIMEOUT_MS = 120_000;
const POLL_INTERVAL_MS = 500;

export interface PopupOptions {
  url: string;
  expectedOrigin: string;
}

export function openPopupAndWaitForCode(options: PopupOptions): Promise<string> {
  const { url, expectedOrigin } = options;

  return new Promise<string>((resolve, reject) => {
    const popup = window.open(url, "terminal-auth", "width=500,height=600");

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
      if (event.origin !== expectedOrigin) return;

      const code = event.data?.code;
      if (typeof code !== "string") return;

      cleanup();
      popup.close();
      resolve(code);
    };

    const closedPoll = setInterval(() => {
      if (!settled && popup.closed) {
        cleanup();
        reject(new Error("User closed the popup"));
      }
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
