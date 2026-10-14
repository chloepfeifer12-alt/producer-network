"use client";

import { RequireRole } from "@/components/layout/guards";
import { MemberShell } from "@/components/layout/member-shell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <MemberShell>
      <RequireRole kinds={["producer", "aspiring", "organization"]} permission="network:participate" area="the Network">
        {() => children}
      </RequireRole>
    </MemberShell>
  );
}
