/**
 * Minimal ambient type declarations for the optional Expo peer dependencies
 * used by the React Native adapter.
 *
 * These modules are declared as optional peer dependencies in package.json
 * and are not installed in this SDK's own node_modules. Rather than pulling
 * them in as devDependencies, we declare only the narrow API surface the
 * adapter actually uses. This keeps `tsc -b` green for the SDK build while
 * the real types resolve against the consumer's installed versions at
 * their own build time (Metro / tsc in their app).
 *
 * If the upstream APIs change, the adapter will fail to build in the
 * consumer's project with a real type error, not here. Keep these
 * declarations narrow — only add what the adapter actually calls.
 */

declare module "expo-crypto" {
  export enum CryptoDigestAlgorithm {
    SHA256 = "SHA-256",
  }
  export function getRandomBytes(byteCount: number): Uint8Array;
  export function getRandomBytesAsync(byteCount: number): Promise<Uint8Array>;
  export function digest(
    algorithm: CryptoDigestAlgorithm,
    data: Uint8Array
  ): Promise<ArrayBuffer>;
}

declare module "expo-web-browser" {
  export type WebBrowserAuthSessionResult =
    | { type: "success"; url: string }
    | { type: "cancel" }
    | { type: "dismiss" }
    | { type: "opened" }
    | { type: "locked" };
  export function openAuthSessionAsync(
    url: string,
    redirectUrl?: string | null
  ): Promise<WebBrowserAuthSessionResult>;
}

declare module "expo-linking" {
  export function createURL(
    path: string,
    namedParameters?: { scheme?: string; queryParams?: Record<string, string> }
  ): string;
  export function openURL(url: string): Promise<true>;
}

declare module "expo-secure-store" {
  export interface SecureStoreOptions {
    keychainService?: string;
    requireAuthentication?: boolean;
  }
  export function isAvailableAsync(): Promise<boolean>;
  export function getItemAsync(
    key: string,
    options?: SecureStoreOptions
  ): Promise<string | null>;
  export function setItemAsync(
    key: string,
    value: string,
    options?: SecureStoreOptions
  ): Promise<void>;
  export function deleteItemAsync(
    key: string,
    options?: SecureStoreOptions
  ): Promise<void>;
}

declare module "@react-native-async-storage/async-storage" {
  interface AsyncStorageStatic {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }
  const AsyncStorage: AsyncStorageStatic;
  export default AsyncStorage;
}
