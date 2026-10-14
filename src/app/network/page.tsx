"use client";

import { RequireRole } from "@/components/layout/guards";
import { Headquarters } from "@/components/hq/headquarters";

/** The Network — the member's headquarters (default home after sign-in). */
export default function NetworkPage() {
  return (
    <RequireRole kinds={["producer", "aspiring", "organization"]} permission="network:participate" area="the Network">
      {(user) => <Headquarters user={user} />}
    </RequireRole>
  );
}
