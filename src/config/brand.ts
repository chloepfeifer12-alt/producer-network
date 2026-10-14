/**
 * Brand configuration.
 * Every user-facing reference to the product name, tagline or company
 * identity should read from here so the platform can be renamed in one place.
 */
export const brand = {
  name: "Producer Network",
  shortName: "Producer Network",
  wordmark: "Producer Network",
  monogram: "PN",
  tagline: "The professional home for the insurance industry.",
  heroHeadline: "Your Career. Your Network. Your Next Opportunity.",
  heroSupporting:
    "The professional network connecting insurance producers with the organizations, opportunities, and relationships shaping the industry.",
  legalEntity: "Producer Network (working name — entity to be determined)",
  supportEmail: "support@example.invalid",
  year: 2026,
} as const;

export type Brand = typeof brand;
