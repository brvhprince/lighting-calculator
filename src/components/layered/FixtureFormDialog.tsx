'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Save, Check } from 'lucide-react';
import { FixtureCategory } from '@/types';
import { FIXTURE_CATEGORIES, EFFICACY_BAND } from '@/lib/fixtureCatalog';

// Where a fixture created/edited here should live.
//   design   = just this design (a derived/one-off fixture)
//   personal = saved to the reusable personal catalogue
export type FixtureScope = 'design' | 'personal';

export type FixtureDraft = {
  name: string;
  category: FixtureCategory;
  lumens: number;
  price: number;
  wattage?: number;
};

const CATEGORY_LABELS: Record<FixtureCategory, string> = {
  recessed: 'Recessed downlight',
  flush: 'Flush / semi-flush ceiling',
  pendant: 'Pendant',
  track: 'Track head',
  linear: 'Linear / batten',
  undercabinet: 'Under-cabinet / cove',
  sconce: 'Wall sconce',
  vanity: 'Vanity / mirror light',
  lamp: 'Table / floor lamp',
  strip: 'LED strip',
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  initial?: Partial<FixtureDraft>;
  // Keep the category fixed (editing an existing catalogue fixture).
  lockCategory?: boolean;
  currencySymbol: string;
  // Labels for the two submit actions.
  submitLabels: { design: string; personal: string };
  onSubmit: (draft: FixtureDraft, scope: FixtureScope) => void;
};

export function FixtureFormDialog({
  open,
  onOpenChange,
  title,
  description,
  initial,
  lockCategory,
  currencySymbol,
  submitLabels,
  onSubmit,
}: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<FixtureCategory>('recessed');
  const [lumens, setLumens] = useState('');
  const [price, setPrice] = useState('');
  const [wattage, setWattage] = useState('');

  // Reset the form from `initial` each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setCategory(initial?.category ?? 'recessed');
    setLumens(initial?.lumens != null ? String(initial.lumens) : '');
    setPrice(initial?.price != null ? String(initial.price) : '');
    setWattage(initial?.wattage != null ? String(initial.wattage) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const lumensNum = parseFloat(lumens);
  const priceNum = parseFloat(price);
  const wattageNum = wattage.trim() ? parseFloat(wattage) : undefined;

  const error = useMemo(() => {
    if (!name.trim()) return 'Give the fixture a name.';
    if (!isFinite(lumensNum) || lumensNum <= 0) return 'Lumens must be a positive number.';
    if (!isFinite(priceNum) || priceNum < 0) return 'Price must be zero or more.';
    if (wattageNum !== undefined && (!isFinite(wattageNum) || wattageNum <= 0))
      return 'Wattage must be a positive number when set.';
    return null;
  }, [name, lumensNum, priceNum, wattageNum]);

  // Non-blocking efficacy sanity check (lumens per watt), mirrors fixtureWarnings.
  const efficacyWarning = useMemo(() => {
    if (wattageNum === undefined || !isFinite(lumensNum) || lumensNum <= 0) return null;
    const eff = lumensNum / wattageNum;
    if (eff < EFFICACY_BAND.low)
      return `${Math.round(eff)} lm/W is unusually low (under ${EFFICACY_BAND.low}). Check the wattage or lumens.`;
    if (eff > EFFICACY_BAND.high)
      return `${Math.round(eff)} lm/W is unusually high (over ${EFFICACY_BAND.high}). Verify the lumens or wattage.`;
    return null;
  }, [lumensNum, wattageNum]);

  const submit = (scope: FixtureScope) => {
    if (error) return;
    onSubmit(
      { name: name.trim(), category, lumens: lumensNum, price: priceNum, wattage: wattageNum },
      scope
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="fx-name">Name</Label>
            <Input
              id="fx-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Garage table lamp"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fx-category">Type</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as FixtureCategory)}
              disabled={lockCategory}
            >
              <SelectTrigger id="fx-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIXTURE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {lockCategory && (
              <p className="text-xs text-muted-foreground">
                Type stays the same when editing an existing fixture.
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fx-lumens">Lumens</Label>
              <Input
                id="fx-lumens"
                type="number"
                min={0}
                value={lumens}
                onChange={(e) => setLumens(e.target.value)}
                placeholder="e.g. 450"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fx-price">Price ({currencySymbol})</Label>
              <Input
                id="fx-price"
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fx-wattage">Watts</Label>
              <Input
                id="fx-wattage"
                type="number"
                min={0}
                value={wattage}
                onChange={(e) => setWattage(e.target.value)}
                placeholder="opt."
              />
            </div>
          </div>

          {efficacyWarning && !error && (
            <p className="flex items-start gap-1.5 text-xs text-brand-bronze">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {efficacyWarning}
            </p>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => submit('design')} disabled={!!error} className="gap-1.5">
            <Check className="h-4 w-4" />
            {submitLabels.design}
          </Button>
          <Button onClick={() => submit('personal')} disabled={!!error} className="gap-1.5">
            <Save className="h-4 w-4" />
            {submitLabels.personal}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
