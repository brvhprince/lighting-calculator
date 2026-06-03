'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/context/CurrencyProvider';
import { MARKETS, MarketOverrides, validateMarkets } from '@/config/markets';
import { Save, RotateCcw, Download, Upload, Check, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function AdminConfigEditor() {
  const { markets, setOverrides, resetOverrides, format } = useCurrency();
  const [text, setText] = useState('');
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; msg: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Load the current effective markets into the editor.
  const load = () => setText(JSON.stringify(markets, null, 2));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      setStatus({ kind: 'error', msg: `Invalid JSON: ${(e as Error).message}` });
      return;
    }
    const err = validateMarkets(parsed);
    if (err) {
      setStatus({ kind: 'error', msg: err });
      return;
    }
    setOverrides(parsed as MarketOverrides);
    setStatus({ kind: 'ok', msg: 'Saved. Values are live across the app (stored in this browser).' });
  };

  const reset = () => {
    resetOverrides();
    setText(JSON.stringify(MARKETS, null, 2));
    setStatus({ kind: 'ok', msg: 'Reset to built-in defaults.' });
  };

  const download = () => {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pen-lighting-markets.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setText(String(reader.result));
      setStatus(null);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // A small live preview so the editor shows the effect of the current values.
  const sampleFixtures = 6;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2 rounded-lg border border-brand-bronze/40 bg-brand-bronze/10 p-4">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-brand-bronze" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Pricing &amp; market configuration</p>
          <p>
            Edits apply instantly across the app and are stored in <strong>this browser</strong>. To make them
            permanent for everyone, <strong>Download JSON</strong> and paste it into{' '}
            <code className="rounded bg-muted px-1">src/config/markets.ts</code>, then redeploy. This page is
            unauthenticated — protect it before exposing publicly.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Markets &amp; prices (JSON)</CardTitle>
          <CardDescription>
            One object per currency code. Numeric fields are prices in that currency and the electricity rate
            per kWh. Codes (USD, GHS) are fixed; their values are editable.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setStatus(null);
            }}
            spellCheck={false}
            className="h-[420px] w-full rounded-lg border border-input bg-muted/30 p-3 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
          />

          {status && (
            <div
              className={`flex items-start gap-2 rounded-md border p-3 text-sm ${
                status.kind === 'ok'
                  ? 'border-brand-sage/50 bg-brand-sage/10'
                  : 'border-destructive/50 bg-destructive/10 text-destructive'
              }`}
            >
              {status.kind === 'ok' ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-sage" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{status.msg}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={save} className="gap-2">
              <Save className="h-4 w-4" /> Validate &amp; Save
            </Button>
            <Button onClick={reset} variant="outline" className="gap-2">
              <RotateCcw className="h-4 w-4" /> Reset to defaults
            </Button>
            <Button onClick={load} variant="outline">
              Reload current
            </Button>
            <Button onClick={download} variant="outline" className="gap-2">
              <Download className="h-4 w-4" /> Download JSON
            </Button>
            <Button onClick={() => fileInput.current?.click()} variant="outline" className="gap-2">
              <Upload className="h-4 w-4" /> Upload JSON
            </Button>
            <input ref={fileInput} type="file" accept="application/json" className="hidden" onChange={upload} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Live preview</CardTitle>
          <CardDescription>
            Material cost for a sample {sampleFixtures}-fixture room in each currency, using the saved values.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.values(markets).map((m) => (
              <div key={m.code} className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <p className="font-medium">{m.label}</p>
                <p className="text-muted-foreground">
                  {sampleFixtures} fixtures + hardware:{' '}
                  <span className="font-semibold text-foreground">
                    {m.symbol}
                    {(sampleFixtures * m.fixturePriceLow + m.hardwareLow).toLocaleString()}–{m.symbol}
                    {(sampleFixtures * m.fixturePriceHigh + m.hardwareHigh).toLocaleString()}
                  </span>
                </p>
                <p className="text-muted-foreground">Electricity: {m.symbol}{m.electricityRate}/kWh</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Active currency formatting sample: {format(12345.6)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
