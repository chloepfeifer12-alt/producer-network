"use client";

import { RequireRole } from "@/components/layout/guards";
import { AppShell } from "@/components/layout/app-shell";

export default function NetworkLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole kinds={["producer", "aspiring", "organization"]} permission="network:participate" area="the professional network">
      {(user) => <AppShell user={user}>{children}</AppShell>}
    </RequireRole>
  );
}
