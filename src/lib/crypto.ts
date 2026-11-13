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

/** Uniformly distributed 6-digit code for demo-only verification screens. */
export function secureSixDigitCode(): string {
  const range = 900000;
  const limit = Math.floor(0x100000000 / range) * range;
  const buffer = new Uint32Array(1);

  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);

  return (100000 + (buffer[0] % range)).toString();
}

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** Random base32 string, used for demo-only TOTP secrets. */
export function secureBase32(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => BASE32_ALPHABET[byte % BASE32_ALPHABET.length]).join('');
}
