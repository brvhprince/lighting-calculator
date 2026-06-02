'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSpecGuidance, getPenlabsProducts } from '@/lib/productRecommendations';
import { Palette, Sparkles, Sun, SlidersHorizontal } from 'lucide-react';

type Props = {
  roomType: string;
  ceilingHeightFt: number;
};

export function ProductRecommendations({ roomType, ceilingHeightFt }: Props) {
  const spec = getSpecGuidance(roomType, ceilingHeightFt);
  const products = getPenlabsProducts(roomType, ceilingHeightFt);

  const specItems = [
    { icon: Palette, label: 'Colour temperature', value: spec.colorTemp, reason: spec.colorTempReason },
    { icon: Sparkles, label: 'Colour rendering', value: spec.cri, reason: spec.criReason },
    { icon: Sun, label: 'Beam angle', value: spec.beamAngle, reason: spec.beamReason },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-bronze" />
          Product Recommendations
        </CardTitle>
        <CardDescription>
          Spec guidance and curated Penlabs fixtures matched to this room.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Spec guidance */}
        <div className="grid gap-4 sm:grid-cols-3">
          {specItems.map((item) => (
            <div key={item.label} className="rounded-lg border border-border bg-muted/30 p-4 space-y-1.5">
              <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </p>
              <p className="font-semibold">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.reason}</p>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-border bg-accent/40 p-4">
          <SlidersHorizontal className="mt-0.5 h-4 w-4 shrink-0 text-brand-bronze" />
          <p className="text-sm text-muted-foreground">{spec.dimming}</p>
        </div>

        {/* Penlabs products */}
        <div>
          <h4 className="mb-3 font-display text-lg">Curated Penlabs fixtures</h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <div
                key={p.name}
                className="flex flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:border-brand-bronze"
              >
                <div className="mb-3 flex h-20 items-center justify-center rounded-md bg-gradient-to-br from-brand-basalt to-brand-bronze">
                  <span className="font-display text-2xl text-brand-bone">P</span>
                </div>
                <p className="font-semibold">{p.name}</p>
                <p className="mb-3 text-xs text-muted-foreground">{p.tagline}</p>
                <dl className="space-y-1 text-xs">
                  <Spec k="Output" v={`${p.lumens} · ${p.watts}`} />
                  <Spec k="Colour" v={`${p.colorTemp} · ${p.cri}`} />
                  <Spec k="Smart" v={p.smart} />
                  <Spec k="Finish" v={p.finish} />
                </dl>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Penlabs hardware is engineered to the Pen Homes standard — intentional, invisible technology.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function Spec({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}
