import { describe, expect, it } from "vitest";
import { composeHtml, composeText, fillMergeFields, firstNameOf, senderFor } from "./mailbox";
import { buildMailTemplates, priceNote, type TemplatePrices } from "./mail-templates";
import type { CatalogProduct } from "./pricing";

const prices: TemplatePrices = {
  test: { now: "₹25", was: "₹50", seatsLeft: 7 },
  five: { now: "₹399", was: "₹499", seatsLeft: 20 },
  ten: { now: "₹749", was: "₹899", seatsLeft: 1 },
  upgrade: { now: "₹499", was: null, seatsLeft: null },
};
const noEarlyBird: TemplatePrices = { test: { now: "₹50", was: null, seatsLeft: null }, five: { now: "₹499", was: null, seatsLeft: null }, ten: { now: "₹899", was: null, seatsLeft: null }, upgrade: { now: "₹499", was: null, seatsLeft: null } };

describe("mail templates", () => {
  const all = buildMailTemplates(prices);
  it("has the four ready-made emails with unique ids", () => {
    expect(all.map((t) => t.id)).toEqual(["snap-launch", "early-bird", "mentor-invite", "pack-followup"]);
  });
  it("only uses senders and audiences the composer offers", () => {
    for (const t of all) {
      expect(senderFor(t.from)).not.toBeNull();
      expect(["SPECIFIC", "ALL_STUDENTS", "ALL_MENTORS"]).toContain(t.audience);
    }
  });
  it("addresses each person by first name, and leaves no other placeholder behind", () => {
    for (const t of all) {
      expect(t.body).toContain("{{first_name}}");
      const left = (t.subject + t.body).replace(/\{\{first_name\}\}/g, "").match(/\{\{|\}\}|undefined|\$\{/);
      expect(left).toBeNull();
    }
  });
  it("renders every template to HTML with a button that goes to our own site", () => {
    for (const t of all) {
      const html = composeHtml(fillMergeFields(t.body, "Priya"), senderFor(t.from), "x.png");
      expect(html).toContain("Hi Priya");
      expect(html).toMatch(/href="https:\/\/theconvertsclub\.in\/[^"]*"[^>]*border-radius:999px|border-radius:999px[^>]*>/);
      expect(html).not.toContain("{{");
    }
  });
  it("points the student mails at the mocks page and the mentor mail at the application", () => {
    const by = Object.fromEntries(all.map((t) => [t.id, t.body]));
    expect(by["snap-launch"]).toContain("https://theconvertsclub.in/mocks");
    expect(by["early-bird"]).toContain("https://theconvertsclub.in/mocks");
    expect(by["mentor-invite"]).toContain("https://theconvertsclub.in/become-a-mentor");
  });
  it("uses the live prices", () => {
    const by = Object.fromEntries(all.map((t) => [t.id, t.body]));
    expect(by["snap-launch"]).toContain("₹25");
    expect(by["snap-launch"]).toContain("₹749");
    expect(by["pack-followup"]).toContain("₹399");
    expect(by["pack-followup"]).toContain("₹499");
  });
  it("shows the real seats left in the early-bird mail, with the right plural", () => {
    const body = all.find((t) => t.id === "early-bird")!.body;
    expect(body).toContain("only 7 early-bird seats left");
    expect(body).toContain("only 1 early-bird seat left");
    expect(body).not.toContain("1 early-bird seats");
  });
  it("does not invent urgency when no early-bird seats are running", () => {
    const t = buildMailTemplates(noEarlyBird).find((x) => x.id === "early-bird")!;
    expect(t.body).not.toMatch(/seat/i);
    expect(t.subject).not.toMatch(/early/i);
    expect(t.body).toContain("₹899");
  });
  it("never promises admission or an outcome", () => {
    for (const t of all) expect(t.body.toLowerCase()).not.toMatch(/guarantee|promise|assured|100%/);
  });
  it("has a readable plain-text version", () => {
    for (const t of all) {
      const text = composeText(fillMergeFields(t.body, "Priya"), null);
      expect(text).not.toMatch(/\[button:|\*\*|^#/m);
    }
  });
});

describe("merge fields", () => {
  it("fills the first name, or 'there' when unknown", () => {
    expect(fillMergeFields("Hi {{first_name}}, hi {{ first_name }}", "Ankit")).toBe("Hi Ankit, hi Ankit");
    expect(fillMergeFields("Hi {{first_name}}", undefined)).toBe("Hi there");
    expect(fillMergeFields("Hi {{first_name}}", "  ")).toBe("Hi there");
  });
  it("takes the first word of a name and drops a demo tag", () => {
    expect(firstNameOf("Priya Nair")).toBe("Priya");
    expect(firstNameOf("Priya Nair (demo)")).toBe("Priya");
    expect(firstNameOf(null)).toBe("");
  });
});

describe("priceNote", () => {
  const product = { pricePaise: 89900, mrpPaise: null, earlyBird: { pricePaise: 74900, limit: 15, seatsLeft: 3 } } as unknown as CatalogProduct;
  it("shows the early-bird price with the normal price as 'was' and the seats left", () => {
    expect(priceNote(product)).toEqual({ now: "₹749", was: "₹899", seatsLeft: 3 });
  });
  it("has no seats left once the early-bird seats are gone", () => {
    const sold = { ...product, earlyBird: { pricePaise: 74900, limit: 15, seatsLeft: 0 } } as unknown as CatalogProduct;
    expect(priceNote(sold)).toEqual({ now: "₹899", was: null, seatsLeft: null });
  });
  it("is null for a product that does not exist", () => expect(priceNote(null)).toBeNull());
});

describe("sender choices", () => {
  it("sends the promotional templates under the brand, never the founder's personal address", () => {
    const by = Object.fromEntries(buildMailTemplates(prices).map((t) => [t.id, t.from]));
    expect(by["snap-launch"]).toBe("admin");
    expect(by["early-bird"]).toBe("admin");
    expect(by["pack-followup"]).toBe("support");
  });
});
