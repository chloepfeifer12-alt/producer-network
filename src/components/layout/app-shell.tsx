"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell, BookOpen, CalendarDays, GraduationCap, Bookmark, Briefcase, Building2, ChartLine, Circle, Compass, CreditCard, ExternalLink, Flag, Gavel, Handshake,
  KanbanSquare, KeyRound, Layers, LayoutDashboard, Megaphone, Menu, MessageSquare, Receipt, ScrollText, Send, ShieldCheck,
  UserRound, Users, type LucideIcon,
} from "lucide-react";
import type { User } from "@/lib/data/types";
import { navFor, type NavGroup } from "@/config/navigation";
import { Wordmark } from "@/components/brand/wordmark";
import { OrgLogo } from "@/components/brand/org-logo";
import { Avatar } from "@/components/ui/avatar";
import { Drawer } from "@/components/ui/dialog";
import { Popover } from "@/components/ui/menu";
import { useDb } from "@/lib/store/db-store";
import { ROLE_LABEL } from "@/lib/auth/permissions";
import { markAllNotificationsRead, markNotificationRead, notificationsFor } from "@/lib/services/notifications";
import { relativeDay } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

const NAV_ICONS: Record<string, LucideIcon> = {
  BookOpen, Bookmark, Briefcase, CalendarDays, GraduationCap, Building2, ChartLine, Compass, CreditCard, Flag, Gavel, Handshake, KanbanSquare, KeyRound,
  Layers, LayoutDashboard, Megaphone, MessageSquare, Receipt, ScrollText, Send, ShieldCheck, UserRound, Users,
};

function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = NAV_ICONS[name] ?? Circle;
  return <Icon className={className} strokeWidth={1.75} />;
}

function NavList({ groups, pathname, onNavigate }: { groups: NavGroup[]; pathname: string; onNavigate?: () => void }) {
  // Pick the single most specific match so parent routes don't double-highlight.
  const all = groups.flatMap((g) => g.items);
  const active = all
    .filter((i) => pathname === i.href || (i.prefix && pathname.startsWith(i.href + "/")))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <nav className="space-y-6" aria-label="Workspace">
      {groups.map((g, gi) => (
        <div key={gi}>
          {g.label && <div className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-4">{g.label}</div>}
          <ul className="space-y-0.5">
            {g.items.map((i) => {
              const isActive = active === i.href;
              return (
                <li key={i.href}>
                  <Link
                    href={i.href}
                    onClick={onNavigate}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] transition",
                      isActive ? "bg-surface font-medium text-ink shadow-card ring-1 ring-line" : "text-ink-3 hover:bg-sunken/60 hover:text-ink",
                    )}
                  >
                    <NavIcon name={i.icon} className={cn("h-4 w-4", isActive ? "text-navy" : "text-ink-4")} />
                    {i.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function ContextCard({ user }: { user: User }) {
  const db = useDb();
  if (user.kind === "organization") {
    const org = db.organizations.find((o) => o.id === user.orgId);
    if (!org) return null;
    return (
      <Link href={`/organizations/${org.slug}`} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 shadow-card transition hover:border-line-strong">
        <OrgLogo brand={org.brand} name={org.name} size={34} />
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold">{org.name}</div>
          <div className="truncate text-xs text-ink-3">{user.name} · {ROLE_LABEL(user)}</div>
        </div>
      </Link>
    );
  }
  const profile = db.profiles.find((p) => p.userId === user.id);
  return (
    <Link href={user.kind === "admin" ? "/admin" : "/me/profile"} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 shadow-card transition hover:border-line-strong">
      <Avatar name={user.name} tone={profile?.avatarTone ?? 1} size={34} />
      <div className="min-w-0">
        <div className="truncate text-[13px] font-semibold">{user.name}</div>
        <div className="truncate text-xs text-ink-3">{ROLE_LABEL(user)}</div>
      </div>
    </Link>
  );
}

export function Notifications({ user }: { user: User }) {
  const db = useDb();
  const router = useRouter();
  const items = useMemo(() => notificationsFor(db, user.id).slice(0, 12), [db, user.id]);
  const unread = items.filter((n) => !n.read).length;
  return (
    <Popover
      label="Notifications"
      className="w-[min(380px,calc(100vw-1.5rem))]"
      trigger={({ toggle }) => (
        <button type="button" onClick={toggle} className="relative rounded-lg p-2 text-ink-3 transition hover:bg-sunken hover:text-ink" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
          {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-gold ring-2 ring-canvas" />}
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="text-sm font-semibold">Notifications</div>
            {unread > 0 && (
              <button type="button" className="text-xs text-navy-600 hover:text-navy" onClick={() => markAllNotificationsRead(user)}>
                Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-[420px] overflow-y-auto py-1">
            {items.length === 0 && <li className="px-4 py-8 text-center text-sm text-ink-3">You&apos;re all caught up.</li>}
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => {
                    markNotificationRead(user, n.id);
                    close();
                    if (n.href) router.push(n.href);
                  }}
                  className="flex w-full gap-3 px-4 py-3 text-left transition hover:bg-subtle"
                >
                  <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-gold")} />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-ink">{n.title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-ink-3">{n.body}</span>
                    <span className="mt-1 block text-[11px] text-ink-4" suppressHydrationWarning>{relativeDay(n.createdAt)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Popover>
  );
}

export function AppShell({ user, children }: { user: User; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const groups = navFor(user.kind);
  const area = user.kind === "organization" ? "Recruiting workspace" : user.kind === "admin" ? "Admin console" : "Member workspace";

  const sidebar = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col">
      <div className="space-y-4 px-3">
        <ContextCard user={user} />
      </div>
      <div className="mt-6 flex-1 overflow-y-auto px-3 pb-6">
        <NavList groups={groups} pathname={pathname} onNavigate={onNavigate} />
      </div>
      <div className="border-t border-line px-3 py-3">
        <Link href="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-ink-3 hover:bg-sunken/60 hover:text-ink">
          <ExternalLink className="h-3.5 w-3.5" /> Public site
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-36px)] lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-[calc(100vh-36px)] flex-col border-r border-line bg-subtle/60 pt-4 lg:flex">
        <div className="mb-5 px-6"><Wordmark href={pathname.startsWith("/admin") ? "/admin" : "/"} /></div>
        <div className="mb-3 px-6 text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-ink">{area}</div>
        {sidebar()}
      </aside>
      <div className="min-w-0">
        <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line/70 bg-canvas/85 px-4 backdrop-blur-md sm:px-6 lg:px-10">
          <div className="flex items-center gap-2 lg:hidden">
            <button type="button" onClick={() => setOpen(true)} className="rounded-lg p-2 text-ink-2 hover:bg-sunken" aria-label="Open navigation">
              <Menu className="h-5 w-5" />
            </button>
            <Wordmark />
          </div>
          <div className="hidden text-[13px] text-ink-3 lg:block">{area}</div>
          <div className="flex items-center gap-1">
            <Notifications user={user} />
          </div>
        </div>
        <main id="main" className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
      <Drawer open={open} onClose={() => setOpen(false)} title={area} side="left">
        <div className="-mx-2">{sidebar(() => setOpen(false))}</div>
      </Drawer>
    </div>
  );
}
