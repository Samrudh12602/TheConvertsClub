/**
 * Who "we" are in the legal documents. CONFIRM THESE before launch (see docs/DECISIONS.md #32):
 * if you register a company or LLP, change `operator` to its exact registered name and add its address.
 */
export const BUSINESS = {
  brand: "The Converts Club",
  /** Who legally operates the service. A sole proprietor is the person; a company is its registered name. */
  operator: "Samrudh Dhaimodkar, sole proprietor, trading as The Converts Club",
  /** Where disputes are heard and arbitration is seated. */
  jurisdiction: "Goa, India",
  grievanceOfficer: "Samrudh Dhaimodkar",
  /** Contact page is the primary channel; it reaches the owner's inbox. */
  contactPath: "/contact",
  /** Public support contact, shown on the site and in the legal documents. */
  supportEmail: "support@theconvertsclub.in",
  phone: "+91 77988 89355",
  phoneHref: "tel:+917798889355",
  domain: "theconvertsclub.in",
} as const;
