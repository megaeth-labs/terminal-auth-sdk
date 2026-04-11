export interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
}

function generateRandomString(length: number): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const max = Math.floor(256 / charset.length) * charset.length;
  let result = "";
  while (result.length < length) {
    const buf = crypto.getRandomValues(new Uint8Array(length));
    for (let i = 0; i < buf.length && result.length < length; i++) {
      if (buf[i] < max) result += charset[buf[i] % charset.length];
    }
  }
  return result;
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function generatePKCEPair(): Promise<PKCEPair> {
  const codeVerifier = generateRandomString(128);
  const encoded = new TextEncoder().encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  const codeChallenge = base64UrlEncode(digest);
  return { codeVerifier, codeChallenge };
}
