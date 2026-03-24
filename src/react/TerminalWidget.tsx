import { useEffect, useState, type CSSProperties } from "react";
import type { EIP1193Provider, Stats } from "../core/types";
import { useTerminal } from "./useTerminal";

export type TerminalWidgetTheme = "dark" | "light" | "accent";

interface TerminalWidgetProps {
  provider?: EIP1193Provider;
  onError?: (error: Error) => void;
  theme?: TerminalWidgetTheme;
}

const themeTokens: Record<
  TerminalWidgetTheme,
  {
    containerBg: string;
    containerBorder: string;
    logoFill: string;
    textColor: string;
    rankColor: string;
    pointsColor: string;
    dividerColor: string;
  }
> = {
  dark: {
    containerBg: "#19191a",
    containerBorder: "0.5px solid #313131",
    logoFill: "white",
    textColor: "white",
    rankColor: "#dfd9d9",
    pointsColor: "#26de96",
    dividerColor: "#313131",
  },
  light: {
    containerBg: "#ece8e8",
    containerBorder: "0.5px solid #bebebe",
    logoFill: "#19191a",
    textColor: "#19191a",
    rankColor: "#19191a",
    pointsColor: "#ff4bc9",
    dividerColor: "#bebebe",
  },
  accent: {
    containerBg: "#26de96",
    containerBorder: "none",
    logoFill: "#19191a",
    textColor: "#19191a",
    rankColor: "#19191a",
    pointsColor: "white",
    dividerColor: "rgba(25, 25, 26, 0.2)",
  },
};

function TerminalLogo({ size = 32, color = "white" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 47 47"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M23.5056 3.73674C34.3808 3.73674 43.2676 12.5942 43.2676 23.5C43.2676 34.4058 34.4141 43.2632 23.5056 43.2632C12.597 43.2632 3.74355 34.4058 3.74355 23.5C3.74355 12.5942 12.597 3.73674 23.5056 3.73674ZM23.5056 0C10.5198 0 0 10.5183 0 23.5C0 36.4817 10.5198 47 23.5056 47C36.4802 47 47 36.4817 47 23.5C47 10.5183 36.4802 0 23.5056 0Z"
        fill={color}
      />
      <path
        d="M13.0429 9.43555H19.2415C20.4079 12.591 23.4516 21.5316 23.6738 22.0297C23.7293 21.7807 26.7952 12.0375 27.6617 9.49092H34.1046V31.7176C33.3048 31.2747 32.5049 30.8319 31.6385 30.3336C31.0386 30.0292 30.4832 29.697 29.8722 29.4479C29.8167 25.1299 29.7612 20.8395 29.6279 16.3555C28.7614 18.9297 25.7732 28.0086 25.5288 28.2577H21.5409C21.5409 28.2577 17.664 17.2412 17.4751 16.743C17.4196 20.9779 17.3641 25.2129 17.2197 29.5863C14.8424 30.8042 13.4317 31.4962 12.9874 31.6622V9.43555H13.0429Z"
        fill={color}
      />
      <path
        d="M28.0896 36.5404C29.5331 36.5404 30.6989 35.3755 30.6989 33.9385C30.6989 32.5016 29.5331 31.3367 28.0896 31.3367C26.6574 31.3367 25.4916 32.5016 25.4916 33.9385C25.4916 35.3755 26.6574 36.5404 28.0896 36.5404Z"
        fill={color}
      />
      <path
        d="M18.7381 36.6178C20.1815 36.6178 21.3363 35.4529 21.3363 34.0159C21.3363 32.5789 20.1815 31.4141 18.7381 31.4141C17.3058 31.4141 16.14 32.5789 16.14 34.0159C16.14 35.4529 17.3058 36.6178 18.7381 36.6178Z"
        fill={color}
      />
    </svg>
  );
}

