'use client';

import { useState } from 'react';
import { Calculator, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics';
import FullLightingCalculator from './FullLightingCalculator';
import AdvancedLightingCalculator from './AdvancedLightingCalculator';

type Mode = 'simple' | 'advanced';

// Top-level Simple / Advanced toggle. Simple is the default and renders the
// existing calculator unchanged; Advanced is the opt-in layered-lighting flow.
export default function LightingCalculatorShell() {
  const [mode, setMode] = useState<Mode>('simple');

  const select = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    track('lighting_mode', { mode: next });
  };

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="Calculator mode"
        className="inline-flex rounded-lg border border-border bg-muted/30 p-1"
      >
        <button
          role="tab"
          aria-selected={mode === 'simple'}
          onClick={() => select('simple')}
          className={cn(
            'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
            mode === 'simple'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Calculator className="h-4 w-4" />
          Simple
        </button>
        <button
          role="tab"
          aria-selected={mode === 'advanced'}
          onClick={() => select('advanced')}
          className={cn(
            'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
            mode === 'advanced'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Layers className="h-4 w-4" />
          Advanced · Layered lighting
        </button>
      </div>

      {mode === 'simple' ? <FullLightingCalculator /> : <AdvancedLightingCalculator />}
    </div>
  );
}
