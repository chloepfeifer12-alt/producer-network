"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, FlaskConical, KeyRound, ShieldCheck } from "lucide-react";
import { RoleSwitcher } from "@/components/layout/role-switcher";
import { Container } from "@/components/ui/page";
import { HydrationGate } from "@/components/layout/guards";
import { MemberWizard } from "./member-wizard";

export function JoinFlow() {
  const params = useSearchParams();
  if (params.get("step") === "persona") return <PersonaSignIn />;
  return <MemberWizard />;
}

function PersonaSignIn() {
  return (
    <Container className="py-12 sm:py-20">
      <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-md bg-gold-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-ink ring-1 ring-inset ring-gold-200">
            <FlaskConical className="h-3.5 w-3.5" /> Prototype sign-in
          </div>
          <h1 className="font-display text-[38px] leading-[1.06] sm:text-[48px]">Sign in with a demo persona</h1>
          <p className="mt-5 text-[16px] leading-relaxed text-ink-3">
            Step into the platform as one of six fictional people — a commercial lines producer, a newly licensed agent, a career changer,
            two recruiting organizations and a platform administrator. Each persona opens a fully working workspace.
          </p>
          <ul className="mt-8 space-y-4">
            <li className="flex gap-3.5 text-[14px] leading-relaxed text-ink-2">
              <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" strokeWidth={1.75} />
              <span><span className="font-medium text-ink">This is not real authentication.</span> There are no passwords and anyone can choose any persona. Production would use a real identity provider.</span>
            </li>
            <li className="flex gap-3.5 text-[14px] leading-relaxed text-ink-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" strokeWidth={1.75} />
              <span>Everything you do is stored only in this browser. You can switch personas or reset demo data at any time from the bar at the top of the page.</span>
            </li>
          </ul>
          <div className="mt-10 border-t border-line pt-6 text-sm text-ink-3">
            Prefer to start fresh?{" "}
            <Link href="/join" className="inline-flex items-center gap-1 font-medium text-navy-600 hover:text-navy">
              Create your own member profile <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <span className="mx-2 text-ink-4">·</span>
            <Link href="/join/organization" className="font-medium text-navy-600 hover:text-navy">List an organization</Link>
          </div>
        </div>
        <div>
          <div className="rounded-[22px] border border-line bg-surface p-2 shadow-pop sm:p-3">
            <div className="px-3 pb-2 pt-3 text-[12px] font-medium text-ink-3">Choose a persona</div>
            <HydrationGate fallback={<div className="space-y-2 p-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-12" />)}</div>}>
              <RoleSwitcher variant="panel" />
            </HydrationGate>
          </div>
          <p className="mt-4 text-center text-xs text-ink-4">All people and organizations are fictional.</p>
        </div>
      </div>
    </Container>
  );
}
