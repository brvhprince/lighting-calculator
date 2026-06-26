'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getProjects,
  createProject,
  deleteProject,
  updateProject,
  addRoomToProject,
  removeRoomFromProject,
  roomFromCalculation,
  projectTotals,
  importProject,
} from '@/lib/projects';
import { getSavedCalculations } from '@/lib/savedCalculations';
import { useCurrency } from '@/context/CurrencyProvider';
import { roomCostRange } from '@/lib/pricing';
import { gatherProjectReportData } from '@/lib/pdf/reportData';
import { loadLogoDataUrl } from '@/lib/pdf/brand';
import { track } from '@/lib/analytics';
import { Project } from '@/types/project';
import { SavedCalculation } from '@/types/saved-calculations';
import {
  FolderPlus,
  Trash2,
  Plus,
  Printer,
  Download,
  Upload,
  Building2,
  Share2,
  Copy,
  Check,
  X,
  FileDown,
  Loader2,
} from 'lucide-react';

export default function ProjectManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedCalculation[]>([]);
  const [newName, setNewName] = useState('');
  const [newClient, setNewClient] = useState('');
  const [roomToAdd, setRoomToAdd] = useState<string>('');
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const refresh = () => {
    const list = getProjects();
    setProjects(list);
    setActiveId((cur) => cur ?? list[0]?.id ?? null);
  };

  useEffect(() => {
    refresh();
    setSaved(getSavedCalculations().filter((c) => c.type === 'full'));
  }, []);

  const active = useMemo(
    () => projects.find((p) => p.id === activeId) ?? null,
    [projects, activeId]
  );
  const totals = useMemo(() => (active ? projectTotals(active) : null), [active]);
  const { market, format } = useCurrency();
  // Cost is computed live from the selected currency/market, not stored amounts.
  const costTotals = useMemo(() => {
    if (!active) return { low: 0, high: 0 };
    return active.rooms.reduce(
      (acc, r) => {
        const c = roomCostRange(r.fixtureItems, r.numberOfFixtures, market.code, market);
        return { low: acc.low + c.low, high: acc.high + c.high };
      },
      { low: 0, high: 0 }
    );
  }, [active, market]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const p = createProject(newName, newClient);
    setNewName('');
    setNewClient('');
    refresh();
    setActiveId(p.id);
  };

  const handleAddRoom = () => {
    if (!active || !roomToAdd) return;
    const calc = saved.find((c) => c.id === roomToAdd);
    if (!calc) return;
    const room = roomFromCalculation(calc, market.code, market);
    if (room) {
      addRoomToProject(active.id, room);
      setRoomToAdd('');
      refresh();
    }
  };

  const handleDeleteProject = (id: string) => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    deleteProject(id);
    setActiveId(null);
    refresh();
  };

  const handleExport = () => {
    if (!active) return;
    const blob = new Blob([JSON.stringify(active, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${active.name.replace(/\s+/g, '-').toLowerCase()}-pen-homes.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async () => {
    if (!active) return;
    setPdfBusy(true);
    try {
      const logoSrc = await loadLogoDataUrl();
      // react-pdf is heavy, load it (and the document) only on demand.
      const { buildProjectReportBlob } = await import('@/lib/pdf/projectReport');
      const blob = await buildProjectReportBlob(
        gatherProjectReportData({ project: active, market, logoSrc })
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `penlabs-project-${active.name.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      track('project_pdf_export', { rooms: active.rooms.length });
    } catch (e) {
      console.error('Project PDF export failed:', e);
      alert('Sorry, the project PDF could not be generated.');
    } finally {
      setPdfBusy(false);
    }
  };

  const handlePublish = async () => {
    if (!active) return;
    setPublishing(true);
    try {
      const rooms = active.rooms.map((r) => {
        const c = roomCostRange(r.fixtureItems, r.numberOfFixtures, market.code, market);
        return {
          name: r.name,
          areaDisplay: r.areaDisplay,
          areaUnit: r.areaUnit,
          numberOfFixtures: r.numberOfFixtures,
          fixtureSize: r.fixtureSize,
          totalLumens: r.totalLumens,
          costLow: c.low,
          costHigh: c.high,
        };
      });
      const tot = projectTotals(active);
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: active.shareCode,
          editKey: active.editKey,
          name: active.name,
          client: active.client,
          data: {
            currency: market.code,
            rooms,
            totals: {
              roomCount: tot.roomCount,
              totalFixtures: tot.totalFixtures,
              totalLumens: tot.totalLumens,
              costLow: costTotals.low,
              costHigh: costTotals.high,
            },
          },
        }),
      });
      const d = await res.json();
      if (res.ok && d.code) {
        updateProject({ ...active, shareCode: d.code, editKey: d.editKey });
        track('project_published', { rooms: active.rooms.length });
        refresh();
      } else {
        alert(d.error || 'Could not publish the project.');
      }
    } catch {
      alert('Network error while publishing.');
    } finally {
      setPublishing(false);
    }
  };

  const shareUrl = active?.shareCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${active.shareCode}`
    : '';

  const copyShare = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link:', shareUrl);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Project;
        if (!parsed || !Array.isArray(parsed.rooms)) throw new Error('Invalid file');
        const p = importProject(parsed);
        refresh();
        setActiveId(p.id);
      } catch {
        alert('Could not import that file, expected a Pen Homes project JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Create / import */}
      <Card className="print:hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderPlus className="h-5 w-5 text-brand-bronze" />
            New Project
          </CardTitle>
          <CardDescription>Group rooms into a whole-home or whole-building project.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[180px] flex-1 space-y-1.5">
              <Label htmlFor="pname">Project name</Label>
              <Input
                id="pname"
                value={newName}
                placeholder="e.g., John Doe Residence"
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="min-w-[160px] flex-1 space-y-1.5">
              <Label htmlFor="pclient">Client (optional)</Label>
              <Input
                id="pclient"
                value={newClient}
                placeholder="e.g., Mr. & Mrs. Doe"
                onChange={(e) => setNewClient(e.target.value)}
              />
            </div>
            <Button onClick={handleCreate} disabled={!newName.trim()} className="gap-2">
              <Plus className="h-4 w-4" /> Create
            </Button>
            <Button variant="outline" onClick={() => fileInput.current?.click()} className="gap-2">
              <Upload className="h-4 w-4" /> Import
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleImport}
            />
          </div>
        </CardContent>
      </Card>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No projects yet. Create one above, then add rooms you&apos;ve saved from the calculator.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Project selector */}
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveId(p.id)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  p.id === activeId
                    ? 'border-brand-bronze bg-accent/60'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <Building2 className="h-4 w-4" />
                <span className="font-medium">{p.name}</span>
                <span className="text-xs text-muted-foreground">{p.rooms.length} rooms</span>
              </button>
            ))}
          </div>

          {active && totals && (
            <Card className="print:border-0 print:shadow-none">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="font-display text-2xl">{active.name}</CardTitle>
                    <CardDescription>
                      {active.client ? `${active.client} · ` : ''}
                      Created {new Date(active.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2 print:hidden">
                    <Button variant="outline" size="sm" onClick={handlePublish} disabled={publishing} className="gap-1.5">
                      <Share2 className="h-4 w-4" />
                      {active.shareCode
                        ? publishing
                          ? 'Updating…'
                          : 'Update link'
                        : publishing
                        ? 'Publishing…'
                        : 'Publish'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportPdf}
                      disabled={pdfBusy || active.rooms.length === 0}
                      className="gap-1.5"
                    >
                      {pdfBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                      {pdfBusy ? 'Building…' : 'PDF'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
                      <Printer className="h-4 w-4" /> Print
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
                      <Download className="h-4 w-4" /> Export JSON
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProject(active.id)}
                      className="gap-1.5 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {shareUrl && (
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-brand-bronze/40 bg-brand-bronze/5 p-3 print:hidden">
                    <Share2 className="h-4 w-4 shrink-0 text-brand-bronze" />
                    <span className="text-sm">Public report:</span>
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-sm font-medium text-brand-bronze underline"
                    >
                      {shareUrl}
                    </a>
                    <Button variant="ghost" size="sm" onClick={copyShare} className="ml-auto gap-1.5">
                      {copied ? <Check className="h-4 w-4 text-brand-sage" /> : <Copy className="h-4 w-4" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                )}

                {/* Add room */}
                <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-muted/30 p-4 print:hidden">
                  <div className="min-w-[220px] flex-1 space-y-1.5">
                    <Label>Add a saved room</Label>
                    {saved.length ? (
                      <Select value={roomToAdd} onValueChange={setRoomToAdd}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a saved calculation" />
                        </SelectTrigger>
                        <SelectContent>
                          {saved.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.description?.trim() || c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No saved rooms yet, save a calculation from the Full Calculator first.
                      </p>
                    )}
                  </div>
                  <Button onClick={handleAddRoom} disabled={!roomToAdd} className="gap-2">
                    <Plus className="h-4 w-4" /> Add room
                  </Button>
                </div>

                {/* Rollup */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <Tile label="Rooms" value={String(totals.roomCount)} />
                  <Tile label="Total fixtures" value={String(totals.totalFixtures)} />
                  <Tile label="Total lumens" value={totals.totalLumens.toLocaleString()} />
                  <Tile
                    label="Est. material cost"
                    value={`${format(costTotals.low)}–${format(costTotals.high)}`}
                    emphasis
                  />
                </div>

                {/* Rooms table */}
                {active.rooms.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-muted-foreground">
                          <th className="py-2 pr-4 font-medium">Room</th>
                          <th className="py-2 pr-4 font-medium">Area</th>
                          <th className="py-2 pr-4 font-medium">Fixtures</th>
                          <th className="py-2 pr-4 font-medium">Lumens</th>
                          <th className="py-2 pr-4 font-medium">Est. cost</th>
                          <th className="py-2 print:hidden" />
                        </tr>
                      </thead>
                      <tbody>
                        {active.rooms.map((r) => (
                          <tr key={r.id} className="border-b border-border/60">
                            <td className="py-2 pr-4 font-medium">{r.name}</td>
                            <td className="py-2 pr-4">
                              {r.areaDisplay} {r.areaUnit}
                            </td>
                            <td className="py-2 pr-4">
                              {r.numberOfFixtures} × {r.fixtureSize}
                            </td>
                            <td className="py-2 pr-4">{r.totalLumens.toLocaleString()}</td>
                            <td className="py-2 pr-4">
                              {(() => {
                                const c = roomCostRange(r.fixtureItems, r.numberOfFixtures, market.code, market);
                                return `${format(c.low)}–${format(c.high)}`;
                              })()}
                            </td>
                            <td className="py-2 print:hidden">
                              <button
                                onClick={() => {
                                  removeRoomFromProject(active.id, r.id);
                                  refresh();
                                }}
                                className="text-muted-foreground hover:text-destructive"
                                aria-label={`Remove ${r.name}`}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No rooms in this project yet. Add saved calculations above.
                  </p>
                )}

                <p className="hidden text-center text-xs text-muted-foreground print:block">
                  Penlabs Lighting · a Pen Homes company. Project report generated{' '}
                  {new Date().toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function Tile({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        emphasis ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30'
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
