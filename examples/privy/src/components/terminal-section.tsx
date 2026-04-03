"use client";

import { useEffect, useState } from "react";
import {
  TerminalWidget,
  type EIP1193Provider,
} from "@megaeth-labs/terminal-auth-sdk";
import { useWallets } from "@privy-io/react-auth";

export function TerminalSection() {
  const { wallets } = useWallets();
  const [eip1193Provider, setEip1193Provider] = useState<
    EIP1193Provider | undefined
  >(undefined);

  useEffect(() => {
    let cancelled = false;
    const w = wallets[0];
    if (!w) {
      setEip1193Provider(undefined);
      return;
    }
    w.getEthereumProvider().then(
      (provider) => {
        if (!cancelled) setEip1193Provider(provider);
      },
      () => {
        if (!cancelled) setEip1193Provider(undefined);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [wallets]);

  return (
    <TerminalWidget
      provider={eip1193Provider}
      onError={(err) => console.error("Terminal error:", err)}
    />
  );
}
