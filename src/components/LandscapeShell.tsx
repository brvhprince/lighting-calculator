'use client';

import { useState } from 'react';
import { ListChecks, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import LandscapeEstimator from './LandscapeEstimator';
import LandscapeDesigner from './LandscapeDesigner';

type Mode = 'estimator' | 'siteplan';

export default function LandscapeShell() {
  const [mode, setMode] = useState<Mode>('estimator');

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="Landscape mode"
        className="inline-flex rounded-lg border border-border bg-muted/30 p-1"
      >
        <button
          role="tab"
          aria-selected={mode === 'estimator'}
          onClick={() => setMode('estimator')}
          className={cn(
            'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
            mode === 'estimator' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <ListChecks className="h-4 w-4" />
          Estimator
        </button>
        <button
          role="tab"
          aria-selected={mode === 'siteplan'}
          onClick={() => setMode('siteplan')}
          className={cn(
            'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
            mode === 'siteplan' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Map className="h-4 w-4" />
          Site plan
        </button>
      </div>

      {mode === 'estimator' ? <LandscapeEstimator /> : <LandscapeDesigner />}
    </div>
  );
}
