import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';
import { Market, formatMoneyAscii } from '@/config/markets';

// One priced fixture line (a room breakdown row or a bill-of-materials row).
export type ProjectReportLine = {
  name: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
};

export type ProjectReportRoom = {
  name: string;
  areaDisplay: number;
  areaUnit: string;
  totalLumens: number;
  numberOfFixtures: number;
  fixtureSize: string;
  density: number; // lumens per area unit
  costLow: number;
  costHigh: number;
  items: ProjectReportLine[];
};

export type ProjectReportData = {
  projectName: string;
  client?: string;
  date: string;
  market: Market;
  rooms: ProjectReportRoom[];
  totals: {
    roomCount: number;
    totalFixtures: number;
    totalLumens: number;
    costLow: number;
    costHigh: number;
  };
  // Installed estimate adds professional labour to the material range.
  installedLow: number;
  installedHigh: number;
  bom: ProjectReportLine[];
  logoSrc?: string;
};

// Pen Homes palette (shared with lightingReport).
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
  // Table primitives
  tHead: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.basalt, paddingBottom: 4, marginBottom: 2 },
  tRow: { flexDirection: 'row', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: C.border },
  th: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  td: { fontSize: 9 },
  tdBold: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  roomCard: { borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 10, marginBottom: 10 },
  roomTitle: { fontFamily: 'Times-Roman', fontSize: 12, color: C.basalt },
  roomMeta: { fontSize: 8, color: C.muted, marginTop: 2, marginBottom: 6 },
  totalRow: { flexDirection: 'row', paddingVertical: 4, borderTopWidth: 1, borderTopColor: C.basalt, marginTop: 2 },
  small: { fontSize: 8, color: C.muted },
  footer: { position: 'absolute', bottom: 20, left: 28, right: 28, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: C.muted },
});

function Brand({ logoSrc }: { logoSrc?: string }) {
  return (
    <View style={s.brandRow}>
      {logoSrc ? (
        // eslint-disable-next-line jsx-a11y/alt-text
        <Image src={logoSrc} style={s.logo} />
      ) : (
        <Text style={s.mark}>P</Text>
      )}
      <View>
        <Text style={s.brandName}>Penlabs Lighting</Text>
        <Text style={s.brandSub}>by Pen Homes</Text>
      </View>
    </View>
  );
}

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

// Column layout for the room-overview table (flex weights sum to ~1).
const OV = { room: 2.4, area: 1.1, fix: 1.8, lm: 1.3, den: 1.1, cost: 2.0 };
// Column layout for the fixture line tables (room breakdown + BOM).
const LINE = { name: 3, qty: 0.8, unit: 1.4, sub: 1.4 };

