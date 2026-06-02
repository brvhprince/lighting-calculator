'use client';

import { CalculationResult } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Printer, Check } from 'lucide-react';
import { ROOM_TYPES } from '@/lib/roomTypes';
import { useCurrency } from '@/context/CurrencyProvider';

type ShoppingListProps = {
  result: CalculationResult;
  roomType: string;
  customRoomName?: string;
};

export function ShoppingList({ result, roomType, customRoomName }: ShoppingListProps) {
  const roomName = customRoomName || ROOM_TYPES[roomType]?.name || 'Room';
  const { market, format } = useCurrency();

  const handlePrint = () => {
    window.print();
  };

  const fixtureEstimate = {
    low: Math.round(result.numberOfFixtures * market.fixturePriceLow),
    high: Math.round(result.numberOfFixtures * market.fixturePriceHigh),
  };

  const hardwareEstimate = {
    low: market.hardwareLow,
    high: market.hardwareHigh,
  };

  const totalEstimate = {
    low: fixtureEstimate.low + hardwareEstimate.low,
    high: fixtureEstimate.high + hardwareEstimate.high,
  };

  return (
    <Card className="print:shadow-none">
      <CardHeader className="print:pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping List
          </CardTitle>
          <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2 print:hidden">
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Project Details
          </h3>
          <p className="text-sm">
            <span className="font-medium">Room:</span> {roomName}
          </p>
          <p className="text-sm">
            <span className="font-medium">Area:</span> {result.area.toFixed(1)} {result.areaUnit}
          </p>
        </div>

        {/* Primary Fixtures */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Check className="h-4 w-4" /> Primary Fixtures
          </h3>
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex items-start gap-3">
              <input type="checkbox" className="mt-1 print:scale-150" />
              <div className="flex-1">
                <p className="font-medium">
                  {result.numberOfFixtures}× {result.fixtureSize} LED Recessed Lights
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 mt-2 ml-4 list-disc">
                  <li>Minimum {result.lumensPerFixture} lumens per fixture</li>
                  <li>Total lumens needed: {result.totalLumensNeeded.toLocaleString()}</li>
                  <li>Recommended: 3000K color temperature (warm white)</li>
                  <li>Dimmable preferred</li>
                  <li>IC-rated if near insulation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Installation Hardware */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Check className="h-4 w-4" /> Installation Hardware
          </h3>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <p className="text-sm">
                {result.numberOfFixtures}× Junction boxes (if not included with fixtures)
              </p>
            </div>
            <div className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <p className="text-sm">{result.numberOfFixtures * 2}× Wire connectors</p>
            </div>
            <div className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <p className="text-sm">
                Electrical wire (14/2 or 12/2 gauge, estimate based on layout)
              </p>
            </div>
          </div>
        </div>

        {/* Optional Controls */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Check className="h-4 w-4" /> Controls (Optional)
          </h3>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <p className="text-sm">1× Dimmer switch (LED compatible)</p>
            </div>
            <div className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <p className="text-sm">1× Switch plate/cover</p>
            </div>
          </div>
        </div>

        {/* Tools Needed */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Check className="h-4 w-4" /> Tools Needed
          </h3>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <p className="text-sm">
                Hole saw ({result.fixtureSize} for this fixture size)
              </p>
            </div>
            <div className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <p className="text-sm">Stud finder</p>
            </div>
            <div className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <p className="text-sm">Fish tape (for running wire)</p>
            </div>
            <div className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <p className="text-sm">Voltage tester</p>
            </div>
            <div className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <p className="text-sm">Wire strippers and cutters</p>
            </div>
            <div className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <p className="text-sm">Drill and driver bits</p>
            </div>
          </div>
        </div>

        {/* Estimated Cost */}
        <div className="border-t pt-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
            Estimated Cost
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>
                Fixtures ({result.numberOfFixtures}× at {format(market.fixturePriceLow)}–
                {format(market.fixturePriceHigh)} each):
              </span>
              <span className="font-medium">
                {format(fixtureEstimate.low)} – {format(fixtureEstimate.high)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Hardware & Supplies:</span>
              <span className="font-medium">
                {format(hardwareEstimate.low)} – {format(hardwareEstimate.high)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-2">
              <span>Total Estimated Cost:</span>
              <span className="text-primary">
                {format(totalEstimate.low)} – {format(totalEstimate.high)}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            * Costs are estimates only. Actual prices vary by brand, quality, and location.
            Professional installation costs not included.
          </p>
        </div>

        {/* Installation Notes */}
        <div className="bg-accent/60 border border-border p-4 rounded-lg space-y-2">
          <h3 className="font-semibold text-sm">Installation Notes</h3>
          <ul className="text-sm space-y-1 list-disc ml-4">
            <li>
              Space fixtures {result.spacing.betweenFixtures} {result.spacing.unit} apart (center to
              center)
            </li>
            <li>
              Keep first fixtures {result.spacing.fromWall} {result.spacing.unit} from walls
            </li>
            <li>Arrange in {result.spacing.layout.rows} rows × {result.spacing.layout.columns} columns</li>
            <li>Always turn off power at breaker before working</li>
            <li>Check local electrical codes and permits</li>
            <li>Consider hiring a licensed electrician for safety</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground border-t pt-4 print:block">
          <p>Generated by Pen Lighting Calculator</p>
          <p>by Pen Homes • Professional Lighting Design</p>
        </div>
      </CardContent>
    </Card>
  );
}
