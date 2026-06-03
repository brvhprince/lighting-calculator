import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminToken, bearerFromRequest } from '@/lib/adminAuth';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { sendLeadEmails } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public: submit a quote request.
export async function POST(req: Request) {
  if (!rateLimit(`leads:${clientIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ ok: false, error: 'Too many requests — try again shortly.' }, { status: 429 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 });
  }

  // Honeypot — bots fill hidden fields; pretend success without storing.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return NextResponse.json({ ok: true });
  }

  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim();
  if (!name || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: 'A name and valid email are required.' }, { status: 400 });
  }

  const spec = (body.data as Record<string, unknown>) ?? null;

  try {
    await prisma.lead.create({
      data: {
        name: name.slice(0, 200),
        email: email.slice(0, 200),
        phone: body.phone ? String(body.phone).slice(0, 60) : null,
        message: body.message ? String(body.message).slice(0, 2000) : null,
        roomName: body.roomName ? String(body.roomName).slice(0, 200) : null,
        source: body.source ? String(body.source).slice(0, 40) : null,
        data: spec ? (spec as object) : undefined,
      },
    });

    // Fire off emails (no-op if RESEND_API_KEY unset; never fails the request).
    const pdfBase64 =
      typeof body.pdfBase64 === 'string' && body.pdfBase64.length < 3_000_000
        ? body.pdfBase64
        : undefined;
    await sendLeadEmails({
      name,
      email,
      phone: body.phone ? String(body.phone) : null,
      message: body.message ? String(body.message) : null,
      roomName: body.roomName ? String(body.roomName) : null,
      source: body.source ? String(body.source) : null,
      spec,
      pdfBase64,
      pdfFilename: pdfBase64 ? 'penlabs-lighting-report.pdf' : undefined,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Could not submit right now — please try again.' },
      { status: 503 }
    );
  }
}

// Admin: list recent leads (passcode token required).
export async function GET(req: Request) {
  if (!verifyAdminToken(bearerFromRequest(req))) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
    return NextResponse.json({ leads });
  } catch {
    return NextResponse.json({ leads: [], unavailable: true });
  }
}
