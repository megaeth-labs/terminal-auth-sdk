export type EventMap = Record<string, unknown>;

export class TypedEventEmitter<T extends EventMap> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private listeners = new Map<keyof T, Set<(payload: any) => void>>();

  on<K extends keyof T>(event: K, callback: (payload: T[K]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off<K extends keyof T>(event: K, callback: (payload: T[K]) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit<K extends keyof T>(event: K, payload: T[K]): void {
    this.listeners.get(event)?.forEach((cb) => cb(payload));
  }
}
