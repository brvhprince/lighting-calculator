import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getMarket, formatMoney, CurrencyCode } from '@/config/markets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Project | Report Lighting Calculator',
  robots: { index: false, follow: false },
};

type SharedRoom = {
  name: string;
  areaDisplay: number;
  areaUnit: string;
  numberOfFixtures: number;
  fixtureSize: string;
  totalLumens: number;
  costLow: number;
  costHigh: number;
};
type SharedData = {
  currency: CurrencyCode;
  rooms: SharedRoom[];
  totals: { roomCount: number; totalFixtures: number; totalLumens: number; costLow: number; costHigh: number };
};

export default async function SharedReportPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  let project: { name: string; client: string | null; updatedAt: Date; data: SharedData } | null = null;
  try {
    const row = await prisma.sharedProject.findUnique({ where: { code } });
    if (row) project = { name: row.name, client: row.client, updatedAt: row.updatedAt, data: row.data as SharedData };
  } catch {
    /* DB unreachable, handled below */
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="font-display text-2xl">Report not found</h1>
        <p className="mt-2 text-muted-foreground">
          This share link is invalid or has expired.
        </p>
      </div>
    );
  }

  const { data } = project;
  const market = getMarket(data.currency);
  const fmt = (n: number) => formatMoney(n, market);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-brand-bronze">Project Report</p>
        <h1 className="font-display text-3xl mt-1">{project.name}</h1>
        <p className="text-muted-foreground">
          {project.client ? `${project.client} · ` : ''}
          Updated {project.updatedAt.toLocaleDateString()} · Prepared by Pen Homes
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile label="Rooms" value={String(data.totals.roomCount)} />
        <Tile label="Total fixtures" value={String(data.totals.totalFixtures)} />
        <Tile label="Total lumens" value={data.totals.totalLumens.toLocaleString()} />
        <Tile label="Est. material cost" value={`${fmt(data.totals.costLow)}–${fmt(data.totals.costHigh)}`} emphasis />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rooms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Room</th>
                  <th className="py-2 pr-4 font-medium">Area</th>
                  <th className="py-2 pr-4 font-medium">Fixtures</th>
                  <th className="py-2 pr-4 font-medium">Lumens</th>
                  <th className="py-2 font-medium">Est. cost</th>
                </tr>
              </thead>
              <tbody>
                {data.rooms.map((r, i) => (
                  <tr key={i} className="border-b border-border/60">
                    <td className="py-2 pr-4 font-medium">{r.name}</td>
                    <td className="py-2 pr-4">
                      {r.areaDisplay} {r.areaUnit}
                    </td>
                    <td className="py-2 pr-4">
                      {r.numberOfFixtures} × {r.fixtureSize}
                    </td>
                    <td className="py-2 pr-4">{r.totalLumens.toLocaleString()}</td>
                    <td className="py-2">
                      {fmt(r.costLow)}–{fmt(r.costHigh)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Penlabs Lighting · a Pen Homes company · Intentional, invisible technology.
      </p>
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
