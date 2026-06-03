import { CalculationInput, CalculationResult } from './index';
import type { DesignerState } from '@/lib/shareUrl';

export type SavedCalculation = {
  id: string;
  name: string;
  description?: string;
  timestamp: number;
  type: 'full' | 'lumens';
  input: CalculationInput | LumensOnlyInput;
  result: CalculationResult | LumensOnlyResult;
  // Present when saved from the Room Designer — restores the actual drawn shape.
  designer?: DesignerState;
};

export type LumensOnlyInput = {
  length: number;
  width: number;
  roomType: string;
  unitSystem: 'metric' | 'imperial';
  customLumensPerSqFt?: number;
};

export type LumensOnlyResult = {
  totalLumens: number;
  lumensPerSqFt: number;
  area: number;
  areaUnit: string;
};
