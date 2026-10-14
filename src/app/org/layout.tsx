"use client";

import { RequireRole } from "@/components/layout/guards";
import { AppShell } from "@/components/layout/app-shell";

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole kinds={["organization"]} permission="org:view_dashboard" area="the recruiting workspace">
      {(user) => <AppShell user={user}>{children}</AppShell>}
    </RequireRole>
  );
}
