'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getLightingLayers, LightLayer } from '@/lib/lightingZones';
import { Layers } from 'lucide-react';

type Props = {
  roomType: string;
  totalLumens: number;
};

const LAYER_COLOR: Record<LightLayer['key'], string> = {
  ambient: 'bg-brand-basalt',
  task: 'bg-brand-bronze',
  accent: 'bg-brand-sage',
};

export function LightingZones({ roomType, totalLumens }: Props) {
  const layers = getLightingLayers(roomType, totalLumens);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-brand-bronze" />
          Layered Lighting Plan
        </CardTitle>
        <CardDescription>
          Great rooms layer light. Here&apos;s how to split the {totalLumens.toLocaleString()} lumens across zones.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Proportion bar */}
        <div className="flex h-3 w-full overflow-hidden rounded-full">
          {layers.map((l) => (
            <div
              key={l.key}
              className={LAYER_COLOR[l.key]}
              style={{ width: `${l.percent}%` }}
              title={`${l.name}: ${l.percent}%`}
            />
          ))}
        </div>

        <div className="space-y-4">
          {layers.map((l) => (
            <div key={l.key} className="flex gap-3">
              <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${LAYER_COLOR[l.key]}`} />
              <div className="flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold">{l.name}</p>
                  <p className="text-sm">
                    <span className="font-semibold">{l.lumens.toLocaleString()}</span>{' '}
                    <span className="text-muted-foreground">lm · {l.percent}%</span>
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">{l.examples}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/80">Control:</span> {l.control}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