function ArrowIcon({ color = "white" }: { color?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 12L12 4M12 4H5.33M12 4V10.67"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatPoints(points: number): string {
  return points.toLocaleString("en-US");
}

const baseStyles = {
  container: {
    display: "inline-flex",
    alignItems: "center",
    gap: "20px",
    borderRadius: "12px",
    padding: "14px 20px",
    fontFamily:
      '"Helvetica Neue", Helvetica, Arial, sans-serif',
    cursor: "pointer",
    textDecoration: "none",
    transition: "background-color 0.15s ease",
    minWidth: "200px",
    maxWidth: "500px",
  } satisfies CSSProperties,
  button: {
    display: "inline-flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 16px",
    fontFamily:
      '"Helvetica Neue", Helvetica, Arial, sans-serif',
    border: "none",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: 500,
    transition: "background-color 0.15s ease",
    minWidth: "200px",
    maxWidth: "500px",
  } satisfies CSSProperties,
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  } satisfies CSSProperties,
  label: {
    flex: 1,
    fontSize: "15px",
    fontWeight: 500,
    whiteSpace: "nowrap",
  } satisfies CSSProperties,
  info: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    gap: "1px",
  } satisfies CSSProperties,
  address: {
    fontSize: "22px",
    fontWeight: 400,
    lineHeight: 1.3,
  } satisfies CSSProperties,
  rank: {
    fontSize: "18px",
    fontWeight: 300,
    lineHeight: 1.3,
    opacity: 0.8,
  } satisfies CSSProperties,
  divider: {
    width: "0.5px",
    alignSelf: "stretch",
    margin: "-14px 0",
  } satisfies CSSProperties,
  points: {
    fontSize: "24px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  } satisfies CSSProperties,
} as const;

export function TerminalWidget({ provider, onError, theme = "dark" }: TerminalWidgetProps) {
  const { state, address, connect, getStats } = useTerminal();
  const [stats, setStats] = useState<Stats | null>(null);
  const tokens = themeTokens[theme];

  useEffect(() => {
    if (state !== "connected") return;
    let cancelled = false;
    getStats()
      .then((s) => {
        if (!cancelled) setStats(s);
      })
      .catch((err) => {
        if (!cancelled)
          onError?.(err instanceof Error ? err : new Error(String(err)));
      });
    return () => {
      cancelled = true;
    };
  }, [state, getStats, onError]);

  const handleConnect = async () => {
    if (!provider) return;
    try {
      await connect(provider);
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  };

  if (state === "connected" && address) {
    return (
      <div style={{
        ...baseStyles.container,
        backgroundColor: tokens.containerBg,
        border: tokens.containerBorder,
      }}>
        <TerminalLogo size={47} color={tokens.logoFill} />
        <div style={baseStyles.info}>
          <span style={{ ...baseStyles.address, color: tokens.textColor }}>
            {truncateAddress(address)}
          </span>
          {stats && (
            <span style={{ ...baseStyles.rank, color: tokens.rankColor }}>
              Rank {stats.rank}
            </span>
          )}
        </div>
        {stats && (
          <>
            <div style={{ ...baseStyles.divider, backgroundColor: tokens.dividerColor }} />
            <span style={{ ...baseStyles.points, color: tokens.pointsColor }}>
              {formatPoints(stats.totalPoints)} PT
            </span>
          </>
        )}
      </div>
    );
  }

  const disabled = !provider || state === "connecting";

  return (
    <button
      type="button"
      onClick={handleConnect}
      disabled={disabled}
      style={{
        ...baseStyles.button,
        backgroundColor: tokens.containerBg,
        color: tokens.textColor,
        ...(disabled ? baseStyles.buttonDisabled : {}),
      }}
    >
      <TerminalLogo size={32} color={tokens.logoFill} />
      <span style={{ ...baseStyles.label, color: tokens.textColor }}>
        {state === "connecting" ? "Connecting..." : "Connect To Terminal"}
      </span>
      <ArrowIcon color={tokens.textColor} />
    </button>
  );
}
