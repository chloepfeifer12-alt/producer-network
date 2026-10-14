import type { Metadata } from "next";
import { PortalPage } from "@/components/portal/portal-page";

export const metadata: Metadata = { title: "New Producer Portal" };

export default function LaunchPage() {
  return <PortalPage />;
}
