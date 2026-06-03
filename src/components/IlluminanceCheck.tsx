'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalculationResult } from '@/types';
import { ROOM_TYPES } from '@/lib/roomTypes';
import { verifyIlluminance } from '@/lib/illuminance';
import { Target, Check, ArrowUp, ArrowDown } from 'lucide-react';

type Props = {
  result: CalculationResult;
  roomType: string;
};

const SQFT_TO_SQM = 0.092903;

// IESNA lumen-method verification of the planned layout.
export function IlluminanceCheck({ result, roomType }: Props) {
  const areaSqFt = result.areaUnit === 'm²' ? result.area / SQFT_TO_SQM : result.area;
  // Target: room's IES maintained illuminance, else derive from its lumens/ft².
  const targetLux = ROOM_TYPES[roomType]?.targetLux ?? Math.round(result.lumensPerSqFt * 10.7639);

  const v = verifyIlluminance({
    numberOfFixtures: result.numberOfFixtures,
    lumensPerFixture: result.lumensPerFixture,
    areaSqFt,
    ceilingHeightFt: result.ceilingHeightFt ?? 8,
    targetLux,
  });

  const tone =
    v.verdict === 'on-target'
      ? { color: 'text-brand-sage', Icon: Check, label: 'On target' }
      : v.verdict === 'below'
      ? { color: 'text-brand-bronze', Icon: ArrowDown, label: 'Below target' }
      : { color: 'text-brand-bronze', Icon: ArrowUp, label: 'Above target' };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-brand-bronze" />
          Delivered Light Check
        </CardTitle>
        <CardDescription>
          IESNA lumen-method estimate of the maintained light reaching the work plane.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Tile label="Delivered" value={`${v.deliveredLux} lux`} sub={`${v.deliveredFc} fc`} emphasis />
          <Tile label="Target (IES)" value={`${v.targetLux} lux`} sub={`${v.targetFc} fc`} />
          <Tile label="Coeff. of utilisation" value={v.cu.toFixed(2)} sub={`RCR ${v.rcr}`} />
          <Tile label="Light-loss factor" value={v.llf.toFixed(2)} sub="maintained" />
        </div>

        <div
          className={`flex items-start gap-2 rounded-lg border p-4 text-sm ${
            v.verdict === 'on-target' ? 'border-brand-sage/40 bg-brand-sage/10' : 'border-brand-bronze/40 bg-brand-bronze/10'
          }`}
        >
          <tone.Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone.color}`} />
          <div className="text-muted-foreground">
            <span className={`font-semibold ${tone.color}`}>
              {tone.label} — {Math.round(v.ratio * 100)}% of target.
            </span>{' '}
            {v.verdict === 'below' ? (
              <>
                This ambient layout delivers below the IES maintained target. For task areas, add the{' '}
                <strong>task layer</strong> from the layered plan, or increase to about{' '}
                <strong>{v.suggestedFixtures}</strong> fixtures of this size to meet it with general
                lighting alone.
              </>
            ) : v.verdict === 'above' ? (
              <>You have headroom above target — dimming is recommended to tune and save energy.</>
            ) : (
              <>The ambient layout meets the IES maintained target for this room.</>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          * Estimate via the lumen method: E = (N × lumens × CU × LLF) ÷ area. CU is approximated from the
          room cavity ratio; confirm with the fixture&apos;s photometric file (IES file) for a final design.
        </p>
      </CardContent>
    </Card>
  );
}

function Tile({
  label,
  value,
  sub,
  emphasis,
}: {
  label: string;
  value: string;
  sub?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        emphasis ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30'
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
