import type { Metadata } from "next";
import { OrgWizard } from "./org-wizard";

export const metadata: Metadata = {
  title: "List your organization",
  description: "Apply to list your agency, IMO, FMO, carrier, brokerage, MGA or claims organization. Every listing is reviewed before it goes live.",
};

export default function JoinOrganizationPage() {
  return <OrgWizard />;
}
