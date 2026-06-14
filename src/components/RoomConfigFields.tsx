'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROOM_TYPES } from '@/lib/roomTypes';
import { getActiveFixtures } from '@/lib/fixtureCatalog';
import { NaturalLightLevel, UnitSystem, RoomConfigValue, FixtureCategory } from '@/types';

const FIXTURE_CATEGORY_LABELS: Record<FixtureCategory, string> = {
  recessed: 'Recessed downlights',
  pendant: 'Pendants',
  track: 'Track',
  linear: 'Linear / surface',
  sconce: 'Wall sconces',
  strip: 'LED strip',
};
const FIXTURE_CATEGORY_ORDER: FixtureCategory[] = ['recessed', 'pendant', 'track', 'linear', 'sconce', 'strip'];
import { ArrowUpDown } from 'lucide-react';

export type { RoomConfigValue };

export function defaultRoomConfig(overrides: Partial<RoomConfigValue> = {}): RoomConfigValue {
  return {
    roomType: '',
    customRoomName: '',
    customRoomLumens: '',
    ceilingFt: 8,
    sloped: false,
    ceilingPeakFt: 0,
    naturalLight: 'none',
    fixtureSize: '',
    customFixtureLumens: '',
    customLumensPerSqFt: '',
    targetLux: '',
    ...overrides,
  };
}

const FT_TO_M = 0.3048;

type Props = {
  value: RoomConfigValue;
  onChange: (patch: Partial<RoomConfigValue>) => void;
  unitSystem: UnitSystem;
  showAdvanced?: boolean; // expert overrides (custom lumens / fixture lumens)
  showFixture?: boolean; // show the fixture-size selector (default true)
  allowCustomRoom?: boolean; // offer the "Other (custom)" room type (default true)
  idPrefix?: string;
};

