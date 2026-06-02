import { CalculationResult } from '@/types';

// Luminous efficacy (lumens per watt) by bulb technology.
// LED is the modern baseline; incandescent/halogen are the legacy comparison.
export const EFFICACY = {
  led: 90, // lm/W — typical quality residential LED
  halogen: 18, // lm/W
  incandescent: 14, // lm/W
} as const;

export type InstallationMode = 'diy' | 'professional';

export type CostInputs = {
  fixtureUnitPrice: number; // cost per fixture (material)
  hardwareCost: number; // wiring, junction boxes, dimmer, etc.
  installMode: InstallationMode;
  installCostPerFixture: number; // labour per fixture when professional
  hoursPerDay: number; // average daily usage
  electricityRate: number; // currency per kWh
  currency: string; // symbol, e.g. "$"
};

export const DEFAULT_COST_INPUTS: CostInputs = {
  fixtureUnitPrice: 35,
  hardwareCost: 80,
  installMode: 'diy',
  installCostPerFixture: 90,
  hoursPerDay: 4,
  electricityRate: 0.17,
  currency: '$',
};

export type CostEstimate = {
  currency: string;
  fixtureCount: number;
  // Up-front
  materialCost: number;
  installationCost: number;
  upfrontCost: number;
  // Power
  ledWatts: number; // total connected load (LED)
  incandescentWatts: number; // equivalent load on legacy bulbs
  annualKwhLed: number;
  annualKwhIncandescent: number;
  // Running cost (per year)
  annualEnergyCostLed: number;
  annualEnergyCostIncandescent: number;
  annualSavings: number;
  tenYearSavings: number;
  // Environmental
  annualCo2KgLed: number;
  annualCo2SavedKg: number;
  // Payback of the LED premium
  paybackYears: number | null;
};

// Average grid emissions factor (kg CO2 per kWh). US/global rough average.
const CO2_PER_KWH = 0.4;
// Rough premium of an LED fixture over an equivalent incandescent setup, used
// only to estimate payback of going LED.
const LED_PREMIUM_PER_FIXTURE = 12;

export function estimateCost(result: CalculationResult, inputs: CostInputs): CostEstimate {
  const fixtureCount = result.numberOfFixtures;
  const totalLumens = result.totalLumensNeeded;

  const materialCost = round2(fixtureCount * inputs.fixtureUnitPrice + inputs.hardwareCost);
  const installationCost =
    inputs.installMode === 'professional'
      ? round2(fixtureCount * inputs.installCostPerFixture)
      : 0;
  const upfrontCost = round2(materialCost + installationCost);

  // Connected load derived from required lumens and technology efficacy.
  const ledWatts = totalLumens / EFFICACY.led;
  const incandescentWatts = totalLumens / EFFICACY.incandescent;

  const annualHours = inputs.hoursPerDay * 365;
  const annualKwhLed = (ledWatts * annualHours) / 1000;
  const annualKwhIncandescent = (incandescentWatts * annualHours) / 1000;

  const annualEnergyCostLed = round2(annualKwhLed * inputs.electricityRate);
  const annualEnergyCostIncandescent = round2(annualKwhIncandescent * inputs.electricityRate);
  const annualSavings = round2(annualEnergyCostIncandescent - annualEnergyCostLed);
  const tenYearSavings = round2(annualSavings * 10);

  const annualCo2KgLed = round2(annualKwhLed * CO2_PER_KWH);
  const annualCo2SavedKg = round2((annualKwhIncandescent - annualKwhLed) * CO2_PER_KWH);

  const ledPremium = fixtureCount * LED_PREMIUM_PER_FIXTURE;
  const paybackYears = annualSavings > 0 ? round2(ledPremium / annualSavings) : null;

  return {
    currency: inputs.currency,
    fixtureCount,
    materialCost,
    installationCost,
    upfrontCost,
    ledWatts: round2(ledWatts),
    incandescentWatts: round2(incandescentWatts),
    annualKwhLed: round2(annualKwhLed),
    annualKwhIncandescent: round2(annualKwhIncandescent),
    annualEnergyCostLed,
    annualEnergyCostIncandescent,
    annualSavings,
    tenYearSavings,
    annualCo2KgLed,
    annualCo2SavedKg,
    paybackYears,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatCurrency(value: number, currency: string): string {
  return `${currency}${value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}
