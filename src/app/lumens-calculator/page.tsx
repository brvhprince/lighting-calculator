import LumensOnlyCalculator from '@/components/LumensOnlyCalculator';

export default function LumensCalculatorPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Lumens Calculator</h1>
        <p className="text-muted-foreground">
          Quickly calculate the total lumens needed for your room
        </p>
      </div>
      <LumensOnlyCalculator />
    </div>
  );
}
