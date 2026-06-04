'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalculationResult } from '@/types';
import { useCurrency } from '@/context/CurrencyProvider';
import { gatherLightingReportData } from '@/lib/pdf/reportData';
import { track } from '@/lib/analytics';
import { MailCheck, Send, AlertTriangle } from 'lucide-react';

type Props = {
  result: CalculationResult;
  roomType: string;
  roomName: string;
  source: 'calculator' | 'designer';
};

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function QuoteRequestDialog({ result, roomType, roomName, source }: Props) {
  const { market } = useCurrency();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('sending');
    setError('');

    // Generate the branded PDF to attach to the auto-reply (best-effort).
    let pdfBase64: string | undefined;
    try {
      const { buildLightingReportBlob } = await import('@/lib/pdf/lightingReport');
      const blob = await buildLightingReportBlob(
        gatherLightingReportData({ result, roomType, roomName, market })
      );
      if (blob.size < 2_500_000) pdfBase64 = await blobToBase64(blob);
    } catch {
      /* attachment is optional — continue without it */
    }

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          message,
          website,
          roomName,
          source,
          pdfBase64,
          data: {
            room: roomName,
            area: `${result.area.toFixed(1)} ${result.areaUnit}`,
            totalLumens: result.totalLumensNeeded,
            fixtures: result.numberOfFixtures,
            fixtureSize: result.fixtureSize,
            currency: market.code,
          },
        }),
      });
      if (res.ok) {
        setState('done');
        track('quote_submitted', { source, room: roomName });
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d?.error || 'Something went wrong.');
        setState('error');
      }
    } catch {
      setError('Network error — please try again.');
      setState('error');
    }
  };

  const reset = () => {
    setState('idle');
    setName('');
    setEmail('');
    setPhone('');
    setMessage('');
    setError('');
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Send className="h-4 w-4" />
          Request a quote
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        {state === 'done' ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-sage/20">
              <MailCheck className="h-6 w-6 text-brand-sage" />
            </div>
            <DialogTitle className="font-display text-xl">Request received</DialogTitle>
            <DialogDescription className="mt-2">
              Thank you — the Pen Homes team will be in touch about <strong>{roomName}</strong>. We design
              your home and its intelligence simultaneously.
            </DialogDescription>
            <Button className="mt-6" variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Request a quote from Pen Homes</DialogTitle>
              <DialogDescription>
                We&apos;ll include this {roomName} spec ({result.numberOfFixtures} fixtures ·{' '}
                {result.totalLumensNeeded.toLocaleString()} lm) with your enquiry.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="q-name">Name</Label>
                <Input id="q-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="q-email">Email</Label>
                  <Input id="q-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="q-phone">Phone (optional)</Label>
                  <Input id="q-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="q-message">Message (optional)</Label>
                <textarea
                  id="q-message"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-md border border-input bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Anything else we should know?"
                />
              </div>
              {/* Honeypot — hidden from users */}
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="hidden"
                aria-hidden="true"
              />
              {state === 'error' && (
                <p className="flex items-center gap-1.5 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" /> {error}
                </p>
              )}
              <Button type="submit" className="w-full gap-2" disabled={state === 'sending'}>
                <Send className="h-4 w-4" />
                {state === 'sending' ? 'Sending…' : 'Send request'}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Your details go only to Pen Homes for this enquiry.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
