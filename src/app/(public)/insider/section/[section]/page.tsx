import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SECTION_LABEL, SECTION_ORDER } from "@/lib/services/insider";
import { InsiderSectionPage } from "@/components/insider/section-page";
import { SECTION_DEK, sectionFromSlug, sectionSlug } from "@/components/insider/sections";

export function generateStaticParams() {
  return SECTION_ORDER.map((s) => ({ section: sectionSlug(s) }));
}

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const s = sectionFromSlug((await params).section);
  return s ? { title: `${SECTION_LABEL[s]} · The Insider`, description: SECTION_DEK[s] } : { title: "Section not found · The Insider" };
}

export default async function InsiderSectionRoute({ params }: { params: Promise<{ section: string }> }) {
  const s = sectionFromSlug((await params).section);
  if (!s) notFound();
  return <InsiderSectionPage section={s} />;
}
