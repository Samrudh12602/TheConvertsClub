import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

const C = { ink: "#16130F", body: "#4A4239", muted: "#6F655A", line: "#DAD3C8", oxblood: "#7A1F2B" };

// react-pdf's built-in Helvetica is the original PDF base-14 font: no ₹ (U+20B9, added to
// Unicode in 2010) or − (U+2212 minus sign) glyph, so both silently vanish from the render.
// formatPaise() is correct everywhere else (real fonts); this is a PDF-only, ASCII-safe copy.
const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 0 });
const inr2 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
function formatPaisePdf(paise: number): string {
  const abs = Math.abs(paise);
  const rupees = abs / 100;
  const body = abs % 100 === 0 ? inr.format(rupees) : inr2.format(rupees);
  return `${paise < 0 ? "-" : ""}Rs. ${body}`;
}

export interface ReceiptData {
  orderId: string;
  buyerName: string;
  buyerEmail: string;
  productName: string;
  listPricePaise: number;
  discountPaise: number;
  amountPaise: number;
  couponCode: string | null;
  paymentId: string | null;
  paidAt: Date;
}

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10.5, color: C.body, fontFamily: "Helvetica" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  mark: { width: 22, height: 22, backgroundColor: C.oxblood, borderRadius: 4, alignItems: "center", justifyContent: "center" },
  markText: { color: "#FFFFFF", fontFamily: "Helvetica-Bold", fontSize: 11 },
  brand: { fontFamily: "Helvetica-Bold", fontSize: 12, color: C.ink, marginLeft: 8 },
  brandRow: { flexDirection: "row", alignItems: "center" },
  site: { fontSize: 9, color: C.muted, marginTop: 2, marginLeft: 30 },
  title: { fontFamily: "Helvetica-Bold", fontSize: 16, color: C.ink, textAlign: "right" },
  metaLine: { fontSize: 9, color: C.muted, textAlign: "right", marginTop: 2 },
  metaBlock: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.line },
  label: { fontSize: 8, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 },
  value: { fontSize: 10.5, color: C.ink, fontFamily: "Helvetica-Bold" },
  buyerEmail: { fontSize: 9.5, color: C.body, marginTop: 2 },
  paymentRef: { fontSize: 9.5, color: C.body },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: C.line },
  rowLabel: { color: C.body },
  rowLabelMuted: { color: C.muted, fontSize: 9.5 },
  rowValue: { color: C.ink, fontFamily: "Helvetica-Bold" },
  rowValueMuted: { color: C.muted, fontFamily: "Helvetica-Bold" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.ink },
  totalValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.oxblood },
  footer: { position: "absolute", bottom: 40, left: 40, right: 40, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 12 },
  footerText: { fontSize: 8.5, color: C.muted, lineHeight: 1.5 },
});

const fmtDate = (d: Date) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "long", year: "numeric" }).format(d);

/** A plain payment receipt — no GST, no tax breakdown. Rendered entirely locally (react-pdf, no
 * network calls, no external service) so a customer's name, email and amount never leave our servers. */
export function ReceiptDocument({ r }: { r: ReceiptData }) {
  return (
    <Document title={`Receipt ${r.orderId}`}>
      <Page size="A4" style={s.page}>
        <View style={s.headerRow}>
          <View>
            <View style={s.brandRow}>
              <View style={s.mark}><Text style={s.markText}>C</Text></View>
              <Text style={s.brand}>The Convert Club</Text>
            </View>
            <Text style={s.site}>convertsclub.in</Text>
          </View>
          <View>
            <Text style={s.title}>RECEIPT</Text>
            <Text style={s.metaLine}>Receipt no. {r.orderId}</Text>
            <Text style={s.metaLine}>{fmtDate(r.paidAt)}</Text>
          </View>
        </View>

        <View style={s.metaBlock}>
          <View>
            <Text style={s.label}>Billed to</Text>
            <Text style={s.value}>{r.buyerName}</Text>
            <Text style={s.buyerEmail}>{r.buyerEmail}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.label}>Payment reference</Text>
            <Text style={s.paymentRef}>{r.paymentId ?? "-"}</Text>
          </View>
        </View>

        <View>
          <View style={s.row}>
            <Text style={s.rowLabel}>{r.productName}</Text>
            <Text style={s.rowValue}>{formatPaisePdf(r.listPricePaise)}</Text>
          </View>
          {r.discountPaise > 0 && (
            <View style={s.row}>
              <Text style={s.rowLabelMuted}>{r.couponCode ? `Discount · coupon ${r.couponCode}` : "Discount"}</Text>
              <Text style={s.rowValueMuted}>- {formatPaisePdf(r.discountPaise)}</Text>
            </View>
          )}
        </View>

        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Total paid</Text>
          <Text style={s.totalValue}>{formatPaisePdf(r.amountPaise)}</Text>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>No GST applicable. This is a computer-generated receipt and needs no signature.</Text>
          <Text style={s.footerText}>Questions about this payment? Reply to your confirmation email.</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderReceiptPdf(r: ReceiptData): Promise<Buffer> {
  return renderToBuffer(<ReceiptDocument r={r} />);
}