export function RoomConfigFields({
  value,
  onChange,
  unitSystem,
  showAdvanced = false,
  showFixture = true,
  allowCustomRoom = true,
  idPrefix = 'cfg',
}: Props) {
  const heightLabel = unitSystem === 'metric' ? 'm' : 'ft';
  const toDisp = (ft: number) => (unitSystem === 'metric' ? ft * FT_TO_M : ft);
  const fromDisp = (v: number) => (unitSystem === 'metric' ? v / FT_TO_M : v);

  const id = (s: string) => `${idPrefix}-${s}`;

  return (
    <div className="space-y-5">
      {/* Room type */}
      <div className="space-y-2">
        <Label htmlFor={id('room')}>Room Type</Label>
        <Select value={value.roomType} onValueChange={(v) => onChange({ roomType: v })}>
          <SelectTrigger id={id('room')}>
            <SelectValue placeholder="Select room type" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ROOM_TYPES).map(([key, room]) => (
              <SelectItem key={key} value={key}>
                {room.name} ({room.lumensPerSqFt.recommended} lumens/ft²)
              </SelectItem>
            ))}
            {allowCustomRoom && <SelectItem value="other">Other (Custom)</SelectItem>}
          </SelectContent>
        </Select>
        {value.roomType && value.roomType !== 'other' && (
          <p className="text-sm text-muted-foreground">{ROOM_TYPES[value.roomType]?.description}</p>
        )}
      </div>

      {/* Custom room */}
      {value.roomType === 'other' && (
        <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
          <h4 className="text-sm font-semibold">Custom Room Type</h4>
          <div className="space-y-2">
            <Label htmlFor={id('room-name')}>Room Name</Label>
            <Input
              id={id('room-name')}
              placeholder="e.g., Sunroom, Workshop, Studio"
              value={value.customRoomName}
              onChange={(e) => onChange({ customRoomName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={id('room-lumens')}>Lumens per Square Foot</Label>
            <Input
              id={id('room-lumens')}
              type="number"
              placeholder="e.g., 30"
              value={value.customRoomLumens}
              onChange={(e) => onChange({ customRoomLumens: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Typical range: 10–80 lumens/ft² depending on room purpose.
            </p>
          </div>
        </div>
      )}

      {/* Ceiling */}
      <div className="space-y-2">
        <Label htmlFor={id('ceiling')} className="flex items-center gap-1.5">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          Ceiling Height <span className="text-muted-foreground text-xs">({heightLabel})</span>
        </Label>
        <Input
          id={id('ceiling')}
          type="number"
          step="0.5"
          value={Number(toDisp(value.ceilingFt).toFixed(2))}
          onChange={(e) => onChange({ ceilingFt: Math.max(0, fromDisp(parseFloat(e.target.value) || 0)) })}
        />
      </div>

      {/* Sloped */}
      <div className="space-y-3">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-input accent-[hsl(var(--brand-bronze))]"
            checked={value.sloped}
            onChange={(e) => onChange({ sloped: e.target.checked })}
          />
          <span className="text-sm font-medium">Sloped / vaulted ceiling</span>
        </label>
        {value.sloped && (
          <div className="space-y-2 pl-6">
            <Label htmlFor={id('peak')}>
              Peak Height <span className="text-muted-foreground text-xs">({heightLabel})</span>
            </Label>
            <Input
              id={id('peak')}
              type="number"
              step="0.5"
              placeholder={unitSystem === 'metric' ? '3.6' : '12'}
              value={value.ceilingPeakFt ? Number(toDisp(value.ceilingPeakFt).toFixed(2)) : ''}
              onChange={(e) =>
                onChange({ ceilingPeakFt: Math.max(0, fromDisp(parseFloat(e.target.value) || 0)) })
              }
            />
            <p className="text-xs text-muted-foreground">
              We design to the average of the wall height and this peak.
            </p>
          </div>
        )}
      </div>

      {/* Natural light */}
      <div className="space-y-2">
        <Label htmlFor={id('natural')}>Natural Light</Label>
        <Select
          value={value.naturalLight}
          onValueChange={(v) => onChange({ naturalLight: v as NaturalLightLevel })}
        >
          <SelectTrigger id={id('natural')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No / minimal windows</SelectItem>
            <SelectItem value="some">Some daylight (standard windows)</SelectItem>
            <SelectItem value="ample">Ample daylight (large windows / skylights)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Daylight offsets artificial lighting needs by up to 20%.
        </p>
      </div>

      {/* Fixture */}
      {showFixture && (
        <div className="space-y-2">
          <Label htmlFor={id('fixture')}>Fixture Size</Label>
          <Select
            value={value.fixtureSize || 'auto'}
            onValueChange={(v) => onChange({ fixtureSize: v === 'auto' ? '' : v })}
          >
            <SelectTrigger id={id('fixture')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto-select (recessed)</SelectItem>
              {FIXTURE_CATEGORY_ORDER.map((cat) => {
                const items = getActiveFixtures().filter((f) => f.category === cat);
                if (!items.length) return null;
                return (
                  <SelectGroup key={cat}>
                    <SelectLabel>{FIXTURE_CATEGORY_LABELS[cat]}</SelectLabel>
                    {items.map((fixture) => (
                      <SelectItem key={fixture.id} value={fixture.id}>
                        {fixture.name} ({fixture.typicalLumens.recommended} lm)
                      </SelectItem>
                    ))}
                  </SelectGroup>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Advanced overrides */}
      {showAdvanced && (
        <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
          <h4 className="text-sm font-semibold">Professional Overrides</h4>
          <div className="space-y-2">
            <Label htmlFor={id('lux')}>Target Illuminance (lux, optional)</Label>
            <Input
              id={id('lux')}
              type="number"
              placeholder="e.g., 300"
              value={value.targetLux}
              onChange={(e) => onChange({ targetLux: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              IES targets — living ≈100–150, bedroom ≈150, kitchen/bath ≈300–500, office ≈500.
              {value.targetLux && parseFloat(value.targetLux) > 0
                ? ` ≈ ${(parseFloat(value.targetLux) / 10.7639).toFixed(1)} lm/ft². Overrides the preset.`
                : ' Overrides the room preset when set.'}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor={id('lumens-override')}>Custom Lumens per Square Foot (optional)</Label>
            <Input
              id={id('lumens-override')}
              type="number"
              placeholder="e.g., 35"
              value={value.customLumensPerSqFt}
              onChange={(e) => onChange({ customLumensPerSqFt: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={id('fixture-lumens')}>Fixture Lumen Rating (optional)</Label>
            <Input
              id={id('fixture-lumens')}
              type="number"
              placeholder="e.g., 800"
              value={value.customFixtureLumens}
              onChange={(e) => onChange({ customFixtureLumens: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Enter the exact lumen rating of your fixtures if known.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
