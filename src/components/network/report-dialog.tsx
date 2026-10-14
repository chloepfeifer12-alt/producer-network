"use client";

import { useState } from "react";
import Link from "next/link";
import type { Report, ReportReason } from "@/lib/data/types";
import { REPORT_REASON_LABEL } from "@/lib/data/taxonomy";
import { useCurrentUser } from "@/lib/auth/session";
import { submitReport } from "@/lib/services/network";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/form";
import { toastResult } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";
import { useStableCallback } from "./use-stable-callback";

const REASONS = Object.keys(REPORT_REASON_LABEL) as ReportReason[];

export function ReportDialog({
  open,
  onClose: onCloseProp,
  targetType,
  targetId,
  subject = "this post",
}: {
  open: boolean;
  onClose: () => void;
  targetType: Report["targetType"];
  targetId: string;
  subject?: string;
}) {
  const user = useCurrentUser();
  const onClose = useStableCallback(onCloseProp);
  const [reason, setReason] = useState<ReportReason>("other");
  const [details, setDetails] = useState("");
  const detailsId = `report-details-${targetId}`;

  const submit = () => {
    const r = submitReport(user, { targetType, targetId, reason, details });
    if (toastResult(r, "Report submitted", "Our trust & safety team reviews every report. Thank you for keeping the network professional.")) {
      setDetails("");
      setReason("other");
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Report ${subject}`}
      description="Reports are confidential. The author isn't told who reported their content."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={details.trim().length < 5}>Submit report</Button>
        </>
      }
    >
      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-ink-2">Reason</legend>
        <div className="space-y-1.5">
          {REASONS.map((r) => (
            <label
              key={r}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-navy-100",
                reason === r ? "border-navy-400 bg-navy-50 text-ink" : "border-line text-ink-2 hover:border-line-strong",
              )}
            >
              <input type="radio" name={`reason-${targetId}`} value={r} checked={reason === r} onChange={() => setReason(r)} className="h-4 w-4 accent-[var(--color-navy)]" />
              {REPORT_REASON_LABEL[r]}
            </label>
          ))}
        </div>
      </fieldset>
      <Field className="mt-5" label="What's the issue?" id={detailsId} hint="A few words of context help reviewers act quickly (at least 5 characters).">
        <Textarea id={detailsId} value={details} onChange={(e) => setDetails(e.target.value)} rows={3} maxLength={1000} placeholder="Describe what you saw…" />
      </Field>
      <p className="mt-4 text-xs leading-relaxed text-ink-3">
        See the <Link href="/legal/community-guidelines" className="text-navy-600 underline-offset-2 hover:underline">community guidelines</Link> for what isn&apos;t allowed.
      </p>
    </Dialog>
  );
}
