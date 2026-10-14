"use client";

import type { AuditEvent } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/feedback";
import { ScrollText } from "lucide-react";
import { formatDateTime } from "@/lib/utils/dates";
import { AuditActionBadge, profileTone, TargetLink, userName } from "./admin-kit";

/** Compact vertical list of audit events (overview, consent page). */
export function AuditFeed({ events, emptyText = "No audit entries yet." }: { events: AuditEvent[]; emptyText?: string }) {
  const db = useDb();
  if (!events.length) return <EmptyState compact icon={<ScrollText className="h-5 w-5" />} title={emptyText} />;
  return (
    <ol className="divide-y divide-line">
      {events.map((e) => (
        <li key={e.id} className="flex gap-3 py-3">
          <Avatar name={userName(db, e.actorId)} tone={profileTone(db, e.actorId)} size={28} className="mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[13px] font-medium text-ink">{userName(db, e.actorId)}</span>
              <AuditActionBadge action={e.action} />
              <span className="text-[13px]"><TargetLink db={db} event={e} /></span>
            </div>
            {e.detail && <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-ink-3">{e.detail}</p>}
            <time dateTime={e.at} className="mt-1 block text-[11.5px] text-ink-4">{formatDateTime(e.at)}</time>
          </div>
        </li>
      ))}
    </ol>
  );
}
