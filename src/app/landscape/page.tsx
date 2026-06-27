import type { Metadata } from 'next';
import LandscapeEstimator from '@/components/LandscapeEstimator';

export const metadata: Metadata = {
  title: 'Landscape Lighting Estimator | Penlabs Lighting Calculator',
  description:
    'Plan outdoor and garden lighting by feature: paths, trees, walls, steps and patios. Sizes fixtures, low-voltage transformer, cable and cost for low-voltage, solar or mains systems.',
};

export default function LandscapePage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl mb-2 mt-1">Landscape Lighting</h1>
        <p className="text-muted-foreground">
          Describe the features you want to light and get a fixture schedule, wiring and cost for a
          low-voltage, solar or mains outdoor scheme.
        </p>
      </div>
      <LandscapeEstimator />
    </div>
  );
}
