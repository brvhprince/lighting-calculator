import { Resend } from 'resend';
import { SITE_URL } from '@/lib/site';

// Resend is optional, if RESEND_API_KEY isn't set, email is skipped silently
// (the lead is still stored). Set a verified sender in LEAD_FROM_EMAIL and an
// internal recipient in LEAD_NOTIFY_EMAIL.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.LEAD_FROM_EMAIL || 'Pen Homes <hello@pen.homes>';
const NOTIFY_TO = process.env.LEAD_NOTIFY_EMAIL || '';
const REPLY_TO = process.env.LEAD_REPLY_TO || 'hello@pen.homes';
// Optional booking link (e.g. a Cal.com URL); shown as a CTA when set.
const CONSULT_URL = process.env.LEAD_CONSULT_URL || '';
const PENCASA_URL = process.env.NEXT_PUBLIC_PENCASA_URL || '';

// UTM-tag an app link so web analytics attributes email clicks. Resend's click
// tracking (links.pen.homes) wraps these automatically when enabled in the
// Resend dashboard for the sending domain.
function tagged(url: string, campaign = 'quote-email'): string {
  try {
    const u = new URL(url, SITE_URL);
    u.searchParams.set('utm_source', 'pen-homes');
    u.searchParams.set('utm_medium', 'email');
    u.searchParams.set('utm_campaign', campaign);
    return u.toString();
  } catch {
    return url;
  }
}

function button(href: string, label: string, primary = true): string {
  const bg = primary ? '#A68966' : 'transparent';
  const color = primary ? '#F5F2ED' : '#2C332E';
  const border = primary ? '#A68966' : '#DAD5CC';
  return `<a href="${href}" style="display:inline-block;background:${bg};color:${color};border:1px solid ${border};text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:bold;font-size:14px;margin:4px 8px 4px 0">${label}</a>`;
}

export type LeadEmailInput = {
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  roomName?: string | null;
  source?: string | null;
  spec?: Record<string, unknown> | null;
  pdfBase64?: string;
  pdfFilename?: string;
};

const shell = (inner: string) => `
  <div style="font-family:Helvetica,Arial,sans-serif;color:#2C332E;max-width:560px;margin:0 auto">
    <div style="background:#2C332E;color:#F5F2ED;padding:20px 24px;border-radius:10px 10px 0 0">
      <div style="font-size:18px;font-family:Georgia,serif">Penlabs Lighting</div>
      <div style="font-size:10px;letter-spacing:2px;color:#8A9682;text-transform:uppercase">by Pen Homes</div>
    </div>
    <div style="border:1px solid #DAD5CC;border-top:none;border-radius:0 0 10px 10px;padding:24px">
      ${inner}
      <p style="font-size:11px;color:#6B6F6A;margin-top:24px;border-top:1px solid #DAD5CC;padding-top:12px">
        Penlabs Lighting · a Pen Homes company · intentional, invisible technology.
      </p>
    </div>
  </div>`;

function specLines(spec?: Record<string, unknown> | null): string {
  if (!spec) return '';
  const rows = Object.entries(spec)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:2px 12px 2px 0;color:#6B6F6A">${k}</td><td style="padding:2px 0;font-weight:bold">${String(v)}</td></tr>`
    )
    .join('');
  return `<table style="font-size:13px;margin:12px 0">${rows}</table>`;
}

export async function sendLeadEmails(lead: LeadEmailInput): Promise<void> {
  if (!resend) return;

  const attachments =
    lead.pdfBase64 && lead.pdfFilename
      ? [{ filename: lead.pdfFilename, content: lead.pdfBase64 }]
      : undefined;

  // 1) Auto-reply to the customer (with their PDF, if provided).
  try {
    await resend.emails.send({
      from: FROM,
      to: lead.email,
      replyTo: REPLY_TO,
      subject: `Your lighting plan${lead.roomName ? `, ${lead.roomName}` : ''}`,
      attachments,
      html: shell(`
        <p>Hi ${escapeHtml(lead.name)},</p>
        <p>Thank you for your interest in working with Pen Homes. We've received your request${
          lead.roomName ? ` for <strong>${escapeHtml(lead.roomName)}</strong>` : ''
        } and a member of our team will be in touch shortly.</p>
        ${specLines(lead.spec)}
        ${attachments ? '<p>Your full lighting report is attached as a PDF.</p>' : ''}
        <p>We design your home and its intelligence simultaneously, from the first sketch to a seamless install.</p>
        <div style="margin:20px 0 4px">
          ${button(tagged('/calculator', 'quote-followup'), 'Plan another room')}
          ${CONSULT_URL ? button(tagged(CONSULT_URL, 'quote-consult'), 'Book a consultation', false) : ''}
          ${PENCASA_URL ? button(tagged(PENCASA_URL, 'quote-pencasa'), 'Shop at Pencasa', false) : ''}
        </div>
      `),
    });
  } catch (e) {
    console.error('Auto-reply email failed:', e);
  }

  // 2) Internal notification to Pen Homes.
  if (NOTIFY_TO) {
    try {
      await resend.emails.send({
        from: FROM,
        to: NOTIFY_TO,
        replyTo: lead.email,
        subject: `New quote request: ${lead.name}${lead.roomName ? ` (${lead.roomName})` : ''}`,
        html: shell(`
          <p style="font-weight:bold">New quote request</p>
          <table style="font-size:13px">
            <tr><td style="padding:2px 12px 2px 0;color:#6B6F6A">Name</td><td>${escapeHtml(lead.name)}</td></tr>
            <tr><td style="padding:2px 12px 2px 0;color:#6B6F6A">Email</td><td>${escapeHtml(lead.email)}</td></tr>
            ${lead.phone ? `<tr><td style="padding:2px 12px 2px 0;color:#6B6F6A">Phone</td><td>${escapeHtml(lead.phone)}</td></tr>` : ''}
            ${lead.source ? `<tr><td style="padding:2px 12px 2px 0;color:#6B6F6A">Source</td><td>${escapeHtml(lead.source)}</td></tr>` : ''}
          </table>
          ${lead.message ? `<p style="margin-top:12px">“${escapeHtml(lead.message)}”</p>` : ''}
          ${specLines(lead.spec)}
          <div style="margin-top:12px">${button(`${SITE_URL}/admin`, 'Open admin')}</div>
        `),
      });
    } catch (e) {
      console.error('Notification email failed:', e);
    }
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
