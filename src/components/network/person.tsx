"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/cn";
import type { PersonInfo } from "./people";

/** Avatar + name + subtitle row used across the network. */
export function PersonLine({
  person,
  size = 40,
  meta,
  className,
  subtitleClassName,
  nameClassName,
}: {
  person: PersonInfo;
  size?: number;
  meta?: ReactNode;
  className?: string;
  subtitleClassName?: string;
  nameClassName?: string;
}) {
  const name = person.href ? (
    <Link href={person.href} className="rounded-sm font-semibold text-ink hover:text-navy-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-200">
      {person.name}
    </Link>
  ) : (
    <span className="font-semibold text-ink">{person.name}</span>
  );
  return (
    <div className={cn("flex min-w-0 items-start gap-3", className)}>
      {person.href ? (
        <Link href={person.href} tabIndex={-1} aria-hidden className="shrink-0">
          <Avatar name={person.name} tone={person.tone} size={size} />
        </Link>
      ) : (
        <Avatar name={person.name} tone={person.tone} size={size} />
      )}
      <div className="min-w-0 flex-1">
        <div className={cn("flex flex-wrap items-baseline gap-x-2 text-[14px] leading-snug", nameClassName)}>
          {name}
          {meta}
        </div>
        <div className={cn("mt-0.5 truncate text-[13px] text-ink-3", subtitleClassName)}>
          {person.org && person.orgHref ? (
            <>
              <Link href={person.orgHref} className="hover:text-ink hover:underline underline-offset-2">{person.org.name}</Link>
              <span> · Organization</span>
            </>
          ) : (
            person.subtitle
          )}
        </div>
      </div>
    </div>
  );
}
