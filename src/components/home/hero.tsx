"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Search } from "lucide-react";
import { brand } from "@/config/brand";
import { useDb } from "@/lib/store/db-store";
import { publishedOpportunities } from "@/lib/services/opportunities";
import { approvedOrganizations } from "@/lib/services/organizations";
import { US_STATES } from "@/lib/data/taxonomy";

const POPULAR = [
  { label: "Newly licensed", href: "/opportunities?exp=newly_licensed" },
  { label: "Remote", href: "/opportunities?arr=remote" },
  { label: "Commercial lines", href: "/opportunities?q=commercial" },
  { label: "Financial planning", href: "/opportunities?lines=financial-planning" },
  { label: "Medicare", href: "/opportunities?q=medicare" },
  { label: "Licensing sponsored", href: "/opportunities?q=licensing" },
  { label: "Claims", href: "/opportunities?q=claims" },
];

/** Search-first hero: the product is a job site, so the search box is the hero. */
export function Hero() {
  const db = useDb();
  const router = useRouter();
  const [what, setWhat] = useState("");
  const [where, setWhere] = useState("");
  const stats = useMemo(() => ({ opps: publishedOpportunities(db).length, orgs: approvedOrganizations(db).length }), [db]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (what.trim()) p.set("q", what.trim());
    if (where === "remote") p.set("arr", "remote");
    else if (where) p.set("state", where);
    router.push(`/opportunities${p.size ? `?${p}` : ""}`);
  };

  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_65%_at_50%_0%,rgb(227_232_242/0.75),transparent_70%)]" />
      <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-16 text-center sm:px-6 sm:pb-20 sm:pt-24">
        <h1 className="font-display text-[42px] leading-[1.03] tracking-[-0.025em] text-ink sm:text-[64px]">{brand.heroHeadline}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-[16.5px] leading-relaxed text-ink-3">
          Jobs, affiliations and training programs across insurance and financial services — from your first license to agency leadership.
        </p>

        <form onSubmit={submit} role="search" className="mx-auto mt-10 flex max-w-3xl flex-col gap-2 rounded-2xl border border-line-strong bg-surface p-2 text-left shadow-lift sm:flex-row sm:items-center">
          <label className="flex flex-[1.3] items-center gap-3 rounded-xl px-4 py-3 focus-within:bg-subtle">
            <Search className="h-5 w-5 shrink-0 text-ink-4" />
            <span className="sr-only">What</span>
            <input value={what} onChange={(e) => setWhat(e.target.value)} placeholder="Job title, keyword, or company" className="w-full bg-transparent text-[15.5px] outline-none placeholder:text-ink-4" />
          </label>
          <div className="hidden h-8 w-px bg-line sm:block" />
          <label className="flex flex-1 items-center gap-3 rounded-xl px-4 py-3 focus-within:bg-subtle">
            <MapPin className="h-5 w-5 shrink-0 text-ink-4" />
            <span className="sr-only">Where</span>
            <select value={where} onChange={(e) => setWhere(e.target.value)} className="w-full appearance-none bg-transparent text-[15.5px] outline-none">
              <option value="">Any state</option>
              <option value="remote">Remote</option>
              {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
          </label>
          <button type="submit" className="h-12 rounded-xl bg-navy px-7 text-[15px] font-medium text-white transition hover:bg-navy-600">Find jobs</button>
        </form>

        <div className="mx-auto mt-5 flex max-w-3xl flex-wrap items-center justify-center gap-2 text-[13px]">
          <span className="text-ink-4">Popular:</span>
          {POPULAR.map((p) => (
            <Link key={p.label} href={p.href} className="rounded-full border border-line bg-surface/80 px-3 py-1 text-ink-2 transition hover:border-ink-4 hover:text-ink">{p.label}</Link>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[13px] text-ink-3">
          <span suppressHydrationWarning><strong className="font-semibold text-ink">{stats.opps}</strong> open jobs & affiliations</span>
          <span suppressHydrationWarning><strong className="font-semibold text-ink">{stats.orgs}</strong> companies hiring</span>
          <Link href="/join/organization" className="font-medium text-navy-600 hover:text-navy">Employers: post a job →</Link>
        </div>
        <p className="mt-2 text-[11.5px] text-ink-4">Prototype — counts reflect synthetic demo data.</p>
      </div>
    </section>
  );
}
