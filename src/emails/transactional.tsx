import { Body, Button, Container, Head, Html, Preview, Section, Text } from "@react-email/components";

/** Email shell from the Claude Design handoff: logo row, heading, body, optional detail rows, one CTA, footer. */
export interface EmailProps {
  preview: string;
  head: string;
  body: string;
  details?: { k: string; v: string }[];
  cta?: { label: string; url: string };
  footer?: string;
}

const C = { paper: "#EEE9E1", ink: "#16130F", body: "#4A4239", muted: "#6F655A", line: "#F0EBE4", oxblood: "#7A1F2B", surface: "#FBF9F6", muted2: "#6B635A" };
const font = "Archivo, -apple-system, 'Segoe UI', Roboto, sans-serif";
const display = "'Bricolage Grotesque', Archivo, -apple-system, 'Segoe UI', sans-serif";

export function TransactionalEmail({ preview, head, body, details, cta, footer }: EmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ background: C.paper, margin: 0, padding: "24px 12px", fontFamily: font }}>
        <Container style={{ maxWidth: 520, background: "#fff", borderRadius: 8, padding: 24 }}>
          <Section style={{ paddingBottom: 16, borderBottom: `1px solid ${C.line}` }}>
            <table role="presentation"><tbody><tr>
              <td style={{ width: 22, height: 22, background: C.oxblood, borderRadius: 5, textAlign: "center", color: "#fff", fontFamily: display, fontWeight: 700, fontSize: 11 }}>C</td>
              <td style={{ paddingLeft: 8, fontFamily: display, fontWeight: 700, fontSize: 12, color: C.ink }}>The Convert Club</td>
            </tr></tbody></table>
          </Section>
          <Text style={{ fontFamily: display, fontWeight: 700, fontSize: 18, lineHeight: "1.3", color: C.ink, margin: "16px 0 0" }}>{head}</Text>
          <Text style={{ fontSize: 13, lineHeight: "1.65", color: C.body, margin: "10px 0 0" }}>{body}</Text>
          {details && details.length > 0 && (
            <Section style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8, padding: 13, marginTop: 14 }}>
              {details.map((d) => (
                <table key={d.k} role="presentation" width="100%"><tbody><tr>
                  <td style={{ fontSize: 12.5, lineHeight: "1.9", color: C.muted2 }}>{d.k}</td>
                  <td style={{ fontSize: 12.5, lineHeight: "1.9", color: C.ink, fontWeight: 600, textAlign: "right" }}>{d.v}</td>
                </tr></tbody></table>
              ))}
            </Section>
          )}
          {cta && (
            <Section style={{ marginTop: 16 }}>
              <Button href={cta.url} style={{ background: C.oxblood, color: "#fff", padding: "11px 18px", borderRadius: 7, fontSize: 12.5, fontWeight: 600, textDecoration: "none" }}>
                {cta.label}
              </Button>
            </Section>
          )}
          {footer && <Text style={{ fontSize: 11, lineHeight: "1.6", color: C.muted, margin: "18px 0 0", paddingTop: 14, borderTop: `1px solid ${C.line}` }}>{footer}</Text>}
        </Container>
      </Body>
    </Html>
  );
}
