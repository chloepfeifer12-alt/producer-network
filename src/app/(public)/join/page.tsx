import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui/page";
import { PageSkeleton } from "@/components/ui/feedback";
import { JoinFlow } from "./join-flow";

export const metadata: Metadata = {
  title: "Join the Network",
  description: "Create a free member profile for licensed insurance and financial professionals and people exploring the field — or sign in with a demo persona.",
};

export default function JoinPage() {
  return (
    <Suspense fallback={<Container size="narrow" className="py-16"><PageSkeleton /></Container>}>
      <JoinFlow />
    </Suspense>
  );
}
