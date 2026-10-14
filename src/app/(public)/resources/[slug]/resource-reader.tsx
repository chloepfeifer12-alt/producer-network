"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, BookmarkCheck, Clock3, FlaskConical, Info, PenLine, PlayCircle } from "lucide-react";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { toggleSaveResource } from "@/lib/services/network";
import { lineName } from "@/lib/data/taxonomy";
import { HydrationGate } from "@/components/layout/guards";
import { RoleSwitcher } from "@/components/layout/role-switcher";
import { Breadcrumbs, Container } from "@/components/ui/page";
import { Tag } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState, Notice, PageSkeleton } from "@/components/ui/feedback";
import { toast } from "@/components/ui/toast";
import { RESOURCE_AUDIENCE_LABEL, RESOURCE_KIND_LABEL, ResourceCard, ResourceKindIcon, resourceDuration } from "@/components/marketing/resource-card";
import { cn } from "@/lib/utils/cn";

export function ResourceReader({ slug }: { slug: string }) {
  return (
    <HydrationGate fallback={<Container size="narrow" className="py-16"><PageSkeleton /></Container>}>
      <Reader slug={slug} />
    </HydrationGate>
  );
}

function Reader({ slug }: { slug: string }) {
  const db = useDb();
  const user = useCurrentUser();
  const [chooseRole, setChooseRole] = useState(false);
  const r = useMemo(() => db.resources.find((x) => x.slug === slug), [db.resources, slug]);
  const saved = useMemo(() => !!user && !!r && db.savedResources.some((s) => s.userId === user.id && s.targetId === r.id), [db.savedResources, user, r]);
  const related = useMemo(
    () => (r ? db.resources.filter((x) => x.id !== r.id && (x.audience === r.audience || x.lines.some((l) => r.lines.includes(l)))).slice(0, 3) : []),
    [db.resources, r],
  );

  if (!r) {
    return (
      <Container size="narrow" className="py-20">
        <EmptyState title="This resource isn’t available" description="It may have been removed from the demo library." action={<ButtonLink href="/resources" variant="secondary">Back to the library</ButtonLink>} />
      </Container>
    );
  }

  const onSave = () => {
    if (!user) {
      setChooseRole(true);
      return;
    }
    if (!can(user, "member:save")) {
      toast("Saving is for member accounts", { body: "Switch to a producer or aspiring-producer persona to save resources.", tone: "info" });
      return;
    }
    const res = toggleSaveResource(user, r.id);
    if (res.ok) toast(saved ? "Removed from saved" : "Saved to your library", { body: saved ? undefined : "Find it under Saved in your workspace." });
    else toast("Couldn’t save", { body: res.error, tone: "error" });
  };

  const SaveIcon = saved ? BookmarkCheck : Bookmark;

  return (
    <>
      <article>
        <header className="border-b border-line">
          <Container size="narrow" className="pb-12 pt-10 sm:pb-14 sm:pt-12">
            <Breadcrumbs items={[{ href: "/resources", label: "Resources" }, { label: RESOURCE_KIND_LABEL[r.kind] }]} />
            <div className="mt-10 flex flex-wrap items-center gap-3 text-[13px] text-ink-3">
              <span className="inline-flex items-center gap-1.5 font-medium text-navy-600">
                <ResourceKindIcon kind={r.kind} className="h-3.5 w-3.5" /> {RESOURCE_KIND_LABEL[r.kind]}
              </span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{resourceDuration(r)}</span>
              <span aria-hidden>·</span>
              <span>For {RESOURCE_AUDIENCE_LABEL[r.audience].toLowerCase()}</span>
            </div>
            <h1 className="mt-5 font-display text-[36px] leading-[1.08] sm:text-[50px]">{r.title}</h1>
            <p className="mt-5 font-display text-[20px] italic leading-snug text-ink-2 sm:text-[22px]">{r.summary}</p>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white"><PenLine className="h-4 w-4" /></span>
                <div>
                  <div className="text-[13.5px] font-medium text-ink">{r.author}</div>
                  <div className="flex items-center gap-1 text-xs text-ink-3"><FlaskConical className="h-3 w-3" /> Editorial demo content</div>
                </div>
              </div>
              <button
                type="button"
                onClick={onSave}
                aria-pressed={saved}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition",
                  saved ? "border-navy-200 bg-navy-50 text-navy" : "border-line-strong bg-surface text-ink hover:border-ink-4",
                )}
              >
                <SaveIcon className="h-4 w-4" /> {saved ? "Saved" : "Save"}
              </button>
            </div>
          </Container>
        </header>

        <Container size="narrow" className="py-12 sm:py-16">
          <div className="mx-auto max-w-[680px]">
            {r.kind === "webinar" && (
              <div className="mb-10 flex aspect-video flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-ink text-white/70">
                <PlayCircle className="h-12 w-12" strokeWidth={1.2} />
                <span className="text-sm">Recording placeholder — no video in the prototype</span>
              </div>
            )}
            {r.kind === "checklist" || r.kind === "template" ? (
              <ol className="space-y-4">
                {r.body.map((p, i) => (
                  <li key={i} className="flex gap-4 rounded-xl border border-line bg-surface p-5 shadow-card">
                    <span className="font-display text-[22px] leading-none text-gold tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    <p className="text-[16px] leading-relaxed text-ink-2">{p}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="prose-pn space-y-5">
                {r.body.map((p, i) => (
                  <p key={i} className={cn("text-[17px] leading-[1.75] text-ink-2", i === 0 && "first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-[56px] first-letter:leading-[0.9] first-letter:text-ink")}>
                    {p}
                  </p>
                ))}
              </div>
            )}

            {r.lines.length > 0 && (
              <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-line pt-6">
                <span className="mr-1 text-xs text-ink-3">Related categories</span>
                {r.lines.map((l) => (
                  <Link key={l} href={`/explore/${l}`} className="transition hover:opacity-80"><Tag>{lineName(l)}</Tag></Link>
                ))}
              </div>
            )}

            <Notice tone="info" className="mt-8" icon={<Info className="h-4 w-4" />}>
              Editorial demo content written for this prototype. General and educational only — not legal, tax, licensing or financial
              advice. Licensing requirements vary by state; confirm with your state department of insurance.
            </Notice>
          </div>
        </Container>
      </article>

      {related.length > 0 && (
        <section className="border-t border-line bg-subtle py-14 sm:py-16" aria-labelledby="related-heading">
          <Container>
            <h2 id="related-heading" className="mb-8 font-display text-[28px] leading-tight">Keep reading</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {related.map((x) => <ResourceCard key={x.id} r={x} />)}
            </div>
          </Container>
        </section>
      )}

      <Dialog
        open={chooseRole}
        onClose={() => setChooseRole(false)}
        title="Choose a role to save resources"
        description="Saving is available to members. In this prototype, pick a demo persona — or create your own member profile."
        footer={
          <>
            <Button variant="ghost" onClick={() => setChooseRole(false)}>Not now</Button>
            <ButtonLink href="/join">Join the Network</ButtonLink>
          </>
        }
      >
        <div className="-mx-2">
          <RoleSwitcher variant="panel" />
        </div>
        <p className="mt-3 text-xs text-ink-3">Demo personas are not real authentication.</p>
      </Dialog>
    </>
  );
}
