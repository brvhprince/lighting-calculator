'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { RoomConfigFields } from './RoomConfigFields';
import { RoomConfigValue, SharedInputs, UnitSystem } from '@/types';

// The room inputs shared by Simple and Advanced mode live in one component so
// both calculators read/write the exact same fields, switching modes (or
// restoring a save) never loses or diverges the inputs.
export type { SharedInputs };

type Props = {
  value: SharedInputs;
  onUnitSystem: (u: UnitSystem) => void;
  onLength: (v: string) => void;
  onWidth: (v: string) => void;
  onIsExpert: (v: boolean) => void;
  onConfig: (patch: Partial<RoomConfigValue>) => void;
  idPrefix: string;
  // Advanced mode picks fixtures per layer, so it hides the single fixture selector.
  showFixture?: boolean;
};

export function RoomInputs({
  value,
  onUnitSystem,
  onLength,
  onWidth,
  onIsExpert,
  onConfig,
  idPrefix,
  showFixture = true,
}: Props) {
  const dimensionLabel =
    value.unitSystem === 'metric' ? 'millimeters (mm) or meters (m)' : 'inches or feet';

  return (
    <div className="space-y-6">
      {/* Unit System */}
      <div className="space-y-3">
        <Label>Measurement System</Label>
        <RadioGroup
          value={value.unitSystem}
          onValueChange={(v) => onUnitSystem(v as UnitSystem)}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="imperial" id={`${idPrefix}-imperial`} />
            <Label htmlFor={`${idPrefix}-imperial`} className="font-normal cursor-pointer">
              Imperial (ft/in)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="metric" id={`${idPrefix}-metric`} />
            <Label htmlFor={`${idPrefix}-metric`} className="font-normal cursor-pointer">
              Metric (m/mm)
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Room Dimensions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-length`}>
            Room Length <span className="text-muted-foreground text-xs">({dimensionLabel})</span>
          </Label>
          <Input
            id={`${idPrefix}-length`}
            type="number"
            placeholder={value.unitSystem === 'metric' ? '3658' : '144'}
            value={value.length}
            onChange={(e) => onLength(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-width`}>
            Room Width <span className="text-muted-foreground text-xs">({dimensionLabel})</span>
          </Label>
          <Input
            id={`${idPrefix}-width`}
            type="number"
            placeholder={value.unitSystem === 'metric' ? '2439' : '96'}
            value={value.width}
            onChange={(e) => onWidth(e.target.value)}
          />
        </div>
      </div>

      {/* Experience level */}
      <div className="space-y-3">
        <Label>Experience Level</Label>
        <RadioGroup
          value={value.isExpert ? 'expert' : 'homeowner'}
          onValueChange={(v) => onIsExpert(v === 'expert')}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="homeowner" id={`${idPrefix}-homeowner`} />
            <Label htmlFor={`${idPrefix}-homeowner`} className="font-normal cursor-pointer">
              Homeowner (Recommended defaults)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="expert" id={`${idPrefix}-expert`} />
            <Label htmlFor={`${idPrefix}-expert`} className="font-normal cursor-pointer">
              Professional (Custom values)
            </Label>
          </div>
        </RadioGroup>
      </div>

      <RoomConfigFields
        value={value.config}
        onChange={onConfig}
        unitSystem={value.unitSystem}
        showAdvanced={value.isExpert}
        showFixture={showFixture}
        idPrefix={idPrefix}
      />
    </div>
  );
}
