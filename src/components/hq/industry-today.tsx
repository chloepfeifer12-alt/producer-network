"use client";

import Link from "next/link";
import type { Article } from "@/lib/data/types";
import { SECTION_LABEL } from "@/lib/services/insider";
import { CoverArt } from "@/components/brand/cover-art";
import { Kicker } from "@/components/editorial";
import { relativeDay } from "@/lib/utils/dates";

function Art({ a, className }: { a: Article; className: string }) {
  return (
    <div className="overflow-hidden rounded-[4px]">
      <div className={`${className} transition-transform duration-700 ease-out group-hover:scale-[1.03]`}>
        <CoverArt seed={a.id} variant={a.art.variant} hue={a.art.hue} ground={a.art.ground} />
      </div>
    </div>
  );
}

/** "Industry today": the Insider cover story with secondary stories underneath. */
export function IndustryToday({ cover, secondary }: { cover?: Article; secondary: Article[] }) {
  if (!cover) return null;
  return (
    <section aria-labelledby="hq-today">
      <Kicker className="mb-6">
        <span id="hq-today">Industry today</span>
      </Kicker>

      <Link href={`/insider/${cover.slug}`} className="group block">
        <Art a={cover} className="aspect-[16/9] lg:aspect-[2/1]" />
        <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-12">
          <div className="md:col-span-7">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
              <span>The Insider</span>
              <span className="text-ink-4">/</span>
              <span>{SECTION_LABEL[cover.section]}</span>
            </div>
            <h2 className="mt-3 font-display text-[28px] leading-[1.08] tracking-[-0.015em] text-ink decoration-1 underline-offset-[6px] group-hover:underline sm:text-[36px]">
              {cover.title}
            </h2>
          </div>
          <div className="flex flex-col md:col-span-5 md:pt-7">
            <p className="text-[15px] leading-relaxed text-ink-2">{cover.dek}</p>
            <p className="mt-4 text-[12.5px] text-ink-4">
              <span className="font-medium text-ink-2">{cover.authorName}</span> · {cover.readMinutes} min read · {relativeDay(cover.publishedAt)}
              <span className="ml-2 inline-block rounded-full border border-line px-2 py-px text-[10px] uppercase tracking-[0.1em]">Fictional</span>
            </p>
          </div>
        </div>
      </Link>

      {secondary.length > 0 && (
        <div className="mt-9 grid grid-cols-1 gap-x-8 gap-y-7 border-t border-line pt-7 sm:grid-cols-3">
          {secondary.map((a) => (
            <Link key={a.id} href={`/insider/${a.slug}`} className="group flex gap-4 sm:block">
              <div className="w-28 shrink-0 sm:w-auto">
                <Art a={a} className="aspect-[4/3] sm:aspect-[16/9]" />
              </div>
              <div className="min-w-0">
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-3 sm:mt-3.5">{SECTION_LABEL[a.section]}</div>
                <h3 className="mt-1 font-display text-[17px] leading-[1.25] text-ink decoration-1 underline-offset-4 group-hover:underline sm:text-[19px]">{a.title}</h3>
                <p className="mt-1.5 text-[12px] text-ink-4">{a.readMinutes} min read</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
