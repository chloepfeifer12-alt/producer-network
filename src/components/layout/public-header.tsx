"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, Compass, Menu } from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { ButtonLink } from "@/components/ui/button";
import { Drawer } from "@/components/ui/dialog";
import { Popover } from "@/components/ui/menu";
import { Avatar } from "@/components/ui/avatar";
import { MEMBER_MENU, PUBLIC_NAV } from "@/config/navigation";
import { homeFor, useCurrentUser } from "@/lib/auth/session";
import { useDb, useHydrated } from "@/lib/store/db-store";
import { ROLE_LABEL } from "@/lib/auth/permissions";
import { Notifications } from "./app-shell";
import { cn } from "@/lib/utils/cn";

function isActive(pathname: string, href: string) {
  if (href === "/network") return pathname === "/network" || (pathname.startsWith("/network/") && !pathname.startsWith("/network/members"));
  if (href === "/people") return pathname.startsWith("/people") || pathname.startsWith("/network/members");
  if (href === "/discover") return pathname.startsWith("/discover") || pathname.startsWith("/organizations") || pathname === "/launch";
  return pathname === href || pathname.startsWith(href + "/");
}

/** The site header for visitors and members: five destinations plus account. */
export function PublicHeader() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const db = useDb();
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const isMember = user && (user.kind === "producer" || user.kind === "aspiring");
  const profile = user ? db.profiles.find((p) => p.userId === user.id) : undefined;
  const workspace = user?.kind === "organization" ? { href: "/org", label: "Recruiting workspace" } : user?.kind === "admin" ? { href: "/admin", label: "Admin console" } : null;

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/90 backdrop-blur-md">
      <div className="mx-auto flex h-[62px] max-w-[1320px] items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Wordmark href={user && hydrated ? (isMember ? "/network" : "/") : "/"} />
        <nav className="ml-4 hidden h-full items-stretch gap-1 lg:flex" aria-label="Primary">
          {PUBLIC_NAV.map((n) => {
            const active = isActive(pathname, n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center px-3 text-[13.5px] tracking-[-0.005em] transition-colors",
                  active ? "text-ink after:absolute after:inset-x-3 after:bottom-[-1px] after:h-[1.5px] after:bg-ink" : "text-ink-3 hover:text-ink",
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <Link
            href="/fit"
            className={cn("hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] transition md:inline-flex", pathname === "/fit" ? "border-ink bg-ink text-white" : "border-line-strong text-ink-2 hover:border-ink-3 hover:text-ink")}
          >
            <Compass className="h-3.5 w-3.5" strokeWidth={1.75} /> Your Industry Fit
          </Link>
          {hydrated && user ? (
            <>
              <Notifications user={user} />
              {workspace && (
                <ButtonLink href={workspace.href} size="sm" className="hidden sm:inline-flex">
                  {workspace.label} <ArrowRight className="h-3.5 w-3.5" />
                </ButtonLink>
              )}
              {isMember && (
                <Popover
                  label="Account"
                  className="w-64 p-1.5"
                  trigger={({ toggle, open: o }) => (
                    <button type="button" onClick={toggle} aria-expanded={o} className="flex items-center gap-1.5 rounded-full p-0.5 pr-1.5 transition hover:bg-sunken" aria-label="Account menu">
                      <Avatar name={user.name} tone={profile?.avatarTone} size={30} decorative />
                      <ChevronDown className="h-3.5 w-3.5 text-ink-4" />
                    </button>
                  )}
                >
                  {(close) => (
                    <div>
                      <div className="border-b border-line px-3 pb-2.5 pt-2">
                        <div className="text-[13px] font-semibold">{user.name}</div>
                        <div className="text-xs text-ink-3">{ROLE_LABEL(user)}</div>
                      </div>
                      <ul className="py-1">
                        {MEMBER_MENU.map((m) => (
                          <li key={m.href}>
                            <Link href={m.href} onClick={close} className="block rounded-lg px-3 py-2 text-[13px] text-ink-2 hover:bg-subtle hover:text-ink">{m.label}</Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Popover>
              )}
            </>
          ) : (
            <>
              <ButtonLink href="/join?step=persona" size="sm" variant="ghost" className="hidden sm:inline-flex">Sign in</ButtonLink>
              <ButtonLink href="/join" size="sm" className="hidden sm:inline-flex">Join the Network</ButtonLink>
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
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="border-b border-line py-3.5 font-display text-[22px] text-ink">
              {n.label}
            </Link>
          ))}
          <Link href="/fit" onClick={() => setOpen(false)} className="border-b border-line py-3.5 text-[15px] text-ink">Your Industry Fit</Link>
          {isMember && MEMBER_MENU.filter((m) => m.href !== "/fit").map((m) => (
            <Link key={m.href} href={m.href} onClick={() => setOpen(false)} className="border-b border-line py-3 text-[14px] text-ink-2">{m.label}</Link>
          ))}
        </nav>
        <div className="mt-6 flex flex-col gap-2">
          {workspace && <ButtonLink href={workspace.href} onClick={() => setOpen(false)}>{workspace.label}</ButtonLink>}
          {!user && (
            <>
              <ButtonLink href="/join" onClick={() => setOpen(false)}>Join the Network</ButtonLink>
              <ButtonLink href="/join?step=persona" variant="secondary" onClick={() => setOpen(false)}>Sign in with a demo role</ButtonLink>
            </>
          )}
          {user && !workspace && !isMember && <ButtonLink href={homeFor(user)}>Open workspace</ButtonLink>}
        </div>
      </Drawer>
    </header>
  );
}
