import type { Article, Database, InsiderSection } from "@/lib/data/types";

export const SECTION_LABEL: Record<InsiderSection, string> = {
  insights: "Industry Insights",
  career_guides: "Career Guides",
  leadership: "Agency Leadership",
  interviews: "Interviews",
  education: "Education",
  emerging: "Emerging Opportunities",
  events: "Events",
  spotlight: "Community Spotlight",
};

export const SECTION_ORDER: InsiderSection[] = ["insights", "career_guides", "leadership", "interviews", "education", "emerging", "events", "spotlight"];

export function articlesByDate(db: Database) {
  return [...db.articles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getArticle(db: Database, slug: string) {
  return db.articles.find((a) => a.slug === slug || a.id === slug);
}

export function coverStory(db: Database): Article | undefined {
  return articlesByDate(db).find((a) => a.featured) ?? articlesByDate(db)[0];
}

export function relatedArticles(db: Database, a: Article, limit = 3) {
  return articlesByDate(db)
    .filter((x) => x.id !== a.id)
    .map((x) => ({ x, s: (x.section === a.section ? 2 : 0) + x.lines.filter((l) => a.lines.includes(l)).length }))
    .sort((p, q) => q.s - p.s)
    .slice(0, limit)
    .map((r) => r.x);
}
