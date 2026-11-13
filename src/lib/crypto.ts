/**
 * Cryptographically secure helpers for identifiers and tokens.
 * Math.random() must never be used for anything security-relevant.
 */

function randomHex(bytes: number): string {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return Array.from(data, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function randomId(prefix: string): string {
  return `${prefix}_${randomHex(12)}`;
}

export function secureToken(prefix: string, bytes = 16): string {
  return `${prefix}${randomHex(bytes)}`;
}

export function randomFingerprint(bytes = 16): string {
  return `SHA256:${Array.from(crypto.getRandomValues(new Uint8Array(bytes)))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join(':')}`;
}
