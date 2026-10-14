import type { Metadata } from "next";
import { HydrationGate } from "@/components/layout/guards";
import { FitExperience } from "@/components/fit/fit-experience";
import { FitSkeleton } from "@/components/fit/fit-skeleton";

export const metadata: Metadata = {
  title: "Your Industry Fit",
  description:
    "Eight short questions and a transparent, deterministic ranking of the organizations and opportunities that align with how you want to work. Not an employment decision.",
};

export default function FitPage() {
  return (
    <HydrationGate fallback={<FitSkeleton />}>
      <FitExperience />
    </HydrationGate>
  );
}
