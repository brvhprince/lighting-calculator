import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Svg,
  Polygon,
  Circle,
  pdf,
} from '@react-pdf/renderer';
import { CalculationResult } from '@/types';
import { Market, formatMoneyAscii } from '@/config/markets';
import { LightLayer } from '@/lib/lightingZones';
import { SpecGuidance, PenlabsProduct } from '@/lib/productRecommendations';
import { CostEstimate } from '@/lib/costEstimator';

type Pt = { x: number; y: number };

export type LightingReportData = {
  roomName: string;
  date: string;
  result: CalculationResult;
  market: Market;
  layers: LightLayer[];
  spec: SpecGuidance;
  products: PenlabsProduct[];
  cost: CostEstimate;
  fixtureRange: { low: number; high: number };
  // Optional: the actual drawn floor plan (feet) for designer reports.
  polygon?: Pt[];
  fixtures?: Pt[];
  beamRadiusFt?: number; // beam light-pool radius at the floor
  logoSrc?: string; // brand logo as a data URL; falls back to a text mark
};

// Scaled SVG of the drawn polygon + placed fixtures (+ beam coverage pools).
function PolygonPlan({
  polygon,
  fixtures,
  beamRadiusFt,
}: {
  polygon: Pt[];
  fixtures: Pt[];
  beamRadiusFt?: number;
}) {
  const W = 210;
  const H = 160;
  const pad = 12;
  const xs = polygon.map((p) => p.x);
  const ys = polygon.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const w = Math.max(1, Math.max(...xs) - minX);
  const h = Math.max(1, Math.max(...ys) - minY);
  const scale = Math.min((W - pad * 2) / w, (H - pad * 2) / h);
  const ox = (W - w * scale) / 2 - minX * scale;
  const oy = (H - h * scale) / 2 - minY * scale;
  const map = (p: Pt) => ({ x: ox + p.x * scale, y: oy + p.y * scale });
  const pts = polygon
    .map(map)
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');
  const poolR = beamRadiusFt && beamRadiusFt > 0 ? beamRadiusFt * scale : 0;
  return (
    <Svg width={W} height={H}>
      {/* Beam coverage pools (behind the plan) */}
      {poolR > 0 &&
        fixtures.map((f, i) => {
          const s = map(f);
          return (
            <Circle
              key={`pool-${i}`}
              cx={s.x}
              cy={s.y}
              r={poolR}
              fill="#A68966"
              fillOpacity={0.16}
              stroke="#A68966"
              strokeOpacity={0.5}
              strokeWidth={0.5}
              strokeDasharray="2 2"
            />
          );
        })}
      <Polygon points={pts} fill="rgba(138,150,130,0.14)" stroke="#A68966" strokeWidth={1.5} />
      {fixtures.map((f, i) => {
        const s = map(f);
        return <Circle key={i} cx={s.x} cy={s.y} r={2.6} fill="#A68966" />;
      })}
    </Svg>
  );
}

// Pen Homes palette
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
  statBox: { borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 10, backgroundColor: C.linen, height: 58 },
  statLabel: { fontSize: 7, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontFamily: 'Times-Roman', fontSize: 15, color: C.basalt, marginTop: 4 },
  statUnit: { fontSize: 8, color: C.muted },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: C.border },
  rowLabel: { color: C.muted },
  rowValue: { fontFamily: 'Helvetica-Bold' },
  twoCol: { flexDirection: 'row', marginHorizontal: -8 },
  col: { flex: 1, paddingHorizontal: 8 },
  card: { borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 10, marginBottom: 8 },
  cardTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10, marginBottom: 2 },
  small: { fontSize: 8, color: C.muted, marginTop: 2 },
  zoneBarTrack: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  bullet: { flexDirection: 'row', marginBottom: 3 },
  bulletDot: { color: C.bronze, marginRight: 5 },
  bulletText: { flex: 1, fontSize: 9 },
  layoutBox: { borderWidth: 1, borderStyle: 'dashed', borderColor: C.border, borderRadius: 6, padding: 12, backgroundColor: C.linen },
  layoutRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 4 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.bronze },
  footer: { position: 'absolute', bottom: 20, left: 28, right: 28, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: C.muted },
});

