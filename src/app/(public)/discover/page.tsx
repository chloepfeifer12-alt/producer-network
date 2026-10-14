import type { Metadata } from "next";
import { DiscoverFront } from "@/components/discover/discover-front";

export const metadata: Metadata = {
  title: "Discover companies",
  description:
    "An editorial directory of insurance and financial services companies — agencies, IMOs, FMOs, carrier programs, advisory firms and bank programs — profiled on training, mentorship, lead support and engagement model.",
};

export default function DiscoverPage() {
  return <DiscoverFront />;
}
