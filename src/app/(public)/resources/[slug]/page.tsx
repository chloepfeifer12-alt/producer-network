import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { seedResources } from "@/lib/data/seed/network";
import { ResourceReader } from "./resource-reader";

export function generateStaticParams() {
  return seedResources.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const r = seedResources.find((x) => x.slug === slug);
  return r ? { title: r.title, description: r.summary } : { title: "Resource not found" };
}

export default async function ResourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // The library is editorial seed content; unknown slugs are a 404.
  if (!seedResources.some((r) => r.slug === slug)) notFound();
  return <ResourceReader slug={slug} />;
}
