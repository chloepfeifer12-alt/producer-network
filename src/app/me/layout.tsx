"use client";

import { RequireRole } from "@/components/layout/guards";
import { AppShell } from "@/components/layout/app-shell";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole kinds={["producer", "aspiring"]} permission="member:edit_own_profile" area="the member workspace">
      {(user) => <AppShell user={user}>{children}</AppShell>}
    </RequireRole>
  );
}
