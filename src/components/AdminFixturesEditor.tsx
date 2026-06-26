'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Save, RotateCcw, Archive, ArchiveRestore, Trash2, Check, AlertTriangle } from 'lucide-react';
import { useFixtures } from '@/context/FixturesProvider';
import { FixtureCategory, FixtureDef } from '@/types';
import { CurrencyCode, MARKETS } from '@/config/markets';
import { validateFixtures, fixtureOverrides, fixtureWarnings } from '@/lib/fixtureCatalog';
import { getFixtureUsage } from '@/lib/fixtureUsage';

const CATEGORIES: FixtureCategory[] = [
  'recessed',
  'flush',
  'pendant',
  'track',
  'linear',
  'undercabinet',
  'sconce',
  'vanity',
  'lamp',
  'strip',
];
const CURRENCIES = Object.keys(MARKETS) as CurrencyCode[];

function newFixture(): FixtureDef {
  return {
    id: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: 'New fixture',
    category: 'recessed',
    typicalLumens: { min: 400, max: 800, recommended: 600 },
    price: Object.fromEntries(CURRENCIES.map((c) => [c, 0])) as FixtureDef['price'],
    builtIn: false,
  };
}

export default function AdminFixturesEditor() {
  const { catalog, setOverrideItems, resetOverrides } = useFixtures();
  const [items, setItems] = useState<FixtureDef[]>(() => catalog.map((f) => ({ ...f })));
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const patch = (id: string, change: Partial<FixtureDef>) =>
    setItems((prev) => prev.map((f) => (f.id === id ? { ...f, ...change } : f)));

  const setPrice = (id: string, currency: CurrencyCode, value: number) =>
    setItems((prev) =>
      prev.map((f) => (f.id === id ? { ...f, price: { ...f.price, [currency]: value } } : f))
    );

  const setWattage = (id: string, value: number) =>
    setItems((prev) =>
      prev.map((f) => (f.id === id ? { ...f, wattage: value > 0 ? value : undefined } : f))
    );

  const setLumens = (id: string, recommended: number) =>
    setItems((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              typicalLumens: {
                recommended,
                min: Math.min(f.typicalLumens.min, recommended),
                max: Math.max(f.typicalLumens.max, recommended),
              },
            }
          : f
      )
    );

  const addFixture = () => setItems((prev) => [newFixture(), ...prev]);

  const toggleArchive = (f: FixtureDef) => {
    if (!f.archived) {
      const usage = getFixtureUsage(f.id);
      if (
        usage.total > 0 &&
        !confirm(
          `"${f.name}" is used in ${usage.total} saved item(s) on this browser. Archive it? ` +
            `Existing designs keep working; it just won't appear in pickers.`
        )
      )
        return;
    }
    patch(f.id, { archived: !f.archived });
  };

  const remove = (f: FixtureDef) => {
    if (f.builtIn) {
      alert('Built-in fixtures cannot be deleted. Archive them instead.');
      return;
    }
    if (!f.archived) {
      alert('Archive the fixture first, then delete it permanently.');
      return;
    }
    const usage = getFixtureUsage(f.id);
    const warn =
      usage.total > 0
        ? `\n\nWARNING: used in ${usage.total} saved item(s) on this browser. They will fall back to a snapshot/"discontinued" label.`
        : '';
    if (!confirm(`Permanently delete "${f.name}"?${warn}`)) return;
    setItems((prev) => prev.filter((x) => x.id !== f.id));
  };

  const persist = async (override: FixtureDef[]): Promise<boolean> => {
    const token = sessionStorage.getItem('pen-admin-token');
    const res = await fetch('/api/admin/fixtures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
      body: JSON.stringify({ fixtures: { items: override } }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setStatus({ kind: 'error', msg: data?.error || `Save failed (HTTP ${res.status}).` });
      return false;
    }
    return true;
  };

  const save = async () => {
    // Guard: keep at least one selectable recessed fixture (auto-select needs it).
    const liveRecessed = items.filter((f) => f.category === 'recessed' && !f.archived);
    if (liveRecessed.length === 0) {
      setStatus({ kind: 'error', msg: 'Keep at least one active recessed fixture (auto-select needs it).' });
      return;
    }
    const override = fixtureOverrides(items);
    const err = validateFixtures({ items: override });
    if (err) {
      setStatus({ kind: 'error', msg: err });
      return;
    }
    setSaving(true);
    const ok = await persist(override);
    setSaving(false);
    if (ok) {
      setOverrideItems(override);
      setStatus({
        kind: 'ok',
        msg: override.length
          ? `Saved ${override.length} fixture override(s). Live for everyone.`
          : 'No changes from built-in defaults. Saved as defaults.',
      });
    }
  };

  const reset = async () => {
    if (!confirm('Reset the whole catalogue to built-in defaults?')) return;
    setSaving(true);
    const ok = await persist([]);
    setSaving(false);
    if (ok) {
      resetOverrides();
      setItems(catalog.filter((f) => f.builtIn).map((f) => ({ ...f })));
      setStatus({ kind: 'ok', msg: 'Reset to built-in defaults.' });
    }
  };

  const warnings = fixtureWarnings(items);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fixtures &amp; prices</CardTitle>
        <CardDescription>
          Add, edit, archive or remove fixtures and their per-currency prices. Changes are saved to
          the database and go live for everyone. Archiving keeps existing designs working.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={addFixture} variant="outline" size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Add fixture
          </Button>
          <Button onClick={save} size="sm" className="gap-1" disabled={saving}>
            <Save className="h-4 w-4" /> Save
          </Button>
          <Button onClick={reset} variant="outline" size="sm" className="gap-1" disabled={saving}>
            <RotateCcw className="h-4 w-4" /> Reset to defaults
          </Button>
        </div>

        {status && (
          <p
            className={`flex items-center gap-2 rounded-md border p-2 text-sm ${
              status.kind === 'ok'
                ? 'border-brand-sage/40 bg-brand-sage/10 text-brand-sage'
                : 'border-destructive/40 bg-destructive/10 text-destructive'
            }`}
          >
            {status.kind === 'ok' ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {status.msg}
          </p>
        )}

        {warnings.length > 0 && (
          <div className="rounded-md border border-brand-bronze/40 bg-brand-bronze/10 p-2 text-sm text-brand-bronze">
            <p className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4" /> Efficacy check (won&apos;t block saving)
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-6 text-xs">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3">Lumens</th>
                <th className="py-2 pr-3">Watts</th>
                {CURRENCIES.map((c) => (
                  <th key={c} className="py-2 pr-3">
                    {c}
                  </th>
                ))}
                <th className="py-2 pr-3">Status</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((f) => (
                <tr key={f.id} className={`border-b ${f.archived ? 'opacity-50' : ''}`}>
                  <td className="py-2 pr-3">
                    <Input
                      value={f.name}
                      onChange={(e) => patch(f.id, { name: e.target.value })}
                      className="h-8 min-w-[9rem]"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <Select
                      value={f.category}
                      onValueChange={(v) => patch(f.id, { category: v as FixtureCategory })}
                    >
                      <SelectTrigger className="h-8 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-2 pr-3">
                    <Input
                      type="number"
                      min={0}
                      value={f.typicalLumens.recommended}
                      onChange={(e) => setLumens(f.id, Math.max(0, parseInt(e.target.value) || 0))}
                      className="h-8 w-24"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <Input
                      type="number"
                      min={0}
                      value={f.wattage ?? ''}
                      placeholder="-"
                      onChange={(e) => setWattage(f.id, Math.max(0, parseFloat(e.target.value) || 0))}
                      className="h-8 w-20"
                    />
                  </td>
                  {CURRENCIES.map((c) => (
                    <td key={c} className="py-2 pr-3">
                      <Input
                        type="number"
                        min={0}
                        value={f.price[c] ?? 0}
                        onChange={(e) => setPrice(f.id, c, Math.max(0, parseFloat(e.target.value) || 0))}
                        className="h-8 w-24"
                      />
                    </td>
                  ))}
                  <td className="py-2 pr-3 text-xs text-muted-foreground">
                    {f.builtIn ? 'Built-in' : 'Custom'}
                    {f.archived && <span className="block text-brand-bronze">Archived</span>}
                  </td>
                  <td className="py-2">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title={f.archived ? 'Restore' : 'Archive'}
                        onClick={() => toggleArchive(f)}
                      >
                        {f.archived ? (
                          <ArchiveRestore className="h-4 w-4" />
                        ) : (
                          <Archive className="h-4 w-4" />
                        )}
                      </Button>
                      {!f.builtIn && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          title="Delete permanently"
                          onClick={() => remove(f)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
