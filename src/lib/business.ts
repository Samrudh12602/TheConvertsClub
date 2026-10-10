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
} as const;
