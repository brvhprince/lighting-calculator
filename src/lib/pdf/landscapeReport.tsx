import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Svg,
  Rect,
  Circle,
  Polyline,
  Polygon,
  pdf,
} from '@react-pdf/renderer';
import { Market, formatMoneyAscii } from '@/config/markets';
import type { Point } from '@/lib/geometry';
import type { LandscapeResult } from '@/lib/landscape/engine';

export type LandscapePlanData = {
  widthFt: number;
  depthFt: number;
  shapes: { kind: 'point' | 'line' | 'area'; points: Point[] }[];
  transformer?: Point | null;
  anchors: Point[];
  cable: Point[]; // ordered chain (transformer first), when present
  vd?: { gauge: number; worstDropPct: number; minVoltage: number; ok: boolean } | null;
};

export type LandscapeReportData = {
  date: string;
  market: Market;
  systemLabel: string;
  result: LandscapeResult;
  logoSrc?: string;
  plan?: LandscapePlanData;
};

const C = {
  basalt: '#2C332E',
  bone: '#F5F2ED',
  linen: '#F2EFE9',
  bronze: '#A68966',
  sage: '#8A9682',
  text: '#2C332E',
  muted: '#6B6F6A',
  border: '#DAD5CC',
};

const s = StyleSheet.create({
  page: { backgroundColor: '#FFFFFF', color: C.text, fontSize: 10, fontFamily: 'Helvetica', paddingBottom: 56 },
  header: { backgroundColor: C.basalt, color: C.bone, padding: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 30, height: 30, marginRight: 10 },
  mark: { width: 30, height: 30, borderRadius: 6, backgroundColor: C.bronze, color: C.bone, fontFamily: 'Times-Bold', fontSize: 18, textAlign: 'center', paddingTop: 5, marginRight: 10 },
  brandName: { fontFamily: 'Times-Roman', fontSize: 16, color: C.bone },
  brandSub: { fontSize: 7, letterSpacing: 2, color: C.sage, textTransform: 'uppercase', marginTop: 2 },
  metaLabel: { fontSize: 7, letterSpacing: 1.5, color: C.sage, textTransform: 'uppercase', textAlign: 'right' },
  metaValue: { fontSize: 11, color: C.bone, textAlign: 'right', marginTop: 2 },
  body: { padding: 28 },
  h2: { fontFamily: 'Times-Roman', fontSize: 13, color: C.basalt, marginBottom: 8, marginTop: 18 },
  kicker: { fontSize: 7, letterSpacing: 2, color: C.bronze, textTransform: 'uppercase' },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  stat: { width: '25%', padding: 4 },
  statBox: { borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 10, backgroundColor: C.linen, height: 62 },
  statLabel: { fontSize: 7, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontFamily: 'Times-Roman', fontSize: 15, color: C.basalt, marginTop: 4 },
  statUnit: { fontSize: 8, color: C.muted },
  tHead: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.basalt, paddingBottom: 4, marginBottom: 2 },
  tRow: { flexDirection: 'row', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: C.border },
  th: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  td: { fontSize: 9 },
  tdBold: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  small: { fontSize: 8, color: C.muted },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: C.border },
  rowLabel: { color: C.muted },
  rowValue: { fontFamily: 'Helvetica-Bold' },
  bullet: { flexDirection: 'row', marginBottom: 3 },
  bulletDot: { color: C.bronze, marginRight: 5 },
  bulletText: { flex: 1, fontSize: 9 },
  footer: { position: 'absolute', bottom: 20, left: 28, right: 28, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: C.muted },
});

