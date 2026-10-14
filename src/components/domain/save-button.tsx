"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { isSaved, toggleSaveOpportunity } from "@/lib/services/opportunities";
import { isOrgSaved, toggleSaveOrganization } from "@/lib/services/organizations";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";

export function SaveButton({ targetId, type = "opportunity", variant = "icon", className }: { targetId: string; type?: "opportunity" | "organization"; variant?: "icon" | "button"; className?: string }) {
  const db = useDb();
  const user = useCurrentUser();
  const router = useRouter();
  const saved = useMemo(() => (type === "opportunity" ? isSaved(db, user?.id, targetId) : isOrgSaved(db, user?.id, targetId)), [db, user?.id, targetId, type]);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast("Choose a demo role to save", { body: "Use the role switcher at the top of the page, or join the network.", tone: "info" });
      router.push("/join?step=persona");
      return;
    }
    if (!can(user, "member:save")) {
      toast("Saving is for member accounts", { body: "Switch to a producer persona to save items.", tone: "info" });
      return;
    }
    const r = type === "opportunity" ? toggleSaveOpportunity(user, targetId) : toggleSaveOrganization(user, targetId);
    if (r.ok) toast(r.data ? "Saved" : "Removed from saved", { body: r.data ? "Find it under Saved in your workspace." : undefined });
    else toast("Couldn't save", { body: r.error, tone: "error" });
  };

  const Icon = saved ? BookmarkCheck : Bookmark;
  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition",
          saved ? "border-navy-200 bg-navy-50 text-navy" : "border-line-strong bg-surface text-ink hover:border-ink-4",
          className,
        )}
      >
        <Icon className="h-4 w-4" /> {saved ? "Saved" : "Save"}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save"}
      title={saved ? "Saved" : "Save"}
      className={cn("relative z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg transition", saved ? "bg-navy-50 text-navy" : "text-ink-4 hover:bg-sunken hover:text-ink", className)}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
    </button>
  );
}