const ZONE_COLORS: Record<LightLayer['key'], string> = {
  ambient: C.basalt,
  task: C.bronze,
  accent: C.sage,
};

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

function LightingReport(d: LightingReportData) {
  const { result, market } = d;
  const hasPolygon = !!(d.polygon && d.polygon.length >= 3);
  const rows = Math.min(result.spacing.layout.rows, 8);
  const cols = Math.min(result.spacing.layout.columns, 12);

  return (
    <Document
      title={`Penlabs Lighting, ${d.roomName}`}
      author="Pen Homes"
      subject="Lighting design report"
    >
      <Page size="A4" style={s.page}>
        {/* Header */}
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
            <Text style={s.metaLabel}>Lighting Report</Text>
            <Text style={s.metaValue}>{d.roomName}</Text>
            <Text style={[s.metaLabel, { marginTop: 4 }]}>{d.date}</Text>
          </View>
        </View>

        <View style={s.body}>
          {/* Summary */}
          <Text style={s.kicker}>Summary</Text>
          <Text style={s.h2}>Lighting requirements</Text>
          <View style={s.statRow}>
            <Stat label="Floor area" value={result.area.toFixed(1)} unit={result.areaUnit} />
            <Stat label="Total lumens" value={result.totalLumensNeeded.toLocaleString()} unit="lm" />
            <Stat label="Fixtures" value={String(result.numberOfFixtures)} unit={result.fixtureSize} />
            <Stat label="Per fixture" value={String(result.lumensPerFixture)} unit="lm" />
          </View>

          <View style={s.twoCol}>
            <View style={s.col}>
              <View style={{ marginTop: 8 }}>
                {result.areaUnit === 'm²' ? (
                  <Row label="Lumens per m²" value={String(Math.round(result.lumensPerSqFt * 10.7639))} />
                ) : (
                  <Row label="Lumens per sq ft" value={String(result.lumensPerSqFt)} />
                )}
                <Row
                  label="Ceiling height"
                  value={
                    result.areaUnit === 'm²'
                      ? `${((result.ceilingHeightFt ?? 8) * 0.3048).toFixed(1)} m`
                      : `${(result.ceilingHeightFt ?? 8).toFixed(1)} ft`
                  }
                />
                {result.ceilingFactor != null && result.ceilingFactor !== 1 ? (
                  <Row
                    label="Ceiling adjustment"
                    value={`${result.ceilingFactor > 1 ? '+' : ''}${Math.round((result.ceilingFactor - 1) * 100)}%`}
                  />
                ) : null}
                {result.naturalLightFactor != null && result.naturalLightFactor !== 1 ? (
                  <Row
                    label="Daylight reduction"
                    value={`-${Math.round((1 - result.naturalLightFactor) * 100)}%`}
                  />
                ) : null}
              </View>
            </View>
            <View style={s.col}>
              <Text style={[s.small, { marginBottom: 4 }]}>
                {hasPolygon
                  ? 'Drawn floor plan with fixture layout'
                  : `Suggested layout, ${result.spacing.layout.rows} × ${result.spacing.layout.columns}, ${result.spacing.fromWall} ${result.spacing.unit} from walls`}
              </Text>
              <View style={[s.layoutBox, hasPolygon ? { alignItems: 'center' } : {}]}>
                {hasPolygon ? (
                  <PolygonPlan polygon={d.polygon!} fixtures={d.fixtures ?? []} beamRadiusFt={d.beamRadiusFt} />
                ) : (
                  Array.from({ length: rows }).map((_, r) => (
                    <View key={r} style={s.layoutRow}>
                      {Array.from({ length: cols }).map((_, c) => (
                        <View key={c} style={s.dot} />
                      ))}
                    </View>
                  ))
                )}
              </View>
            </View>
          </View>

          {/* Layered plan */}
          <Text style={s.h2}>Layered lighting plan</Text>
          <View style={s.zoneBarTrack}>
            {d.layers.map((l) => (
              <View key={l.key} style={{ width: `${l.percent}%`, backgroundColor: ZONE_COLORS[l.key] }} />
            ))}
          </View>
          {d.layers.map((l) => (
            <View key={l.key} style={s.row}>
              <Text style={s.rowLabel}>
                {l.name}, {l.examples}
              </Text>
              <Text style={s.rowValue}>
                {l.lumens.toLocaleString()} lm · {l.percent}%
              </Text>
            </View>
          ))}

          {/* Cost & energy */}
          <Text style={s.h2}>Cost &amp; energy ({market.code})</Text>
          <View style={s.twoCol}>
            <View style={s.col}>
              <Row label="Material (fixtures + hardware)" value={`${formatMoneyAscii(d.fixtureRange.low, market)} – ${formatMoneyAscii(d.fixtureRange.high, market)}`} />
              <Row label="LED running cost" value={`${formatMoneyAscii(d.cost.annualEnergyCostLed, market)}/yr`} />
              <Row label="vs. incandescent" value={`${formatMoneyAscii(d.cost.annualEnergyCostIncandescent, market)}/yr`} />
            </View>
            <View style={s.col}>
              <Row label="LED saves" value={`${formatMoneyAscii(d.cost.annualSavings, market)}/yr`} />
              <Row label="Over 10 years" value={formatMoneyAscii(d.cost.tenYearSavings, market)} />
              <Row label="CO₂ avoided" value={`${d.cost.annualCo2SavedKg} kg/yr`} />
            </View>
          </View>

          {/* Spec guidance */}
          <Text style={s.h2}>Recommended specification</Text>
          <View style={s.twoCol}>
            <View style={s.col}>
              <View style={s.card}>
                <Text style={s.cardTitle}>Colour temperature</Text>
                <Text>{d.spec.colorTemp}</Text>
                <Text style={s.small}>{d.spec.colorTempReason}</Text>
              </View>
            </View>
            <View style={s.col}>
              <View style={s.card}>
                <Text style={s.cardTitle}>Colour rendering</Text>
                <Text>{d.spec.cri}</Text>
                <Text style={s.small}>{d.spec.criReason}</Text>
              </View>
            </View>
            <View style={s.col}>
              <View style={s.card}>
                <Text style={s.cardTitle}>Beam angle</Text>
                <Text>{d.spec.beamAngle}</Text>
                <Text style={s.small}>{d.spec.beamReason}</Text>
              </View>
            </View>
          </View>

          {/* Penlabs products */}
          {/*<Text style={s.h2}>Curated Penlabs fixtures</Text>*/}
          {/*<View style={s.twoCol}>*/}
          {/*  {d.products.map((p) => (*/}
          {/*    <View key={p.name} style={s.col}>*/}
          {/*      <View style={s.card}>*/}
          {/*        <Text style={s.cardTitle}>{p.name}</Text>*/}
          {/*        <Text style={s.small}>{p.tagline}</Text>*/}
          {/*        <Text style={{ marginTop: 4 }}>{p.lumens} · {p.watts}</Text>*/}
          {/*        <Text>{p.colorTemp} · {p.cri}</Text>*/}
          {/*        <Text style={s.small}>{p.smart} · {p.finish}</Text>*/}
          {/*      </View>*/}
          {/*    </View>*/}
          {/*  ))}*/}
          {/*</View>*/}

          {/* Recommendations */}
          <Text style={s.h2}>Notes &amp; recommendations</Text>
          {result.recommendations.map((rec, i) => (
            <View key={i} style={s.bullet}>
              <Text style={s.bulletDot}>•</Text>
              <Text style={s.bulletText}>{rec}</Text>
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

export async function buildLightingReportBlob(data: LightingReportData): Promise<Blob> {
  return pdf(<LightingReport {...data} />).toBlob();
}
