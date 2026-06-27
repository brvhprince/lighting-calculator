import type { Metadata } from 'next';
import LumensOnlyCalculator from '@/components/LumensOnlyCalculator';

export const metadata: Metadata = {
  title: 'Lumens Calculator |  Lighting Calculator',
  description: 'A fast, room-aware estimate of the total lumens you need, in imperial or metric.',
};

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
