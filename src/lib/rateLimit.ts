// Best-effort in-memory rate limiter. Per serverless instance, so it resets on
// cold starts and isn't shared across regions, defence-in-depth alongside the
// honeypot and validation, not a hard guarantee. For strict limits, front it
// with Upstash/Redis or the platform WAF.
const hits = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit = 8, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.reset) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}

export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}
