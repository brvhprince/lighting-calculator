import { CalculationInput, CalculationResult } from './index';

export type SavedCalculation = {
  id: string;
  name: string;
  timestamp: number;
  type: 'full' | 'lumens';
  input: CalculationInput | LumensOnlyInput;
  result: CalculationResult | LumensOnlyResult;
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
