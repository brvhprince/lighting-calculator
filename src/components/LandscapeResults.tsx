'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, FileDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/context/CurrencyProvider';
import { LandscapeResult } from '@/lib/landscape/engine';

// Shared results view for both the estimator and the site-plan designer.
export function LandscapeResults({
  result,
  onExport,
  pdfBusy,
}: {
  result: LandscapeResult;
  onExport: () => void;
  pdfBusy: boolean;
}) {
  const { format } = useCurrency();
  const solar = result.system === 'solar';

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile label="Fixtures" value={String(result.totalFixtures)} />
        <Tile label="Total output" value={`${result.totalLumens.toLocaleString()} lm`} />
        {solar ? (
          <Tile label="Grid power" value="None (solar)" />
        ) : (
          <Tile label="Total load" value={`${result.totalWatts} W`} />
        )}
        <Tile
          label="Material cost"
          value={`${format(result.materialLow)}–${format(result.materialHigh)}`}
          emphasis
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">System &amp; engineering</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {result.system === 'lowvoltage' && result.transformer && (
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Transformer">
                {result.transformer.count > 1 ? `${result.transformer.count} × ` : ''}
                {result.transformer.sizeVA} VA
                <span className="text-xs text-muted-foreground"> ({result.transformer.headroomPct}% headroom)</span>
              </Metric>
              <Metric label="Cable (est.)">
                ~{result.cableMeters} m ({format(result.cablePrice ?? 0)})
              </Metric>
              <Metric label="Running cost">{format(result.annualEnergyCost)}/yr</Metric>
            </div>
          )}
          {result.system === 'linevoltage' && (
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Circuits">{result.circuits}</Metric>
              <Metric label="Total load">{result.totalWatts} W</Metric>
              <Metric label="Running cost">{format(result.annualEnergyCost)}/yr</Metric>
            </div>
          )}
          {solar && (
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Wiring">None</Metric>
              <Metric label="Running cost">{format(0)}/yr</Metric>
              <Metric label="Installed">{format(result.materialLow)}–{format(result.materialHigh)}</Metric>
            </div>
          )}
          {!solar && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric label="Labour (finish)">{format(result.install)}</Metric>
              <Metric label="Installed total">
                {format(result.installedLow)}–{format(result.installedHigh)}
              </Metric>
            </div>
          )}
          <ul className="space-y-1.5 border-t pt-3">
            {result.notes.map((n, i) => (
              <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-bronze" />
                {n}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Fixture schedule</CardTitle>
          <Button onClick={onExport} variant="outline" size="sm" disabled={pdfBusy} className="gap-1.5">
            {pdfBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            {pdfBusy ? 'Building…' : 'Export PDF'}
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Feature</th>
                <th className="py-2 pr-4 font-medium">Fixture</th>
                <th className="py-2 pr-4 font-medium text-right">Qty</th>
                <th className="py-2 pr-4 font-medium text-right">Lumens</th>
                <th className="py-2 pr-4 font-medium text-right">Est. cost</th>
              </tr>
            </thead>
            <tbody>
              {result.lines.map((l) => (
                <tr key={l.featureId} className="border-b border-border/60 align-top">
                  <td className="py-2 pr-4">
                    <span className="font-medium">{l.techniqueName}</span>
                    {l.label ? <span className="text-muted-foreground"> · {l.label}</span> : ''}
                    <span className="block text-xs text-muted-foreground">{l.note}</span>
                  </td>
                  <td className="py-2 pr-4">
                    {l.fixture.name}
                    <span className="block text-xs text-muted-foreground">
                      {l.fixture.cct}K · {l.fixture.ip}
                      {l.fixture.beam ? ` · ${l.fixture.beam}` : ''}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-right">{l.quantity}</td>
                  <td className="py-2 pr-4 text-right">{l.lumensEach.toLocaleString()}</td>
                  <td className="py-2 pr-4 text-right">{format(l.costLow)}–{format(l.costHigh)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}

function Tile({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className={cn('rounded-lg border p-4', emphasis ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30')}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function Metric({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-right">{children}</span>
    </div>
  );
}
