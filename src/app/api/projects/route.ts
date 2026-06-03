import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Publish (or update) a project to a public read-only share link.
// First publish generates { code, editKey }; updates must present a matching
// editKey (held only in the publisher's browser).
export async function POST(req: Request) {
  if (!rateLimit(`projects:${clientIp(req)}`, 10, 60_000)) {
    return NextResponse.json({ ok: false, error: 'Too many requests — try again shortly.' }, { status: 429 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 });
  }

  const name = String(body.name ?? '').trim() || 'Untitled Project';
  const client = body.client ? String(body.client).slice(0, 200) : null;
  const data = body.data;
  if (typeof data !== 'object' || data === null || !Array.isArray((data as { rooms?: unknown }).rooms)) {
    return NextResponse.json({ ok: false, error: 'Project data is invalid.' }, { status: 400 });
  }
  if (JSON.stringify(data).length > 200_000) {
    return NextResponse.json({ ok: false, error: 'Project is too large to publish.' }, { status: 413 });
  }

  const code = typeof body.code === 'string' && body.code ? body.code : null;
  const editKey = typeof body.editKey === 'string' && body.editKey ? body.editKey : null;

  try {
    if (code && editKey) {
      const existing = await prisma.sharedProject.findUnique({ where: { code } });
      if (existing) {
        if (existing.editKey !== editKey) {
          return NextResponse.json({ ok: false, error: 'Not authorized to update this link.' }, { status: 403 });
        }
        await prisma.sharedProject.update({
          where: { code },
          data: { name, client, data: data as object },
        });
        return NextResponse.json({ ok: true, code, editKey });
      }
    }

    const newCode = crypto.randomBytes(6).toString('base64url'); // ~8 chars
    const newEditKey = crypto.randomBytes(24).toString('base64url');
    await prisma.sharedProject.create({
      data: { code: newCode, editKey: newEditKey, name, client, data: data as object },
    });
    return NextResponse.json({ ok: true, code: newCode, editKey: newEditKey });
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Could not publish — is the database reachable?' },
      { status: 503 }
    );
  }
}
