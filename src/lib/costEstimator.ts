import { CalculationResult } from '@/types';
import { CurrencyCode, Market } from '@/config/markets';
import { resultFixtureMaterial } from './pricing';

// Luminous efficacy (lumens per watt) by bulb technology.
// LED is the modern baseline; incandescent/halogen are the legacy comparison.
export const EFFICACY = {
  led: 90, // lm/W — typical quality residential LED
  halogen: 18, // lm/W
  incandescent: 14, // lm/W
} as const;

export type InstallationMode = 'diy' | 'professional';

export type CostInputs = {
  hardwareCost: number; // wiring, junction boxes, dimmer, etc. (per room)
  installMode: InstallationMode;
  installCostPerFixture: number; // labour per fixture when professional
  hoursPerDay: number; // average daily usage
  electricityRate: number; // currency per kWh
};

// Seed the editable cost assumptions from the selected market. Per-fixture
// material price is no longer here — it comes from the catalogue at estimate time.
export function costInputsFromMarket(market: Market): CostInputs {
  return {
    hardwareCost: market.hardwareCost,
    installMode: 'diy',
    installCostPerFixture: market.installCostPerFixture,
    hoursPerDay: 4,
    electricityRate: market.electricityRate,
  };
}

export type CostEstimate = {
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
// only to estimate payback of going LED (in the active currency).
const LED_PREMIUM_FRACTION = 0.35; // ~35% of the fixture price

export function estimateCost(
  result: CalculationResult,
  inputs: CostInputs,
  currency: CurrencyCode
): CostEstimate {
  const fixtureCount = result.numberOfFixtures;
  const totalLumens = result.totalLumensNeeded;

  // Per-fixture material cost from the catalogue (exact mix when known).
  const fixtureMaterial = resultFixtureMaterial(result, currency);
  const materialCost = round2(fixtureMaterial + inputs.hardwareCost);
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

  const ledPremium = fixtureMaterial * LED_PREMIUM_FRACTION;
  const paybackYears = annualSavings > 0 ? round2(ledPremium / annualSavings) : null;

  return {
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
