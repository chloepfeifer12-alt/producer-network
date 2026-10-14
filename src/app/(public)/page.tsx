import { Hero } from "@/components/home/hero";
import { Community, ExploreLines, FeaturedOpportunities, FeaturedOrganizations, FinalCta, ForOrganizations, PortalBand, Principles } from "@/components/home/sections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedOpportunities />
      <PortalBand />
      <ExploreLines />
      <FeaturedOrganizations />
      <ForOrganizations />
      <Community />
      <Principles />
      <FinalCta />
    </>
  );
}
