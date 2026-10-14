"use client";

import { useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";
import type { PostTopic } from "@/lib/data/types";
import { TOPIC_LABEL } from "@/lib/data/taxonomy";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { feedPosts } from "@/lib/services/network";
import { PageHeader } from "@/components/ui/page";
import { EmptyState } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { PostComposer } from "@/components/network/post-composer";
import { PostCard, PostSkeletonList } from "@/components/network/post-card";
import { FilterChips } from "@/components/network/filter-chips";
import { NetworkQuickLinks, NetworkRail } from "@/components/network/network-rail";

const TOPICS = Object.keys(TOPIC_LABEL) as PostTopic[];

export default function NetworkFeedPage() {
  const db = useDb();
  const user = useCurrentUser();
  const [topic, setTopic] = useState<PostTopic | null>(null);
  const all = useMemo(() => feedPosts(db), [db]);
  const posts = useMemo(() => (topic ? all.filter((p) => p.topic === topic) : all), [all, topic]);
  const counts = useMemo(() => {
    const m = new Map<PostTopic, number>();
    all.forEach((p) => m.set(p.topic, (m.get(p.topic) ?? 0) + 1));
    return m;
  }, [all]);

  if (!user) return <PostSkeletonList />;

  return (
    <>
      <PageHeader
        eyebrow="Professional network"
        title="Industry discussion"
        description="Career lessons, leadership questions and practical training from people across the insurance industry. Professional conversation only — never client information."
      />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
          <NetworkQuickLinks user={user} />
          <PostComposer defaultTopic={topic ?? undefined} />
          <div className="flex flex-col gap-3 pt-1">
            <h2 className="text-[13px] font-medium text-ink-3">Filter by topic</h2>
            <FilterChips
              ariaLabel="Filter posts by topic"
              allLabel="All topics"
              value={topic}
              onChange={setTopic}
              options={TOPICS.map((t) => ({ value: t, label: TOPIC_LABEL[t], count: counts.get(t) ?? 0 }))}
            />
          </div>
          <section aria-label="Posts" className="space-y-4">
            {posts.length === 0 ? (
              <EmptyState
                icon={<MessageSquare className="h-5 w-5" strokeWidth={1.75} />}
                title={topic ? `No ${TOPIC_LABEL[topic]} posts yet` : "No discussions yet"}
                description={topic ? "Be the first to start this conversation, or browse every topic." : "Start the first professional discussion on the network."}
                action={topic ? <Button variant="secondary" size="sm" onClick={() => setTopic(null)}>Show all topics</Button> : undefined}
              />
            ) : (
              posts.map((p) => <PostCard key={p.id} post={p} />)
            )}
          </section>
        </div>
        <aside className="hidden xl:block" aria-label="Your network">
          <NetworkRail user={user} />
        </aside>
      </div>
    </>
  );
}
