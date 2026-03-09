import { useState } from "react";
import { TerminalClient } from "../core/client";
import type { ConnectionState } from "../core/types";

const client = new TerminalClient({
  clientId: import.meta.env.VITE_TERMINAL_CLIENT_ID,
  baseUrl: import.meta.env.VITE_TERMINAL_API_URL,
  terminalOrigin: import.meta.env.VITE_TERMINAL_ORIGIN,
});

export default function DemoApp() {
  const [state, setState] = useState<ConnectionState>("disconnected");
  const [error, setError] = useState<string | null>(null);

  useState(() => {
    client.on("stateChange", setState);
    client.on("error", (err) => setError(err.message));
  });

  return (
    <div>
      <h1>Terminal Auth SDK — Dev</h1>
      <p>State: <strong>{state}</strong></p>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      <p>
        <small>
          API: {import.meta.env.VITE_TERMINAL_API_URL} | Origin: {import.meta.env.VITE_TERMINAL_ORIGIN}
        </small>
      </p>
    </div>
  );
}
