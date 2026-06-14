import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminToken, bearerFromRequest } from '@/lib/adminAuth';
import { validateFixtures } from '@/lib/fixtureCatalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KEY = 'fixtures';

// Public read: the whole app fetches the effective fixture catalogue on load.
// Degrades to empty (= built-in defaults) if the DB is unreachable.
export async function GET() {
  try {
    const row = await prisma.setting.findUnique({ where: { key: KEY } });
    return NextResponse.json({ fixtures: row?.value ?? { items: [] } });
  } catch {
    return NextResponse.json({ fixtures: { items: [] }, unavailable: true });
  }
}

// Passcode-protected write (token issued by /api/admin/login).
export async function POST(req: Request) {
  if (!verifyAdminToken(bearerFromRequest(req))) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let fixtures: unknown;
  try {
    const body = await req.json();
    fixtures = body?.fixtures;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  // { items: [] } is allowed and means "use built-in defaults" (reset).
  const err = validateFixtures(fixtures);
  if (err) return NextResponse.json({ ok: false, error: err }, { status: 400 });

  try {
    await prisma.setting.upsert({
      where: { key: KEY },
      update: { value: fixtures as object },
      create: { key: KEY, value: fixtures as object },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Database unavailable — is DATABASE_URL set and the schema pushed?' },
      { status: 503 }
    );
  }
}
