"use client";

import { useMemo } from "react";
import { UserRound } from "lucide-react";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { getProfile } from "@/lib/services/profiles";
import { EmptyState } from "@/components/ui/feedback";
import {
  CareerResources,
  CompletionNudge,
  ConnectionRequestsNudge,
  Introductions,
  JobSearchBar,
  JobsForYou,
  MyJobsStrip,
  PathIntoInsurance,
  UpcomingEvents,
} from "@/components/member/dashboard-modules";

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function MemberHomePage() {
  const db = useDb();
  const user = useCurrentUser();
  const profile = useMemo(() => getProfile(db, user?.id), [db, user?.id]);

  if (!user || !profile) {
    return (
      <EmptyState
        icon={<UserRound className="h-5 w-5" />}
        title="We couldn't load your workspace"
        description="This demo account doesn't have a member profile. Switch personas from the role switcher to continue."
      />
    );
  }

  const firstName = user.name.split(" ")[0];
  const aspiring = user.kind === "aspiring";
  const props = { db, user, profile };

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-[30px] leading-[1.1] text-ink sm:text-[36px]" suppressHydrationWarning>
          {greeting(new Date().getHours())}, {firstName}.
        </h1>
        <p className="mt-1.5 text-[15px] text-ink-3">
          {aspiring ? "Find roles that train career changers, and keep moving toward your license." : "Search insurance and financial services jobs, or pick up where you left off."}
        </p>
      </header>

      <div className="mb-8">
        <JobSearchBar profile={profile} />
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="min-w-0 space-y-8">
          <JobsForYou {...props} />
          <MyJobsStrip {...props} />
          <Introductions {...props} />
          {aspiring && <PathIntoInsurance {...props} />}
        </div>
        <aside className="min-w-0 space-y-8" aria-label="More for you">
          <CompletionNudge {...props} />
          <ConnectionRequestsNudge {...props} />
          <UpcomingEvents {...props} />
          <CareerResources {...props} />
        </aside>
      </div>
    </div>
  );
}
