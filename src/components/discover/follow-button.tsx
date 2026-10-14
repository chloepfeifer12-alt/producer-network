"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Check, Plus } from "lucide-react";
import type { Organization } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { isFollowing, toggleFollowOrganization } from "@/lib/services/organizations";
import { OrgLogo } from "@/components/brand/org-logo";
import { Button, ButtonLink } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";

/**
 * Follow / unfollow an organization. Visitors are invited to join instead.
 * `variant="chip"` sits on cards (above the full-card link), `"button"` on profiles.
 */
export function FollowButton({ org, variant = "chip", className, onDark }: { org: Organization; variant?: "chip" | "button"; className?: string; onDark?: boolean }) {
  const db = useDb();
  const user = useCurrentUser();
  const [invite, setInvite] = useState(false);
  const following = useMemo(() => isFollowing(db, user?.id, org.id), [db, user?.id, org.id]);

  // Following is a network action; hide it for accounts that can't participate (e.g. admins).
  if (user && !can(user, "network:participate")) return null;

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      setInvite(true);
      return;
    }
    const r = toggleFollowOrganization(user, org.id);
    if (r.ok) toast(r.data ? `Following ${org.name}` : `Unfollowed ${org.name}`, { body: r.data ? "Their news and new roles will appear in your Network." : undefined });
    else toast("Couldn't update follow", { body: r.error, tone: "error" });
  };

  const label = following ? "Following" : "Follow";
  const Icon = following ? Check : Plus;

  return (
    <>
      {variant === "chip" ? (
        <button
          type="button"
          onClick={onClick}
          aria-pressed={following}
          aria-label={following ? `Unfollow ${org.name}` : `Follow ${org.name}`}
          className={cn(
            "relative z-10 inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium transition duration-150",
            following ? "border-ink bg-ink text-white hover:bg-[#2a2d35]" : "border-line-strong bg-surface text-ink-2 hover:border-ink-4 hover:text-ink",
            className,
          )}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
          {label}
        </button>
      ) : (
        <button
          type="button"
          onClick={onClick}
          aria-pressed={following}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium transition duration-150",
            following
              ? onDark
                ? "border border-white/40 bg-white/10 text-white hover:bg-white/15"
                : "border border-line-strong bg-surface text-ink hover:border-ink-4"
              : "bg-ink text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] hover:bg-[#2a2d35]",
            className,
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
          {following ? "Following" : "Follow company"}
        </button>
      )}
      {invite && (
        <Dialog
          open
          onClose={() => setInvite(false)}
          title={`Follow ${org.name}`}
          description="Following is for members of the network."
          size="sm"
          footer={
            <>
              <ButtonLink href="/join?step=persona" variant="ghost">
                Try a demo persona
              </ButtonLink>
              <ButtonLink href="/join">
                Join the network <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </>
          }
        >
          <div className="flex gap-4">
            <OrgLogo brand={org.brand} name={org.name} size={44} />
            <p className="text-sm leading-relaxed text-ink-2">
              Members follow companies to see their news, new roles and Insider coverage in their Network. Joining is free for producers and people exploring the
              industry.
            </p>
          </div>
          <Button variant="link" className="mt-4 text-[13px]" onClick={() => setInvite(false)}>
            Keep browsing
          </Button>
        </Dialog>
      )}
    </>
  );
}
