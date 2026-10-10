import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { PdfMark } from "@/server/pdf-mark";

const C = {
  ink: "#16130F", body: "#4A4239", muted: "#6F655A", line: "#E4DED4", lineSoft: "#EFEAE2",
  oxblood: "#7A1F2B", oxbloodTint: "#F5E9EA", oxbloodLine: "#E6CDD0",
  green: "#14472F", greenTint: "#EDF0E9",
};

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
  /** What the purchase included, e.g. "4 Mock PI", "2 GD/GE" — one per credit kind. */
  includes: string[];
  listPricePaise: number;
  discountPaise: number;
  amountPaise: number;
  couponCode: string | null;
  paymentId: string | null;
  paymentMethod: string | null;
  paidAt: Date;
}

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: C.body, fontFamily: "Helvetica" },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 },
  brand: { fontFamily: "Helvetica-Bold", fontSize: 13, color: C.ink, marginLeft: 8 },
  brandRow: { flexDirection: "row", alignItems: "center" },

  headerRight: { alignItems: "flex-end" },
  title: { fontFamily: "Helvetica-Bold", fontSize: 19, color: C.ink, letterSpacing: 0.5 },
  badge: { marginTop: 6, backgroundColor: C.greenTint, borderRadius: 3, paddingVertical: 3, paddingHorizontal: 8 },
  badgeText: { color: C.green, fontFamily: "Helvetica-Bold", fontSize: 7.5, letterSpacing: 0.6 },
  metaLine: { fontSize: 8.5, color: C.muted, textAlign: "right", marginTop: 5 },

  divider: { borderBottomWidth: 1.5, borderBottomColor: C.ink, marginBottom: 20 },

  metaBlock: { flexDirection: "row", marginBottom: 22 },
  metaCol: { flex: 1 },
  label: { fontSize: 7.5, color: C.muted, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 5, fontFamily: "Helvetica-Bold" },
  buyerName: { fontSize: 11, color: C.ink, fontFamily: "Helvetica-Bold" },
  metaValue: { fontSize: 9.5, color: C.body, marginTop: 1 },
  kv: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 3 },
  kvKey: { fontSize: 8.5, color: C.muted },
  kvVal: { fontSize: 8.5, color: C.ink, fontFamily: "Helvetica-Bold" },

  table: { borderWidth: 1, borderColor: C.line, borderRadius: 4, overflow: "hidden" },
  tHead: { flexDirection: "row", backgroundColor: C.lineSoft, paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  thDesc: { flex: 1, fontSize: 7.5, color: C.muted, fontFamily: "Helvetica-Bold", letterSpacing: 0.6, textTransform: "uppercase" },
  thAmount: { width: 90, fontSize: 7.5, color: C.muted, fontFamily: "Helvetica-Bold", letterSpacing: 0.6, textTransform: "uppercase", textAlign: "right" },

  tRow: { flexDirection: "row", paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: C.lineSoft },
  tDesc: { flex: 1, paddingRight: 10 },
  itemName: { fontSize: 10.5, color: C.ink, fontFamily: "Helvetica-Bold" },
  itemIncludes: { fontSize: 8.5, color: C.muted, marginTop: 3, lineHeight: 1.5 },
  tAmount: { width: 90, fontSize: 10.5, color: C.ink, fontFamily: "Helvetica-Bold", textAlign: "right" },

  discountRow: { flexDirection: "row", paddingVertical: 9, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: C.lineSoft },
  discountDesc: { flex: 1, fontSize: 9, color: C.muted },
  discountAmount: { width: 90, fontSize: 9, color: C.oxblood, textAlign: "right" },

  totalRow: { flexDirection: "row", alignItems: "center", backgroundColor: C.oxbloodTint, paddingVertical: 11, paddingHorizontal: 12 },
  totalLabel: { flex: 1, fontSize: 11, fontFamily: "Helvetica-Bold", color: C.ink },
  totalValue: { width: 90, fontSize: 13, fontFamily: "Helvetica-Bold", color: C.oxblood, textAlign: "right" },

  notes: { marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.lineSoft },
  noteText: { fontSize: 8.5, color: C.muted, lineHeight: 1.6 },

  footer: { position: "absolute", bottom: 36, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTopWidth: 1, borderTopColor: C.lineSoft },
  footerBrand: { fontSize: 8.5, color: C.ink, fontFamily: "Helvetica-Bold" },
  footerMuted: { fontSize: 8, color: C.muted },
});

