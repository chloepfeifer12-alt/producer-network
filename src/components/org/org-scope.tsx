"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import { Building2, Lock } from "lucide-react";
import type { Database, Organization, User } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { getOrganization } from "@/lib/services/organizations";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { buttonClass } from "@/components/ui/button";

export interface OrgContext {
  db: Database;
  user: User;
  org: Organization;
}

/** Reads the demo database, current organization user and their organization. */
export function useOrgWorkspace() {
  const db = useDb();
  const user = useCurrentUser();
  const org = useMemo(() => getOrganization(db, user?.orgId), [db, user?.orgId]);
  return { db, user, org };
}

/**
 * Resolves the organization context for /org pages. The layout already
 * guards the role; this only handles a missing/removed organization record.
 */
export function OrgScope({ children }: { children: (ctx: OrgContext) => ReactNode }) {
  const { db, user, org } = useOrgWorkspace();
  if (!user || !org) {
    return (
      <EmptyState
        icon={<Building2 className="h-5 w-5" />}
        title="No organization found for this account"
        description="This demo account isn't linked to an organization record. Switch personas, or reset demo data from the role switcher."
        action={<Link href="/" className={buttonClass("secondary", "sm")}>Back to the public site</Link>}
      />
    );
  }
  return <>{children({ db, user, org })}</>;
}

/** Listing-status banner shown across the organization workspace. */
export function OrgStatusNotice({ org, className }: { org: Organization; className?: string }) {
  switch (org.listingStatus) {
    case "approved":
      return null;
    case "pending":
      return (
        <Notice tone="warning" title="Your organization is pending platform review" className={className}>
          Listings you publish will be held for review until your organization is approved. You can prepare your profile, drafts and team workspace in the meantime.
        </Notice>
      );
    case "changes_requested":
      return (
        <Notice tone="warning" title="The platform team requested changes to your organization profile" className={className}>
          {org.listingNote ? <>&ldquo;{org.listingNote}&rdquo; </> : null}
          Update your <Link href="/org/profile" className="font-medium underline underline-offset-2">public profile</Link>. Listings you publish are held for review until the profile is approved.
        </Notice>
      );
    case "rejected":
      return (
        <Notice tone="danger" title="Your organization listing was not approved" className={className}>
          {org.listingNote ? <>&ldquo;{org.listingNote}&rdquo; </> : null}
          Listings stay private. Contact platform support (prototype placeholder) if you believe this is in error.
        </Notice>
      );
    case "suspended":
      return (
        <Notice tone="danger" title="Your organization is suspended" className={className}>
          {org.listingNote ? <>&ldquo;{org.listingNote}&rdquo; </> : null}
          Your profile and listings are hidden from members while the suspension is in effect.
        </Notice>
      );
  }
}

/** Explains why a recruiter sees a read-only view. */
export function ReadOnlyNotice({ what, className }: { what: string; className?: string }) {
  return (
    <Notice tone="info" icon={<Lock className="h-4 w-4" />} title="View only" className={className}>
      Only organization admins can {what}. Ask an admin on your team to make changes — recruiters can still manage opportunities, the pipeline and talent outreach.
    </Notice>
  );
}