const SCHED = { feature: 2.6, fixture: 2.6, qty: 0.7, lm: 1.1, cost: 2.0 };
const BOMC = { name: 3, qty: 0.8, unit: 1.4, sub: 1.6 };

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={s.stat}>
      <View style={s.statBox}>
        <Text style={s.statLabel}>{label}</Text>
        <Text style={s.statValue}>{value}</Text>
        {unit ? <Text style={s.statUnit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

function PlanSvg({ plan }: { plan: LandscapePlanData }) {
  const W = 380;
  const H = 240;
  const pad = 10;
  const scale = Math.min((W - pad * 2) / plan.widthFt, (H - pad * 2) / plan.depthFt);
  const ox = (W - plan.widthFt * scale) / 2;
  const oy = (H - plan.depthFt * scale) / 2;
  const m = (p: Point) => ({ x: ox + p.x * scale, y: oy + p.y * scale });
  const ptsStr = (pts: Point[]) => pts.map(m).map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const tx = plan.transformer ? m(plan.transformer) : null;
  return (
    <Svg width={W} height={H}>
      <Rect x={ox} y={oy} width={plan.widthFt * scale} height={plan.depthFt * scale} fill="rgba(138,150,130,0.10)" stroke="#8A9682" strokeWidth={1} />
      {plan.cable.length > 1 && (
        <Polyline points={ptsStr(plan.cable)} fill="none" stroke="#A68966" strokeWidth={0.7} strokeDasharray="3 2" />
      )}
      {plan.shapes.map((sh, i) => {
        if (sh.kind === 'point') {
          const s = m(sh.points[0]);
          return <Circle key={i} cx={s.x} cy={s.y} r={2.6} fill="#A68966" />;
        }
        if (sh.kind === 'area') {
          return <Polygon key={i} points={ptsStr(sh.points)} fill="rgba(166,137,102,0.15)" stroke="#A68966" strokeWidth={1.2} />;
        }
        return <Polyline key={i} points={ptsStr(sh.points)} fill="none" stroke="#A68966" strokeWidth={1.5} />;
      })}
      {tx && <Rect x={tx.x - 3.5} y={tx.y - 3.5} width={7} height={7} fill="#2C332E" stroke="#A68966" strokeWidth={1} />}
    </Svg>
  );
}

function LandscapeReport(d: LandscapeReportData) {
  const { result, market } = d;
  const money = (n: number) => formatMoneyAscii(n, market);
  const range = (lo: number, hi: number) => `${money(lo)} – ${money(hi)}`;
  const solar = result.system === 'solar';

  return (
    <Document title="Penlabs Landscape Plan" author="Pen Homes" subject="Landscape lighting plan">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.brandRow}>
            {d.logoSrc ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={d.logoSrc} style={s.logo} />
            ) : (
              <Text style={s.mark}>P</Text>
            )}
            <View>
              <Text style={s.brandName}>Penlabs Lighting</Text>
              <Text style={s.brandSub}>by Pen Homes</Text>
            </View>
          </View>
          <View>
            <Text style={s.metaLabel}>Landscape Plan</Text>
            <Text style={s.metaValue}>{d.systemLabel}</Text>
            <Text style={[s.metaLabel, { marginTop: 4 }]}>{d.date} · {market.code}</Text>
          </View>
        </View>

        <View style={s.body}>
          <Text style={s.kicker}>Summary</Text>
          <Text style={s.h2}>Scheme overview</Text>
          <View style={s.statRow}>
            <Stat label="Fixtures" value={String(result.totalFixtures)} />
            <Stat label="Total output" value={result.totalLumens.toLocaleString()} unit="lm" />
            <Stat label={solar ? 'Power' : 'Total load'} value={solar ? 'Solar' : `${result.totalWatts}`} unit={solar ? 'no grid' : 'W'} />
            <Stat label="Material" value={money(result.materialLow)} unit={`to ${money(result.materialHigh)}`} />
          </View>

          {/* Engineering */}
          <Text style={s.h2}>System &amp; engineering</Text>
          {result.system === 'lowvoltage' && result.transformer ? (
            <>
              <Row
                label="Transformer"
                value={`${result.transformer.count > 1 ? `${result.transformer.count} × ` : ''}${result.transformer.sizeVA} VA (${result.transformer.headroomPct}% headroom)`}
              />
              <Row label="Cable (estimate)" value={`~${result.cableMeters} m · ${money(result.cablePrice ?? 0)}`} />
              <Row label="Running cost" value={`${money(result.annualEnergyCost)}/yr`} />
            </>
          ) : null}
          {result.system === 'linevoltage' ? (
            <>
              <Row label="Circuits" value={String(result.circuits ?? 1)} />
              <Row label="Total load" value={`${result.totalWatts} W`} />
              <Row label="Running cost" value={`${money(result.annualEnergyCost)}/yr`} />
            </>
          ) : null}
          {solar ? (
            <>
              <Row label="Wiring" value="None (self-powered)" />
              <Row label="Running cost" value={`${money(0)}/yr`} />
            </>
          ) : null}
          {!solar ? (
            <>
              <Row label="Labour (finish)" value={money(result.install)} />
              <Row label="Installed total" value={range(result.installedLow, result.installedHigh)} />
            </>
          ) : null}

          {/* Site plan */}
          {d.plan ? (
            <>
              <Text style={s.h2}>Site plan</Text>
              <View style={{ alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 8, backgroundColor: C.linen }}>
                <PlanSvg plan={d.plan} />
              </View>
              {d.plan.vd ? (
                <View style={{ marginTop: 6 }}>
                  <Row
                    label={`Voltage drop (${d.plan.vd.gauge} AWG)`}
                    value={`${d.plan.vd.worstDropPct}% · min ${d.plan.vd.minVoltage} V${d.plan.vd.ok ? '' : ' (over 10%)'}`}
                  />
                </View>
              ) : null}
            </>
          ) : null}

          {/* Schedule */}
          <Text style={s.h2}>Fixture schedule</Text>
          <View style={s.tHead}>
            <Text style={[s.th, { flex: SCHED.feature }]}>Feature</Text>
            <Text style={[s.th, { flex: SCHED.fixture }]}>Fixture</Text>
            <Text style={[s.th, { flex: SCHED.qty, textAlign: 'right' }]}>Qty</Text>
            <Text style={[s.th, { flex: SCHED.lm, textAlign: 'right' }]}>Lumens</Text>
            <Text style={[s.th, { flex: SCHED.cost, textAlign: 'right' }]}>Est. cost</Text>
          </View>
          {result.lines.map((l, i) => (
            <View key={i} style={s.tRow} wrap={false}>
              <Text style={[s.td, { flex: SCHED.feature }]}>
                {l.techniqueName}{l.label ? ` · ${l.label}` : ''}
              </Text>
              <Text style={[s.td, { flex: SCHED.fixture }]}>
                {l.fixture.name} ({l.fixture.cct}K, {l.fixture.ip})
              </Text>
              <Text style={[s.td, { flex: SCHED.qty, textAlign: 'right' }]}>{l.quantity}</Text>
              <Text style={[s.td, { flex: SCHED.lm, textAlign: 'right' }]}>{l.lumensEach.toLocaleString()}</Text>
              <Text style={[s.td, { flex: SCHED.cost, textAlign: 'right' }]}>{range(l.costLow, l.costHigh)}</Text>
            </View>
          ))}

          {/* Bill of materials */}
          <Text style={s.h2}>Bill of materials</Text>
          <View style={s.tHead}>
            <Text style={[s.th, { flex: BOMC.name }]}>Fixture</Text>
            <Text style={[s.th, { flex: BOMC.qty, textAlign: 'right' }]}>Qty</Text>
            <Text style={[s.th, { flex: BOMC.unit, textAlign: 'right' }]}>Unit</Text>
            <Text style={[s.th, { flex: BOMC.sub, textAlign: 'right' }]}>Subtotal</Text>
          </View>
          {result.bom.map((b, i) => (
            <View key={i} style={s.tRow} wrap={false}>
              <Text style={[s.td, { flex: BOMC.name }]}>{b.fixture.name}</Text>
              <Text style={[s.td, { flex: BOMC.qty, textAlign: 'right' }]}>{b.quantity}</Text>
              <Text style={[s.td, { flex: BOMC.unit, textAlign: 'right' }]}>{money(b.unitPrice)}</Text>
              <Text style={[s.tdBold, { flex: BOMC.sub, textAlign: 'right' }]}>{range(b.costLow, b.costHigh)}</Text>
            </View>
          ))}
          {result.system === 'lowvoltage' && result.transformer ? (
            <View style={s.tRow} wrap={false}>
              <Text style={[s.td, { flex: BOMC.name }]}>
                Transformer {result.transformer.sizeVA} VA{result.transformer.count > 1 ? ` (×${result.transformer.count})` : ''} + ~{result.cableMeters} m cable
              </Text>
              <Text style={[s.td, { flex: BOMC.qty, textAlign: 'right' }]}>1</Text>
              <Text style={[s.td, { flex: BOMC.unit, textAlign: 'right' }]}>{money(result.transformer.price + (result.cablePrice ?? 0))}</Text>
              <Text style={[s.tdBold, { flex: BOMC.sub, textAlign: 'right' }]}>{money(result.transformer.price + (result.cablePrice ?? 0))}</Text>
            </View>
          ) : null}

          {/* Notes */}
          <Text style={s.h2}>Notes &amp; recommendations</Text>
          {result.notes.map((n, i) => (
            <View key={i} style={s.bullet}>
              <Text style={s.bulletDot}>•</Text>
              <Text style={s.bulletText}>{n}</Text>
            </View>
          ))}
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>Penlabs Lighting · a Pen Homes company. Intentional, invisible technology.</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function buildLandscapeReportBlob(data: LandscapeReportData): Promise<Blob> {
  return pdf(<LandscapeReport {...data} />).toBlob();
}
