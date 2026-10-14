"use client";

import { RequireRole } from "@/components/layout/guards";
import { AppShell } from "@/components/layout/app-shell";

/** The admin console is only reachable with the admin:access permission (admin personas). */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole kinds={["admin"]} permission="admin:access" area="the admin console">
      {(user) => <AppShell user={user}>{children}</AppShell>}
    </RequireRole>
  );
}
