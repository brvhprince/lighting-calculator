'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalculationResult } from '@/types';
import { getLightingLayers } from '@/lib/lightingZones';
import { EFFICACY } from '@/lib/costEstimator';
import { PlugZap, Cable } from 'lucide-react';

type Props = {
  result: CalculationResult;
  roomType: string;
};

// Turns the layered zones into switched/dimmed circuits, sizes the connected
// load, and gives a rough cable-run estimate. Planning aid, not a substitute
// for an electrician or local code.
export function CircuitPlan({ result, roomType }: Props) {
  const layers = getLightingLayers(roomType, result.totalLumensNeeded);

  const zones = layers.map((l) => ({
    key: l.key,
    name: l.name,
    fixtures: Math.max(1, Math.round((result.numberOfFixtures * l.percent) / 100)),
    watts: Math.max(1, Math.round(l.lumens / EFFICACY.led)),
    control: l.control,
  }));

  const totalWatts = Math.max(1, Math.round(result.totalLumensNeeded / EFFICACY.led));
  const amps = (v: number) => (totalWatts / v).toFixed(1);

  // Rough cable run: daisy-chain across the fixtures at their spacing + a home run.
  const metric = result.areaUnit === 'm²';
  const spacingFt =
    result.spacing.unit === 'mm'
      ? result.spacing.betweenFixtures / 304.8
      : result.spacing.betweenFixtures / 12;
  const runFt = Math.round(result.numberOfFixtures * spacingFt * 1.15 + 20);
  const runDisplay = metric ? `≈ ${Math.round(runFt * 0.3048)} m` : `≈ ${runFt} ft`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlugZap className="h-5 w-5 text-brand-bronze" />
          Circuit &amp; Switching Plan
        </CardTitle>
        <CardDescription>
          Suggested dimmer zones, connected load and a rough cable estimate for this room.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Zones table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Switched zone</th>
                <th className="py-2 pr-4 font-medium">Fixtures</th>
                <th className="py-2 pr-4 font-medium">Load</th>
                <th className="py-2 font-medium">Control</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z.key} className="border-b border-border/60">
                  <td className="py-2 pr-4 font-medium">{z.name}</td>
                  <td className="py-2 pr-4">~{z.fixtures}</td>
                  <td className="py-2 pr-4">{z.watts} W</td>
                  <td className="py-2 text-muted-foreground">{z.control}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Load summary */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Tile label="Connected load" value={`${totalWatts} W`} />
          <Tile label="Current @ 230 V" value={`${amps(230)} A`} />
          <Tile label="Current @ 120 V" value={`${amps(120)} A`} />
          <Tile label="Est. cable" value={runDisplay} icon />
        </div>

        <div className="rounded-lg border border-border bg-accent/40 p-4 text-sm text-muted-foreground">
          <p>
            Put each zone on its own <strong>LED-compatible dimmer</strong> rated above its load above.
            At {totalWatts} W this room sits comfortably on a single dedicated lighting circuit
            (a typical 15&nbsp;A/120&nbsp;V circuit carries ~1,440&nbsp;W usable; a 10&nbsp;A/230&nbsp;V
            circuit ~1,840&nbsp;W). Always confirm against local code and have a licensed electrician
            verify circuits and breaker sizing.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function Tile({ label, value, icon }: { label: string; value: string; icon?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
        {icon && <Cable className="h-3.5 w-3.5" />}
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
