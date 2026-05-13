import type { PlatformStorage } from "./adapter";

export interface StoredSession {
  accessToken: string;
  profileId: string;
  tokenExpiresAt: number;
  connectedAddress: string;
  // Missing refresh fields represent legacy sessions written before
  // refresh-token support; callers treat them as "no refresh available".
  refreshToken?: string;
  refreshTokenExpiresAt?: number;
}

interface WebLockManager {
  request<T>(
    name: string,
    options: { mode: "exclusive" },
    callback: () => Promise<T>
  ): Promise<T>;
}

export async function withSessionCoordination<T>(
  adapterName: string,
  storageKey: string,
  task: (coordinated: boolean) => Promise<T>
): Promise<T> {
  if (adapterName !== "web") {
    return task(false);
  }

  const lockName = `terminal-auth-sdk:${storageKey}:session`;
  const locks = getWebLocks();
  if (locks) {
    return locks.request(lockName, { mode: "exclusive" }, () => task(true));
  }

  return task(false);
}

export async function readStoredSession(
  storage: PlatformStorage,
  storageKey: string
): Promise<StoredSession | null> {
  try {
    const raw = await storage.getItem(storageKey);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    return isStoredSession(data) ? data : null;
  } catch {
    return null;
  }
}

function getWebLocks(): WebLockManager | null {
  if (typeof globalThis.navigator === "undefined") return null;
  const navigatorWithLocks = globalThis.navigator as Navigator & {
    locks?: WebLockManager;
  };
  return typeof navigatorWithLocks.locks?.request === "function"
    ? navigatorWithLocks.locks
    : null;
}

function isStoredSession(data: unknown): data is StoredSession {
  if (!data || typeof data !== "object") return false;
  const session = data as Partial<StoredSession>;
  return (
    typeof session.accessToken === "string" &&
    session.accessToken.length > 0 &&
    typeof session.profileId === "string" &&
    session.profileId.length > 0 &&
    typeof session.tokenExpiresAt === "number" &&
    typeof session.connectedAddress === "string" &&
    session.connectedAddress.length > 0 &&
    (session.refreshToken === undefined ||
      typeof session.refreshToken === "string") &&
    (session.refreshTokenExpiresAt === undefined ||
      typeof session.refreshTokenExpiresAt === "number")
  );
}
