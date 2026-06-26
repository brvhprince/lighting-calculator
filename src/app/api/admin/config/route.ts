import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminToken, bearerFromRequest } from '@/lib/adminAuth';
import { validateMarkets, MarketOverrides } from '@/config/markets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KEY = 'markets';

// Public read: the whole app fetches this on load so everyone sees the saved
// pricing. Degrades to empty (= built-in defaults) if the DB is unreachable.
export async function GET() {
  try {
    const row = await prisma.setting.findUnique({ where: { key: KEY } });
    return NextResponse.json({ markets: (row?.value as MarketOverrides) ?? {} });
  } catch {
    return NextResponse.json({ markets: {}, unavailable: true });
  }
}

// Passcode-protected write (token issued by /api/admin/login).
export async function POST(req: Request) {
  if (!verifyAdminToken(bearerFromRequest(req))) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let markets: unknown;
  try {
    const body = await req.json();
    markets = body?.markets;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  // {} is allowed and means "use defaults" (reset).
  const err = validateMarkets(markets);
  if (err) return NextResponse.json({ ok: false, error: err }, { status: 400 });

  try {
    await prisma.setting.upsert({
      where: { key: KEY },
      update: { value: markets as object },
      create: { key: KEY, value: markets as object },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Database unavailable, is DATABASE_URL set and the schema pushed?' },
      { status: 503 }
    );
  }
}
