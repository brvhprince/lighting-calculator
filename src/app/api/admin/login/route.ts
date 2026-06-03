import { NextResponse } from 'next/server';

// Validates the admin passcode server-side so it never ships in the client
// bundle. Set ADMIN_PASSCODE in your environment (e.g. Vercel project settings);
// falls back to a dev default if unset.
export async function POST(req: Request) {
  let passcode = '';
  try {
    const body = await req.json();
    passcode = typeof body?.passcode === 'string' ? body.passcode : '';
  } catch {
    /* ignore malformed body */
  }

  const expected = process.env.ADMIN_PASSCODE || 'penlabs';

  // Length-tolerant constant-ish comparison.
  const ok = passcode.length === expected.length && safeEqual(passcode, expected);

  if (ok) return NextResponse.json({ ok: true });
  return NextResponse.json({ ok: false }, { status: 401 });
}

function safeEqual(a: string, b: string): boolean {
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
