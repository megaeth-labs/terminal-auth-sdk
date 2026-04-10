import type { PlatformCrypto } from "./adapter";

export interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
}

const VERIFIER_CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

const BASE64URL_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

// Rejection sampling: only accept bytes below `max` so the modulo distribution
// across `VERIFIER_CHARSET` is uniform. Without this, characters whose index
// is < (256 % charset.length) would appear ~0.4% more often than others.
function generateRandomString(crypto: PlatformCrypto, length: number): string {
  const max =
    Math.floor(256 / VERIFIER_CHARSET.length) * VERIFIER_CHARSET.length;
  let result = "";
  while (result.length < length) {
    const buf = crypto.getRandomBytes(length);
    for (let i = 0; i < buf.length && result.length < length; i++) {
      if (buf[i] < max) {
        result += VERIFIER_CHARSET[buf[i] % VERIFIER_CHARSET.length];
      }
    }
  }
  return result;
}

/**
 * Unpadded base64url over a Uint8Array. Avoids `btoa`, which is not present
 * in React Native.
 */
function base64UrlEncode(bytes: Uint8Array): string {
  let result = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const c0 = b0 >> 2;
    const c1 = ((b0 & 0x03) << 4) | (b1 >> 4);
    const c2 = ((b1 & 0x0f) << 2) | (b2 >> 6);
    const c3 = b2 & 0x3f;
    result += BASE64URL_ALPHABET[c0];
    result += BASE64URL_ALPHABET[c1];
    if (i + 1 < bytes.length) result += BASE64URL_ALPHABET[c2];
    if (i + 2 < bytes.length) result += BASE64URL_ALPHABET[c3];
  }
  return result;
}

export async function generatePKCEPair(
  crypto: PlatformCrypto
): Promise<PKCEPair> {
  const codeVerifier = generateRandomString(crypto, 128);
  const encoded = new TextEncoder().encode(codeVerifier);
  const digest = await crypto.sha256(encoded);
  const codeChallenge = base64UrlEncode(digest);
  return { codeVerifier, codeChallenge };
}
