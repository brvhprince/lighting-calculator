'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CalculationResult } from '@/types';
import { CostInputs, costInputsFromMarket, estimateCost } from '@/lib/costEstimator';
import { useCurrency } from '@/context/CurrencyProvider';
import { DollarSign, Zap, Leaf, TrendingDown } from 'lucide-react';

type Props = {
  result: CalculationResult;
};

export function CostEnergyEstimator({ result }: Props) {
  const { market, format } = useCurrency();
  const [inputs, setInputs] = useState<CostInputs>(() => costInputsFromMarket(market));

  // Re-seed price/energy defaults from the market when the currency changes.
  useEffect(() => {
    setInputs(costInputsFromMarket(market));
  }, [market]);

  const estimate = useMemo(
    () => estimateCost(result, inputs, market.code),
    [result, inputs, market.code]
  );

  const update = (patch: Partial<CostInputs>) => setInputs((prev) => ({ ...prev, ...patch }));

  const numberField = (key: keyof CostInputs) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    update({ [key]: isNaN(value) ? 0 : value } as Partial<CostInputs>);
  };

  const c = market.symbol;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-brand-bronze" />
          Cost &amp; Energy Estimator
        </CardTitle>
        <CardDescription>
          Estimate up-front cost, annual running cost, and the long-term savings of LED over legacy bulbs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Assumptions. Per-fixture prices come from the fixture catalogue
            (managed in admin); only the room-level globals are editable here. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hardwareCost">Hardware &amp; wiring ({c})</Label>
            <Input
              id="hardwareCost"
              type="number"
              min={0}
              value={inputs.hardwareCost}
              onChange={numberField('hardwareCost')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hoursPerDay">Hours used per day</Label>
            <Input
              id="hoursPerDay"
              type="number"
              min={0}
              max={24}
              value={inputs.hoursPerDay}
              onChange={numberField('hoursPerDay')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rate">Electricity rate ({c}/kWh)</Label>
            <Input
              id="rate"
              type="number"
              min={0}
              step="0.01"
              value={inputs.electricityRate}
              onChange={numberField('electricityRate')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="installPerFixture">Pro install / fixture ({c})</Label>
            <Input
              id="installPerFixture"
              type="number"
              min={0}
              value={inputs.installCostPerFixture}
              onChange={numberField('installCostPerFixture')}
              disabled={inputs.installMode !== 'professional'}
            />
          </div>
          <div className="space-y-2">
            <Label>Installation</Label>
            <RadioGroup
              value={inputs.installMode}
              onValueChange={(v) => update({ installMode: v as CostInputs['installMode'] })}
              className="flex gap-4 pt-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="diy" id="install-diy" />
                <Label htmlFor="install-diy" className="font-normal cursor-pointer">
                  DIY
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="professional" id="install-pro" />
                <Label htmlFor="install-pro" className="font-normal cursor-pointer">
                  Professional
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Up-front cost */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatTile label="Material cost" value={format(estimate.materialCost)} />
          <StatTile
            label="Installation"
            value={
              inputs.installMode === 'professional'
                ? format(estimate.installationCost)
                : 'DIY · ' + format(0)
            }
          />
          <StatTile
            label="Total up-front"
            value={format(estimate.upfrontCost)}
            emphasis
          />
        </div>

        {/* Energy */}
        <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <Zap className="h-4 w-4 text-brand-bronze" />
            Annual running cost
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">LED ({estimate.ledWatts} W total)</p>
              <p className="text-2xl font-semibold">
                {format(estimate.annualEnergyCostLed)}
                <span className="text-sm font-normal text-muted-foreground">/yr</span>
              </p>
              <p className="text-xs text-muted-foreground">{estimate.annualKwhLed} kWh per year</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Incandescent ({estimate.incandescentWatts} W total)
              </p>
              <p className="text-2xl font-semibold text-muted-foreground line-through decoration-1">
                {format(estimate.annualEnergyCostIncandescent)}
                <span className="text-sm font-normal">/yr</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {estimate.annualKwhIncandescent} kWh per year
              </p>
            </div>
          </div>
        </div>

        {/* Savings + ROI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-brand-bronze/40 bg-brand-bronze/10 p-4 space-y-1">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <TrendingDown className="h-4 w-4" /> LED saves you
            </p>
            <p className="text-2xl font-semibold text-foreground">
              {format(estimate.annualSavings)}
              <span className="text-sm font-normal text-muted-foreground">/yr</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {format(estimate.tenYearSavings)} over 10 years
            </p>
          </div>
          <StatTile
            label="Payback of LED premium"
            value={estimate.paybackYears !== null ? `${estimate.paybackYears} yrs` : '—'}
          />
          <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-1">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Leaf className="h-4 w-4 text-brand-sage" /> CO₂ avoided
            </p>
            <p className="text-2xl font-semibold">{estimate.annualCo2SavedKg} kg</p>
            <p className="text-xs text-muted-foreground">vs. incandescent, per year</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          * Estimates only. Energy figures derive from required lumens at typical efficacy (LED ≈ 90 lm/W,
          incandescent ≈ 14 lm/W). Actual prices, tariffs and grid emissions vary by region.
        </p>
      </CardContent>
    </Card>
  );
}

function StatTile({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 space-y-1 ${
        emphasis ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/40'
      }`}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-2xl font-semibold ${emphasis ? 'text-foreground' : ''}`}>{value}</p>
    </div>
  );
}
