"use client";

import { useState } from "react";
import { ArrowRight, Flag } from "lucide-react";
import type { Report, ReportReason } from "@/lib/data/types";
import { useCurrentUser } from "@/lib/auth/session";
import { submitReport } from "@/lib/services/network";
import { REPORT_REASON_LABEL } from "@/lib/data/taxonomy";
import { Dialog } from "@/components/ui/dialog";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/feedback";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";

const REASONS: ReportReason[] = ["misleading_income_claim", "undisclosed_fees", "misrepresentation", "spam", "harassment", "privacy", "other"];

/** Small text trigger + dialog for reporting a listing or organization to trust & safety. */
export function ReportLink({ targetType, targetId, label, className }: { targetType: Report["targetType"]; targetId: string; label: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("inline-flex items-center gap-1.5 rounded text-[12.5px] text-ink-3 underline-offset-4 transition hover:text-ink hover:underline", className)}
      >
        <Flag className="h-3.5 w-3.5" strokeWidth={1.75} />
        {label}
      </button>
      {open && <ReportDialog targetType={targetType} targetId={targetId} onClose={() => setOpen(false)} />}
    </>
  );
}

function ReportDialog({ targetType, targetId, onClose }: { targetType: Report["targetType"]; targetId: string; onClose: () => void }) {
  const user = useCurrentUser();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const noun = targetType === "opportunity" ? "listing" : targetType;

  if (!user) {
    return (
      <Dialog open onClose={onClose} title={`Report this ${noun}`} size="sm">
        <p className="text-sm leading-relaxed text-ink-2">
          Reports are tied to an account so our trust &amp; safety team can follow up. Choose a demo role to send a report in this prototype.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <ButtonLink href="/join?step=persona">
            Choose a demo role <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </Dialog>
    );
  }

  const submit = () => {
    setError(null);
    if (!reason) {
      setError("Choose the reason that fits best.");
      return;
    }
    const r = submitReport(user, { targetType, targetId, reason, details });
    if (r.ok) {
      toast("Report submitted", { body: "Thank you. Trust & safety reviews every report (demo — reviewed in the admin console)." });
      onClose();
    } else setError(r.error);
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Report this ${noun}`}
      description="Reports are confidential. The organization isn't told who reported it."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit}>
            Submit report
          </Button>
        </>
      }
    >
      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-ink-2">What&apos;s the issue?</legend>
        <div className="space-y-1.5" role="radiogroup">
          {REASONS.map((r) => {
            const active = reason === r;
            return (
              <label
                key={r}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-navy-100",
                  active ? "border-navy bg-navy-50 text-ink" : "border-line text-ink-2 hover:border-line-strong",
                )}
              >
                <input type="radio" name="report-reason" value={r} checked={active} onChange={() => setReason(r)} className="sr-only" />
                <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-full border", active ? "border-navy" : "border-line-strong")} aria-hidden>
                  {active && <span className="h-2 w-2 rounded-full bg-navy" />}
                </span>
                {REPORT_REASON_LABEL[r]}
              </label>
            );
          })}
        </div>
      </fieldset>
      <Field id="report-details" label="Details" hint="What did you see? Please don't include client or personal information." className="mt-5">
        <Textarea id="report-details" value={details} onChange={(e) => setDetails(e.target.value)} rows={3} maxLength={1000} />
      </Field>
      {error && (
        <Notice tone="danger" className="mt-4">
          {error}
        </Notice>
      )}
    </Dialog>
  );
}