const fmtDate = (d: Date) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "long", year: "numeric" }).format(d);
const METHOD_LABEL: Record<string, string> = { upi: "UPI", card: "Card", netbanking: "Netbanking", wallet: "Wallet", emi: "EMI", paylater: "Pay Later" };
const methodLabel = (m: string) => METHOD_LABEL[m.toLowerCase()] ?? m.charAt(0).toUpperCase() + m.slice(1).toLowerCase();

/** A plain payment receipt — no GST, no tax breakdown. Rendered entirely locally (react-pdf, no
 * network calls, no external service) so a customer's name, email and amount never leave our servers. */
export function ReceiptDocument({ r }: { r: ReceiptData }) {
  return (
    <Document title={`Receipt ${r.orderId}`}>
      <Page size="A4" style={s.page}>
        <View style={s.headerRow}>
          <View>
            <View style={s.brandRow}>
              <PdfMark height={24} />
              <Text style={s.brand}>The Converts Club</Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <Text style={s.title}>RECEIPT</Text>
            <View style={s.badge}><Text style={s.badgeText}>PAID</Text></View>
            <Text style={s.metaLine}>No. {r.orderId}</Text>
            <Text style={s.metaLine}>{fmtDate(r.paidAt)}</Text>
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.metaBlock}>
          <View style={s.metaCol}>
            <Text style={s.label}>Billed to</Text>
            <Text style={s.buyerName}>{r.buyerName}</Text>
            <Text style={s.metaValue}>{r.buyerEmail}</Text>
          </View>
          <View style={[s.metaCol, { alignItems: "flex-end" }]}>
            <Text style={s.label}>Payment details</Text>
            <View style={s.kv}><Text style={s.kvKey}>Reference</Text><Text style={s.kvVal}>{r.paymentId ?? "-"}</Text></View>
            {r.paymentMethod && <View style={s.kv}><Text style={s.kvKey}>Method</Text><Text style={s.kvVal}>{methodLabel(r.paymentMethod)}</Text></View>}
          </View>
        </View>

        <View style={s.table}>
          <View style={s.tHead}>
            <Text style={s.thDesc}>Description</Text>
            <Text style={s.thAmount}>Amount</Text>
          </View>

          <View style={s.tRow}>
            <View style={s.tDesc}>
              <Text style={s.itemName}>{r.productName}</Text>
              {r.includes.length > 0 && <Text style={s.itemIncludes}>Includes {r.includes.join(" · ")}</Text>}
            </View>
            <Text style={s.tAmount}>{formatPaisePdf(r.listPricePaise)}</Text>
          </View>

          {r.discountPaise > 0 && (
            <View style={s.discountRow}>
              <Text style={s.discountDesc}>{r.couponCode ? `Discount — coupon ${r.couponCode}` : "Discount"}</Text>
              <Text style={s.discountAmount}>- {formatPaisePdf(r.discountPaise)}</Text>
            </View>
          )}

          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total paid</Text>
            <Text style={s.totalValue}>{formatPaisePdf(r.amountPaise)}</Text>
          </View>
        </View>

        <View style={s.notes}>
          <Text style={s.noteText}>No GST applicable. This is a computer-generated receipt and needs no signature.</Text>
          <Text style={s.noteText}>Questions about this payment? Reply to your confirmation email and it reaches us directly.</Text>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerBrand}>The Converts Club</Text>
          <Text style={s.footerMuted}>Thank you for choosing us.</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderReceiptPdf(r: ReceiptData): Promise<Buffer> {
  return renderToBuffer(<ReceiptDocument r={r} />);
}
