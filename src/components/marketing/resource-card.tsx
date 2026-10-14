import Link from "next/link";
import { ArrowUpRight, BookOpen, CheckSquare, FileText, LayoutTemplate, PlayCircle } from "lucide-react";
import type { Resource } from "@/lib/data/types";
import { lineName } from "@/lib/data/taxonomy";
import { cn } from "@/lib/utils/cn";

export const RESOURCE_KIND_LABEL: Record<Resource["kind"], string> = {
  guide: "Guide",
  article: "Article",
  checklist: "Checklist",
  webinar: "Webinar replay",
  template: "Template",
};

export const RESOURCE_AUDIENCE_LABEL: Record<Resource["audience"], string> = {
  aspiring: "Exploring a career",
  new: "Newly licensed",
  experienced: "Experienced producers",
  leaders: "Leaders & recruiters",
  all: "Everyone",
};

const KIND_ICON: Record<Resource["kind"], typeof BookOpen> = {
  guide: BookOpen,
  article: FileText,
  checklist: CheckSquare,
  webinar: PlayCircle,
  template: LayoutTemplate,
};

export function ResourceKindIcon({ kind, className }: { kind: Resource["kind"]; className?: string }) {
  const Icon = KIND_ICON[kind];
  return <Icon className={cn("h-4 w-4", className)} strokeWidth={1.75} />;
}

export function resourceDuration(r: Resource) {
  return r.kind === "webinar" ? `${r.minutes} min watch` : `${r.minutes} min read`;
}

/** Editorial card for a library resource. Server-safe. */
export function ResourceCard({ r, className, featured }: { r: Resource; className?: string; featured?: boolean }) {
  return (
    <article className={cn("group relative flex flex-col rounded-2xl border border-line bg-surface p-6 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-navy-600">
          <ResourceKindIcon kind={r.kind} className="h-3.5 w-3.5" />
          {RESOURCE_KIND_LABEL[r.kind]}
        </span>
        <span className="text-xs text-ink-4">{resourceDuration(r)}</span>
      </div>
      <h3 className={cn("mt-4 font-display leading-[1.2] text-ink", featured ? "text-[26px]" : "text-[20px]")}>
        <Link href={`/resources/${r.slug}`} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none">
          {r.title}
        </Link>
      </h3>
      <p className="mt-2.5 text-[14px] leading-relaxed text-ink-3">{r.summary}</p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-6">
        <span className="truncate text-xs text-ink-3">
          For {RESOURCE_AUDIENCE_LABEL[r.audience].toLowerCase()}
          {r.lines[0] && <> · {lineName(r.lines[0], true)}</>}
        </span>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />
      </div>
    </article>
  );
}
