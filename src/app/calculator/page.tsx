import FullLightingCalculator from '@/components/FullLightingCalculator';

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
