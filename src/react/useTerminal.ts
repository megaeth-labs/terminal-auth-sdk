"use client";

import { useContext } from "react";
import { TerminalContext, type TerminalContextValue } from "./context";

export function useTerminal(): TerminalContextValue {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error("useTerminal must be used within a <TerminalProvider>");
  }
  return context;
}
