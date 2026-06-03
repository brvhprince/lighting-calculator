'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSpecGuidance, getPenlabsProducts } from '@/lib/productRecommendations';
import { kelvinToCss } from '@/lib/cct';
import { Button } from '@/components/ui/button';
import { Palette, Sparkles, Sun, SlidersHorizontal, ShoppingBag, ArrowUpRight } from 'lucide-react';

// Set NEXT_PUBLIC_PENCASA_URL to your Pencasa store URL to show the shop CTA.
// Left blank until products are listed, so no dead links appear.
const PENCASA_URL = process.env.NEXT_PUBLIC_PENCASA_URL;

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

  // Warm↔cool gradient with the recommended CCT band marked.
  const CCT_LO = 2700;
  const CCT_HI = 6500;
  const pos = (k: number) => ((Math.max(CCT_LO, Math.min(CCT_HI, k)) - CCT_LO) / (CCT_HI - CCT_LO)) * 100;
  const gradient = `linear-gradient(to right, ${[2700, 3000, 3500, 4000, 5000, 6500]
    .map((k) => `${kelvinToCss(k)} ${pos(k).toFixed(0)}%`)
    .join(', ')})`;
  const bandLeft = pos(spec.cctMin);
  const bandWidth = Math.max(4, pos(spec.cctMax) - pos(spec.cctMin));

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

        {/* Colour temperature preview */}
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
            <Palette className="h-3.5 w-3.5" /> Colour temperature preview
          </p>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <span
                className="h-9 w-9 rounded-full border border-border shadow-inner"
                style={{ backgroundColor: kelvinToCss(spec.cctMin) }}
              />
              <span className="text-[0.7rem] text-muted-foreground">{spec.cctMin}K</span>
            </div>
            <div className="relative flex-1">
              <div className="h-4 w-full rounded-full" style={{ background: gradient }} />
              <div
                className="absolute top-[-2px] h-5 rounded-full border-2 border-foreground/70"
                style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }}
                title={`Recommended ${spec.cctMin}K–${spec.cctMax}K`}
              />
            </div>
            {spec.cctMax !== spec.cctMin && (
              <div className="flex flex-col items-center gap-1">
                <span
                  className="h-9 w-9 rounded-full border border-border shadow-inner"
                  style={{ backgroundColor: kelvinToCss(spec.cctMax) }}
                />
                <span className="text-[0.7rem] text-muted-foreground">{spec.cctMax}K</span>
              </div>
            )}
          </div>
          <div className="flex justify-between text-[0.65rem] text-muted-foreground">
            <span>2700K · warm</span>
            <span>cool · 6500K</span>
          </div>
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
          {PENCASA_URL && (
            <a href={PENCASA_URL} target="_blank" rel="noreferrer" className="mt-4 inline-block">
              <Button variant="outline" className="gap-2">
                <ShoppingBag className="h-4 w-4" />
                Explore smart lighting at Pencasa
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </a>
          )}
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
