/**
 * Reports an event to Pen Homes Ops (penops), which turns it into an alert: P1 by SMS and
 * email at once, P2 by email, P3 in the morning digest. A no-op until PENOPS_SIGNAL_URL and
 * PENOPS_SIGNAL_TOKEN are set, and it never throws: an alert must never fail the request.
 */
export interface OpsSignal {
  priority: 'P1' | 'P2' | 'P3';
  title: string;
  body?: string;
  link?: string;
  /** Stable id for the event, so a retry never alerts twice. */
  dedupeKey?: string;
}

export async function sendOpsSignal(signal: OpsSignal): Promise<void> {
  const url = process.env.PENOPS_SIGNAL_URL;
  const token = process.env.PENOPS_SIGNAL_TOKEN;
  if (!url || !token) return;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(signal),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error(`[penops] Signal rejected (${res.status}): ${await res.text()}`);
  } catch (err) {
    console.error('[penops] Signal failed:', err);
  }
}
