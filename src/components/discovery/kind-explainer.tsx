import type { OpportunityKind } from "@/lib/data/types";

/** Compact one-line explanation used on detail pages. */
export function kindExplanation(k: OpportunityKind) {
  return k === "employment"
    ? "This is a W-2 employment role: you would be an employee of the organization. Confirm pay, benefits and schedule in your written offer."
    : "This is an independent contracting affiliation (1099): you would operate your own practice, typically paid by commission under carrier contracts, and may carry your own business costs. Confirm all terms in writing.";
}
