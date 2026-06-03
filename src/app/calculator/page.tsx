import type { Metadata } from 'next';
import FullLightingCalculator from '@/components/FullLightingCalculator';

export const metadata: Metadata = {
  title: 'Complete Lighting Calculator — Penlabs',
  description:
    'Calculate fixtures, spacing, layered zones, product specs, cost and energy for any room — ceiling-height and daylight aware.',
};

export default function CalculatorPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Complete Lighting Calculator</h1>
        <p className="text-muted-foreground">
          Calculate fixtures, lumens, and spacing for your recessed lighting project
        </p>
      </div>
      <FullLightingCalculator />
    </div>
  );
}
