import crypto from 'crypto';

// Stateless HMAC session token for the admin area. Signed with AUTH_SECRET so it
// can be verified on write endpoints without a session store. Issued only after
// a correct passcode; held in sessionStorage on the client.
const SECRET = process.env.AUTH_SECRET || 'dev-secret-change-me';
const TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function hmac(data: string): string {
  return crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
}

export function createAdminToken(): string {
  const data = Buffer.from(JSON.stringify({ exp: Date.now() + TTL_MS })).toString('base64url');
  return `${data}.${hmac(data)}`;
}

export function verifyAdminToken(token?: string | null): boolean {
  if (!token) return false;
  const [data, sig] = token.split('.');
  if (!data || !sig) return false;
  const expected = hmac(data);
  if (sig.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(data, 'base64url').toString());
    return typeof exp === 'number' && Date.now() < exp;
  } catch {
    return false;
  }
}

export function bearerFromRequest(req: Request): string {
  const auth = req.headers.get('authorization') || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : '';
}
