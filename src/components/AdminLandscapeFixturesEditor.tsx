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
import { FixturePrice } from '@/types';
import { LandscapeCategory, LandscapeFixture, LandscapeSystem } from '@/types/landscape';
import { CurrencyCode, MARKETS } from '@/config/markets';
import {
  LANDSCAPE_CATEGORIES,
  LANDSCAPE_SYSTEMS,
  landscapeOverrides,
  validateLandscapeFixtures,
} from '@/lib/landscape/fixtures';

const CURRENCIES = Object.keys(MARKETS) as CurrencyCode[];

function newFixture(): LandscapeFixture {
  return {
    id: `lscustom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: 'New outdoor fixture',
    category: 'spotlight',
    system: 'lowvoltage',
    ip: 'IP65',
    typicalLumens: { min: 200, max: 500, recommended: 350 },
    wattage: 6,
    cct: 2700,
    beam: '24°',
    price: Object.fromEntries(CURRENCIES.map((c) => [c, 0])) as FixturePrice,
  };
}

export default function AdminLandscapeFixturesEditor() {
  const { landscapeCatalog, setLandscapeOverrideItems, resetLandscapeOverrides } = useFixtures();
  const [items, setItems] = useState<LandscapeFixture[]>(() => landscapeCatalog.map((f) => ({ ...f })));
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const patch = (id: string, change: Partial<LandscapeFixture>) =>
    setItems((prev) => prev.map((f) => (f.id === id ? { ...f, ...change } : f)));

  const setPrice = (id: string, currency: CurrencyCode, value: number) =>
    setItems((prev) =>
      prev.map((f) => (f.id === id ? { ...f, price: { ...f.price, [currency]: value } } : f))
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

  const toggleArchive = (f: LandscapeFixture) => patch(f.id, { archived: !f.archived });

  const remove = (f: LandscapeFixture) => {
    if (f.builtIn) {
      alert('Built-in fixtures cannot be deleted. Archive them instead.');
      return;
    }
    if (!confirm(`Permanently delete "${f.name}"?`)) return;
    setItems((prev) => prev.filter((x) => x.id !== f.id));
  };

  const persist = async (override: LandscapeFixture[]): Promise<boolean> => {
    const token = sessionStorage.getItem('pen-admin-token');
    const res = await fetch('/api/admin/landscape-fixtures', {
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
    const override = landscapeOverrides(items);
    const err = validateLandscapeFixtures({ items: override });
    if (err) {
      setStatus({ kind: 'error', msg: err });
      return;
    }
    setSaving(true);
    const ok = await persist(override);
    setSaving(false);
    if (ok) {
      setLandscapeOverrideItems(override);
      setStatus({
        kind: 'ok',
        msg: override.length
          ? `Saved ${override.length} outdoor fixture override(s). Live for everyone.`
          : 'No changes from built-in defaults. Saved as defaults.',
      });
    }
  };

  const reset = async () => {
    if (!confirm('Reset the outdoor catalogue to built-in defaults?')) return;
    setSaving(true);
    const ok = await persist([]);
    setSaving(false);
    if (ok) {
      resetLandscapeOverrides();
      setItems(landscapeCatalog.filter((f) => f.builtIn).map((f) => ({ ...f })));
      setStatus({ kind: 'ok', msg: 'Reset to built-in defaults.' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Landscape fixtures &amp; prices</CardTitle>
        <CardDescription>
          Outdoor fixtures used by the landscape estimator. Add, edit, archive or remove them and
          their per-currency prices. Changes save to the database and go live for everyone.
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

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3">System</th>
                <th className="py-2 pr-3">IP</th>
                <th className="py-2 pr-3">CCT</th>
                <th className="py-2 pr-3">Watts</th>
                <th className="py-2 pr-3">Lumens</th>
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
                    <Input value={f.name} onChange={(e) => patch(f.id, { name: e.target.value })} className="h-8 min-w-[10rem]" />
                  </td>
                  <td className="py-2 pr-3">
                    <Select value={f.category} onValueChange={(v) => patch(f.id, { category: v as LandscapeCategory })}>
                      <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LANDSCAPE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-2 pr-3">
                    <Select value={f.system} onValueChange={(v) => patch(f.id, { system: v as LandscapeSystem | 'any' })}>
                      <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LANDSCAPE_SYSTEMS.map((sys) => (
                          <SelectItem key={sys} value={sys}>{sys}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-2 pr-3">
                    <Input value={f.ip} onChange={(e) => patch(f.id, { ip: e.target.value })} className="h-8 w-20" />
                  </td>
                  <td className="py-2 pr-3">
                    <Input type="number" min={0} value={f.cct} onChange={(e) => patch(f.id, { cct: Math.max(0, parseInt(e.target.value) || 0) })} className="h-8 w-20" />
                  </td>
                  <td className="py-2 pr-3">
                    <Input type="number" min={0} value={f.wattage} onChange={(e) => patch(f.id, { wattage: Math.max(0, parseFloat(e.target.value) || 0) })} className="h-8 w-16" />
                  </td>
                  <td className="py-2 pr-3">
                    <Input type="number" min={0} value={f.typicalLumens.recommended} onChange={(e) => setLumens(f.id, Math.max(0, parseInt(e.target.value) || 0))} className="h-8 w-24" />
                  </td>
                  {CURRENCIES.map((c) => (
                    <td key={c} className="py-2 pr-3">
                      <Input type="number" min={0} value={f.price[c] ?? 0} onChange={(e) => setPrice(f.id, c, Math.max(0, parseFloat(e.target.value) || 0))} className="h-8 w-24" />
                    </td>
                  ))}
                  <td className="py-2 pr-3 text-xs text-muted-foreground">
                    {f.builtIn ? 'Built-in' : 'Custom'}
                    {f.archived && <span className="block text-brand-bronze">Archived</span>}
                  </td>
                  <td className="py-2">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" title={f.archived ? 'Restore' : 'Archive'} onClick={() => toggleArchive(f)}>
                        {f.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                      </Button>
                      {!f.builtIn && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="Delete permanently" onClick={() => remove(f)}>
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
