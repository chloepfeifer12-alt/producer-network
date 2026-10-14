import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { seedArticles } from "@/lib/data/seed/insider";
import { ArticleReader } from "@/components/insider/article-reader";

export function generateStaticParams() {
  return seedArticles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = seedArticles.find((x) => x.slug === slug);
  return a ? { title: `${a.title} · The Insider`, description: a.dek } : { title: "Story not found · The Insider" };
}

export default async function InsiderArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Insider articles are seed-only demo editorial; unknown slugs are a 404.
  if (!seedArticles.some((a) => a.slug === slug)) notFound();
  return <ArticleReader slug={slug} />;
}
