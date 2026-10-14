"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu } from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { ButtonLink } from "@/components/ui/button";
import { Drawer } from "@/components/ui/dialog";
import { PUBLIC_NAV } from "@/config/navigation";
import { homeFor, useCurrentUser } from "@/lib/auth/session";
import { useHydrated } from "@/lib/store/db-store";
import { cn } from "@/lib/utils/cn";

export function PublicHeader() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);

  const workspaceLabel = user?.kind === "organization" ? "Recruiting workspace" : user?.kind === "admin" ? "Admin console" : "My workspace";

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-canvas/85 backdrop-blur-md supports-[backdrop-filter]:bg-canvas/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Wordmark />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {PUBLIC_NAV.map((n) => {
            const active = pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <Link key={n.href} href={n.href} className={cn("rounded-lg px-3 py-2 text-[13.5px] transition", active ? "text-ink font-medium" : "text-ink-3 hover:text-ink")}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          {hydrated && user ? (
            <ButtonLink href={homeFor(user)} size="sm" variant="primary" className="hidden sm:inline-flex">
              {workspaceLabel} <ArrowRight className="h-3.5 w-3.5" />
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/join?step=persona" size="sm" variant="ghost" className="hidden sm:inline-flex">Sign in</ButtonLink>
              <ButtonLink href="/join" size="sm" variant="primary" className="hidden sm:inline-flex">Join the Network</ButtonLink>
            </>
          )}
          <button type="button" className="rounded-lg p-2 text-ink-2 hover:bg-sunken lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
      <Drawer open={open} onClose={() => setOpen(false)} title="Menu">
        <nav className="flex flex-col" aria-label="Mobile">
          {PUBLIC_NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="border-b border-line py-3.5 text-[15px] text-ink">
              {n.label}
            </Link>
          ))}
          <Link href="/pricing" onClick={() => setOpen(false)} className="border-b border-line py-3.5 text-[15px] text-ink">Pricing</Link>
          <Link href="/resources" onClick={() => setOpen(false)} className="border-b border-line py-3.5 text-[15px] text-ink">Resources</Link>
        </nav>
        <div className="mt-6 flex flex-col gap-2">
          {user ? (
            <ButtonLink href={homeFor(user)} onClick={() => setOpen(false)}>{workspaceLabel}</ButtonLink>
          ) : (
            <>
              <ButtonLink href="/join" onClick={() => setOpen(false)}>Join the Network</ButtonLink>
              <ButtonLink href="/join?step=persona" variant="secondary" onClick={() => setOpen(false)}>Sign in with a demo role</ButtonLink>
            </>
          )}
        </div>
      </Drawer>
    </header>
  );
}
