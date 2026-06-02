import { CalculationInput } from '@/types';

// Encode/decode a calculation into a URL-safe string so a configuration can be
// shared via a link (no server required).

function toBase64Url(str: string): string {
  const b64 = typeof window === 'undefined' ? Buffer.from(str).toString('base64') : btoa(unescape(encodeURIComponent(str)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(b64url: string): string {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const str = typeof window === 'undefined' ? Buffer.from(b64, 'base64').toString() : decodeURIComponent(escape(atob(b64)));
  return str;
}

export function encodeInput(input: CalculationInput): string {
  return toBase64Url(JSON.stringify(input));
}

export function decodeInput(encoded: string): CalculationInput | null {
  try {
    const parsed = JSON.parse(fromBase64Url(encoded));
    if (typeof parsed?.length === 'number' && typeof parsed?.width === 'number' && parsed?.roomType) {
      return parsed as CalculationInput;
    }
    return null;
  } catch {
    return null;
  }
}

export function buildShareUrl(input: CalculationInput): string {
  const base = typeof window !== 'undefined' ? `${window.location.origin}/calculator` : '/calculator';
  return `${base}?c=${encodeInput(input)}`;
}
