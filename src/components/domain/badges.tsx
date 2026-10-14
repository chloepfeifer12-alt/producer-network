import { ShieldQuestion } from "lucide-react";
import type { OpportunityKind, OpportunityStatus, OrgListingStatus, PipelineStage } from "@/lib/data/types";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { KIND_LABEL, LISTING_STATUS_LABEL, OPP_STATUS_LABEL, STAGE_LABEL, STAGE_LABEL_APPLICANT } from "@/lib/data/taxonomy";

const STAGE_TONE: Record<PipelineStage, BadgeTone> = {
  new: "navy",
  under_review: "neutral",
  interview: "gold",
  offer: "warning",
  hired: "success",
  closed: "outline",
};

export function StageBadge({ stage, audience = "org", withdrawn }: { stage: PipelineStage; audience?: "org" | "applicant"; withdrawn?: boolean }) {
  if (withdrawn) return <Badge tone="outline">Withdrawn</Badge>;
  return <Badge tone={STAGE_TONE[stage]}>{audience === "org" ? STAGE_LABEL[stage] : STAGE_LABEL_APPLICANT[stage]}</Badge>;
}

const OPP_TONE: Record<OpportunityStatus, BadgeTone> = {
  draft: "neutral",
  pending_review: "gold",
  published: "success",
  changes_requested: "warning",
  rejected: "danger",
  archived: "outline",
};

export function OppStatusBadge({ status }: { status: OpportunityStatus }) {
  return <Badge tone={OPP_TONE[status]}>{OPP_STATUS_LABEL[status]}</Badge>;
}

const LISTING_TONE: Record<OrgListingStatus, BadgeTone> = {
  pending: "gold",
  approved: "success",
  changes_requested: "warning",
  rejected: "danger",
  suspended: "danger",
};

export function ListingStatusBadge({ status }: { status: OrgListingStatus }) {
  return <Badge tone={LISTING_TONE[status]}>{LISTING_STATUS_LABEL[status]}</Badge>;
}

/** Employment vs. affiliation is always visually distinct. */
export function KindBadge({ kind }: { kind: OpportunityKind }) {
  return <Badge tone={kind === "employment" ? "navy" : "gold"}>{KIND_LABEL[kind]}</Badge>;
}

/** Every license record in the prototype is self-reported and unverified. */
export function UnverifiedLicenseBadge({ compact }: { compact?: boolean }) {
  return (
    <Badge tone="outline" icon={<ShieldQuestion className="h-3 w-3" />} className="text-ink-3">
      {compact ? "Self-reported" : "Self-reported — Not verified"}
    </Badge>
  );
}
