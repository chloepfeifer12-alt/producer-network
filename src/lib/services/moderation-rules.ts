/**
 * Automated pre-screen for recruiting content.
 *
 * A deliberately conservative, explainable rule set that routes listings to
 * human review — it never auto-rejects. Real deployments should pair this
 * with policy-trained reviewers and legal guidance on advertising rules.
 */
import type { ModerationFlag, Opportunity } from "@/lib/data/types";

const INCOME_PATTERNS: RegExp[] = [
  /six[\s-]?figures?/i,
  /seven[\s-]?figures?/i,
  /unlimited (income|earning|earnings|pay)/i,
  /\$\s?\d{2,3}(,\d{3}|k)\+?\s*(\/|per|a|in)?\s*(year|yr|month|mo|week|wk)?/i,
  /(earn|make|making|earning)\s+(up to\s+)?\$\s?\d/i,
  /financial freedom/i,
  /get rich/i,
  /top (agents|producers|people|earners) (earn|make)/i,
];

const GUARANTEE = /\bguarantee(d|s)?\b/gi;
const NEGATION = /\b(no|not|never|cannot|can't|without)\b[\w\s,'-]{0,40}$/i;

const PROMO_TITLE: RegExp[] = [/!/, /top earners/i, /be your own boss/i, /get rich/i, /unlimited/i, /\$\d/];

function excerptAround(text: string, index: number, len = 60) {
  const start = Math.max(0, index - 20);
  return (start > 0 ? "…" : "") + text.slice(start, start + len).trim() + (start + len < text.length ? "…" : "");
}

export type ScreenableOpportunity = Pick<
  Opportunity,
  "title" | "summary" | "description" | "compensation" | "leads" | "leadsNotes" | "responsibilities" | "requirements" | "support"
>;

export function screenOpportunity(o: ScreenableOpportunity): ModerationFlag[] {
  const flags: ModerationFlag[] = [];
  const corpus = [o.title, o.summary, o.description, o.compensation.notes, o.leadsNotes, ...o.responsibilities, ...o.requirements, ...o.support].join(" \n ");

  for (const re of INCOME_PATTERNS) {
    const m = corpus.match(re);
    if (m && m.index != null) {
      flags.push({ code: "income_claim", label: "Possible unsubstantiated income claim", excerpt: excerptAround(corpus, m.index) });
      break;
    }
  }

  for (const m of corpus.matchAll(GUARANTEE)) {
    const before = corpus.slice(Math.max(0, (m.index ?? 0) - 45), m.index);
    if (!NEGATION.test(before)) {
      flags.push({ code: "guarantee_language", label: "Guarantee language", excerpt: excerptAround(corpus, m.index ?? 0) });
      break;
    }
  }

  if (o.leads === "available_at_cost" && (o.leadsNotes ?? "").trim().length < 30) {
    flags.push({ code: "undisclosed_costs", label: "Producer-paid leads without a clear cost disclosure" });
  }

  if (!o.compensation.notes || o.compensation.notes.trim().length < 15) {
    flags.push({ code: "missing_compensation_model", label: "Compensation approach is not described" });
  }

  const promo = PROMO_TITLE.find((re) => re.test(o.title));
  if (promo) flags.push({ code: "misleading_title", label: "Title uses promotional language", excerpt: o.title });

  return flags;
}
