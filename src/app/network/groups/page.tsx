"use client";

import { useMemo, useState } from "react";
import { Layers } from "lucide-react";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/page";
import { Segmented } from "@/components/ui/tabs";
import { EmptyState, PageSkeleton } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { GroupCard } from "@/components/network/group-card";

type View = "all" | "mine";

export default function GroupsPage() {
  const db = useDb();
  const user = useCurrentUser();
  const [view, setView] = useState<View>("all");
  const groups = useMemo(() => [...db.groups].sort((a, b) => b.memberIds.length - a.memberIds.length || a.name.localeCompare(b.name)), [db]);
  const mine = useMemo(() => (user ? groups.filter((g) => g.memberIds.includes(user.id)) : []), [groups, user]);
  const shown = view === "mine" ? mine : groups;

  if (!user) return <PageSkeleton />;

  return (
    <>
      <PageHeader
        eyebrow="Professional network"
        title="Groups"
        description="Focused communities for peers in the same line of business, career stage or leadership role. Join to post and follow the conversation."
        actions={
          <Segmented<View>
            ariaLabel="Show groups"
            value={view}
            onChange={setView}
            items={[
              { value: "all", label: `All groups · ${groups.length}` },
              { value: "mine", label: `Your groups · ${mine.length}` },
            ]}
          />
        }
      />
      {shown.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-5 w-5" strokeWidth={1.75} />}
          title={view === "mine" ? "You haven't joined a group yet" : "No groups yet"}
          description={view === "mine" ? "Groups are the easiest way to meet peers. Browse all groups and join one that fits your work." : "Groups will appear here once they're created."}
          action={view === "mine" ? <Button variant="secondary" size="sm" onClick={() => setView("all")}>Browse all groups</Button> : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((g) => <GroupCard key={g.id} group={g} />)}
        </div>
      )}
      <p className="mt-8 text-xs leading-relaxed text-ink-3">
        Groups are moderated under the community guidelines. Never share client-identifying details, policy numbers or personal information.
      </p>
    </>
  );
}
