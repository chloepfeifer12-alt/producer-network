import type { InsiderSection } from "@/lib/data/types";
import { SECTION_LABEL, SECTION_ORDER } from "@/lib/services/insider";
import { demoToday, formatDate } from "@/lib/utils/dates";
import { brand } from "@/config/brand";

/** URL-friendly section slugs: `career_guides` → `career-guides`. */
export function sectionSlug(s: InsiderSection) {
  return s.replace(/_/g, "-");
}

export function sectionFromSlug(slug: string): InsiderSection | undefined {
  return SECTION_ORDER.find((s) => sectionSlug(s) === slug);
}

export function sectionHref(s: InsiderSection) {
  return `/insider/section/${sectionSlug(s)}`;
}

/** Ordinal shown beside a section name ("03"). */
export function sectionNumber(s: InsiderSection) {
  return String(SECTION_ORDER.indexOf(s) + 1).padStart(2, "0");
}

export const SECTION_DEK: Record<InsiderSection, string> = {
  insights: "Patterns worth noticing across the industry, read from the prototype’s synthetic marketplace.",
  career_guides: "Practical, unsentimental guides to building a career in insurance and financial services.",
  leadership: "How principals hire, coach and build agencies people want to stay in.",
  interviews: "Long conversations with members about the work, in their own words.",
  education: "Primers on the mechanics of the business, written to be understood.",
  emerging: "Adjacent paths, new programs and the places careers are quietly heading.",
  events: "Gatherings across the Network, online and in person.",
  spotlight: "Members and communities doing generous, useful work.",
};

export { SECTION_LABEL, SECTION_ORDER };

/** "October 2026" for the demo clock (UTC, stable across server/client). */
export function issueMonth() {
  return formatDate(new Date(demoToday()).toISOString(), { month: "long", year: "numeric" });
}

export const DEMO_NOTE = `All Insider content is fictional demo editorial created for the ${brand.name} prototype — not news, endorsements, or advice.`;