function ProjectReport(d: ProjectReportData) {
  const { market } = d;
  const money = (n: number) => formatMoneyAscii(n, market);
  const range = (lo: number, hi: number) => `${money(lo)} – ${money(hi)}`;

  return (
    <Document
      title={`Penlabs Project, ${d.projectName}`}
      author="Pen Homes"
      subject="Lighting project report"
    >
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Brand logoSrc={d.logoSrc} />
          <View>
            <Text style={s.metaLabel}>Project Report</Text>
            <Text style={s.metaValue}>{d.projectName}</Text>
            {d.client ? <Text style={[s.metaLabel, { marginTop: 4 }]}>{d.client}</Text> : null}
            <Text style={[s.metaLabel, { marginTop: 4 }]}>
              {d.date} · {market.code}
            </Text>
          </View>
        </View>

        <View style={s.body}>
          {/* Summary */}
          <Text style={s.kicker}>Summary</Text>
          <Text style={s.h2}>Project overview</Text>
          <View style={s.statRow}>
            <Stat label="Rooms" value={String(d.totals.roomCount)} />
            <Stat label="Total fixtures" value={String(d.totals.totalFixtures)} />
            <Stat label="Total lumens" value={d.totals.totalLumens.toLocaleString()} unit="lm" />
            <Stat label="Material cost" value={money(d.totals.costLow)} unit={`to ${money(d.totals.costHigh)}`} />
          </View>

          {/* Rooms overview */}
          <Text style={s.h2}>Rooms</Text>
          <View style={s.tHead}>
            <Text style={[s.th, { flex: OV.room }]}>Room</Text>
            <Text style={[s.th, { flex: OV.area }]}>Area</Text>
            <Text style={[s.th, { flex: OV.fix }]}>Fixtures</Text>
            <Text style={[s.th, { flex: OV.lm, textAlign: 'right' }]}>Lumens</Text>
            <Text style={[s.th, { flex: OV.den, textAlign: 'right' }]}>Density</Text>
            <Text style={[s.th, { flex: OV.cost, textAlign: 'right' }]}>Est. cost</Text>
          </View>
          {d.rooms.map((r, i) => (
            <View key={i} style={s.tRow} wrap={false}>
              <Text style={[s.tdBold, { flex: OV.room }]}>{r.name}</Text>
              <Text style={[s.td, { flex: OV.area }]}>{r.areaDisplay} {r.areaUnit}</Text>
              <Text style={[s.td, { flex: OV.fix }]}>{r.numberOfFixtures} × {r.fixtureSize}</Text>
              <Text style={[s.td, { flex: OV.lm, textAlign: 'right' }]}>{r.totalLumens.toLocaleString()}</Text>
              <Text style={[s.td, { flex: OV.den, textAlign: 'right' }]}>{r.density} lm/{r.areaUnit}</Text>
              <Text style={[s.td, { flex: OV.cost, textAlign: 'right' }]}>{range(r.costLow, r.costHigh)}</Text>
            </View>
          ))}
          <View style={s.totalRow}>
            <Text style={[s.tdBold, { flex: OV.room }]}>Total</Text>
            <Text style={[s.td, { flex: OV.area }]} />
            <Text style={[s.tdBold, { flex: OV.fix }]}>{d.totals.totalFixtures} fixtures</Text>
            <Text style={[s.tdBold, { flex: OV.lm, textAlign: 'right' }]}>{d.totals.totalLumens.toLocaleString()}</Text>
            <Text style={[s.td, { flex: OV.den }]} />
            <Text style={[s.tdBold, { flex: OV.cost, textAlign: 'right' }]}>{range(d.totals.costLow, d.totals.costHigh)}</Text>
          </View>

          {/* Per-room breakdown */}
          <Text style={s.h2}>Room breakdown</Text>
          {d.rooms.map((r, i) => (
            <View key={i} style={s.roomCard} wrap={false}>
              <Text style={s.roomTitle}>{r.name}</Text>
              <Text style={s.roomMeta}>
                {r.areaDisplay} {r.areaUnit} · {r.totalLumens.toLocaleString()} lm · {r.density} lm/{r.areaUnit} ·{' '}
                {r.numberOfFixtures} fixtures · {range(r.costLow, r.costHigh)}
              </Text>
              {r.items.length ? (
                <>
                  <View style={s.tHead}>
                    <Text style={[s.th, { flex: LINE.name }]}>Fixture</Text>
                    <Text style={[s.th, { flex: LINE.qty, textAlign: 'right' }]}>Qty</Text>
                    <Text style={[s.th, { flex: LINE.unit, textAlign: 'right' }]}>Unit</Text>
                    <Text style={[s.th, { flex: LINE.sub, textAlign: 'right' }]}>Subtotal</Text>
                  </View>
                  {r.items.map((it, j) => (
                    <View key={j} style={s.tRow}>
                      <Text style={[s.td, { flex: LINE.name }]}>{it.name}</Text>
                      <Text style={[s.td, { flex: LINE.qty, textAlign: 'right' }]}>{it.qty}</Text>
                      <Text style={[s.td, { flex: LINE.unit, textAlign: 'right' }]}>{money(it.unitPrice)}</Text>
                      <Text style={[s.tdBold, { flex: LINE.sub, textAlign: 'right' }]}>{money(it.subtotal)}</Text>
                    </View>
                  ))}
                </>
              ) : (
                <Text style={s.small}>
                  Fixture mix not recorded for this room, cost estimated from the fixture count.
                </Text>
              )}
            </View>
          ))}

          {/* Bill of materials */}
          {d.bom.length ? (
            <>
              <Text style={s.h2}>Bill of materials (all rooms)</Text>
              <View style={s.tHead}>
                <Text style={[s.th, { flex: LINE.name }]}>Fixture</Text>
                <Text style={[s.th, { flex: LINE.qty, textAlign: 'right' }]}>Qty</Text>
                <Text style={[s.th, { flex: LINE.unit, textAlign: 'right' }]}>Unit</Text>
                <Text style={[s.th, { flex: LINE.sub, textAlign: 'right' }]}>Subtotal</Text>
              </View>
              {d.bom.map((it, i) => (
                <View key={i} style={s.tRow} wrap={false}>
                  <Text style={[s.td, { flex: LINE.name }]}>{it.name}</Text>
                  <Text style={[s.td, { flex: LINE.qty, textAlign: 'right' }]}>{it.qty}</Text>
                  <Text style={[s.td, { flex: LINE.unit, textAlign: 'right' }]}>{money(it.unitPrice)}</Text>
                  <Text style={[s.tdBold, { flex: LINE.sub, textAlign: 'right' }]}>{money(it.subtotal)}</Text>
                </View>
              ))}
            </>
          ) : null}

          {/* Cost notes */}
          <Text style={s.h2}>Cost &amp; assumptions ({market.code})</Text>
          <Text style={[s.small, { marginBottom: 3 }]}>
            Material range {range(d.totals.costLow, d.totals.costHigh)} covers fixtures plus per-room
            wiring hardware ({money(market.hardwareLow)} – {money(market.hardwareHigh)} per room).
          </Text>
          <Text style={[s.small, { marginBottom: 3 }]}>
            With professional fitting at {money(market.installCostPerFixture)} per fixture, the installed
            estimate is {range(d.installedLow, d.installedHigh)} across {d.totals.totalFixtures} fixtures.
          </Text>
          <Text style={s.small}>
            Running cost assumes electricity at {money(market.electricityRate)}/kWh. Fixture prices are the
            catalogue&apos;s unit points in {market.code}; line subtotals are quantity × unit and exclude
            hardware and labour.
          </Text>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>Penlabs Lighting · a Pen Homes company. Intentional, invisible technology.</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function buildProjectReportBlob(data: ProjectReportData): Promise<Blob> {
  return pdf(<ProjectReport {...data} />).toBlob();
}
