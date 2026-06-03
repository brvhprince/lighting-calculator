'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Ruler } from 'lucide-react';
import { CalculationResult } from '@/types';
import { LightingZones } from './LightingZones';
import { CircuitPlan } from './CircuitPlan';
import { CostEnergyEstimator } from './CostEnergyEstimator';
import { ProductRecommendations } from './ProductRecommendations';
import { ShoppingList } from './ShoppingList';
import { QuoteRequestDialog } from './QuoteRequestDialog';
import { ROOM_TYPES } from '@/lib/roomTypes';

type Props = {
  result: CalculationResult;
  roomType: string;
  customRoomName?: string;
  source?: 'calculator' | 'designer';
  // Tool-specific visualization (e.g. the calculator's spacing grid) shown
  // beside the requirements summary. The designer omits it (it has its canvas).
  visual?: ReactNode;
};

// The full analytical result stack, shared by the calculator and the designer so
// both surface identical lumens, zones, cost, product and shopping guidance.
export function LightingResults({ result, roomType, customRoomName, source = 'calculator', visual }: Props) {
  const roomName = customRoomName || ROOM_TYPES[roomType]?.name || 'Room';
  return (
    <div className="space-y-6">
      <div className={visual ? 'grid gap-6 md:grid-cols-2' : ''}>
        {/* Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Lighting Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Floor Area</p>
                <p className="text-2xl font-bold">
                  {result.area.toFixed(1)} {result.areaUnit}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Lumens</p>
                <p className="text-2xl font-bold">{result.totalLumensNeeded.toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <Row label="Number of Fixtures" value={String(result.numberOfFixtures)} />
              <Row label="Fixture Size" value={result.fixtureSize} />
              <Row label="Lumens per Fixture" value={String(result.lumensPerFixture)} />
              <Row label="Lumens per Sq Ft" value={String(result.lumensPerSqFt)} />
              {result.ceilingFactor != null && result.ceilingFactor !== 1 && (
                <Row
                  label={`Ceiling Adjustment (${result.ceilingHeightFt?.toFixed(1)} ft)`}
                  value={`${result.ceilingFactor > 1 ? '+' : ''}${Math.round((result.ceilingFactor - 1) * 100)}%`}
                  accent="bronze"
                />
              )}
              {result.naturalLightFactor != null && result.naturalLightFactor !== 1 && (
                <Row
                  label="Daylight Reduction"
                  value={`−${Math.round((1 - result.naturalLightFactor) * 100)}%`}
                  accent="sage"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {visual}
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {result.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="mt-0.5 text-brand-bronze">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <LightingZones roomType={roomType} totalLumens={result.totalLumensNeeded} />
      <CircuitPlan result={result} roomType={roomType} />
      <CostEnergyEstimator result={result} />
      <ProductRecommendations roomType={roomType} ceilingHeightFt={result.ceilingHeightFt ?? 8} />
      <ShoppingList result={result} roomType={roomType} customRoomName={customRoomName} />

      {/* Conversion CTA */}
      <Card className="border-brand-bronze/40 bg-brand-bronze/5 print:hidden">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div>
            <p className="font-display text-lg">Bring this design to life with Pen Homes</p>
            <p className="text-sm text-muted-foreground">
              We design your home and its intelligence simultaneously — from sketch to seamless install.
            </p>
          </div>
          <QuoteRequestDialog result={result} roomType={roomType} roomName={roomName} source={source} />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'bronze' | 'sage';
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}:</span>
      <span
        className={`font-semibold ${
          accent === 'bronze' ? 'text-brand-bronze' : accent === 'sage' ? 'text-brand-sage' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}
