"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import type { User, UserKind } from "@/lib/data/types";
import { useHydrated } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { can, type Permission } from "@/lib/auth/permissions";
import { PageSkeleton } from "@/components/ui/feedback";
import { RoleSwitcher } from "./role-switcher";
import { buttonClass } from "@/components/ui/button";

/** Renders children only once local demo data has loaded. */
export function HydrationGate({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const hydrated = useHydrated();
  if (!hydrated) return <>{fallback ?? <PageSkeleton />}</>;
  return <>{children}</>;
}

/**
 * Client-side route guard for the PROTOTYPE. Production must enforce access
 * on the server (middleware + API authorization); this only shapes the UX.
 */
export function RequireRole({
  kinds,
  permission,
  area,
  children,
}: {
  kinds: UserKind[];
  permission?: Permission;
  area: string;
  children: (user: User) => ReactNode;
}) {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  if (!hydrated) return <div className="mx-auto max-w-6xl px-6 py-10"><PageSkeleton /></div>;
  const allowed = !!user && user.status !== "suspended" && kinds.includes(user.kind) && (!permission || can(user, permission));
  if (!allowed) return <AccessPanel area={area} signedIn={!!user} suspended={user?.status === "suspended"} />;
  return <>{children(user)}</>;
}

function AccessPanel({ area, signedIn, suspended }: { area: string; signedIn: boolean; suspended?: boolean }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-6 py-16">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-surface ring-1 ring-line">
        <Lock className="h-5 w-5 text-ink-3" />
      </div>
      <h1 className="font-display text-3xl">{suspended ? "This demo account is suspended" : signedIn ? `${area} isn't available for this role` : `Choose a demo role to open ${area}`}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-3">
        {signedIn
          ? `Access is role-based. Switch to a persona with permission for ${area.toLowerCase()} — in production this would be enforced by server-side authorization, not this screen.`
          : "The prototype uses fictional personas instead of real sign-in. Pick one below to explore the platform."}
      </p>
      <div className="mt-6 rounded-2xl border border-line bg-surface p-2 shadow-card">
        <RoleSwitcher variant="panel" />
      </div>
      <Link href="/" className={buttonClass("ghost", "sm", "mt-4 self-start")}>Back to the public site</Link>
    </div>
  );
}
