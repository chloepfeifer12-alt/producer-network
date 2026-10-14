import type { ArticleBlock } from "@/lib/data/types";
import { PullQuote } from "@/components/editorial";
import { cn } from "@/lib/utils/cn";

/**
 * Renders an article body at reading measure. The first paragraph carries a
 * drop cap; the final block ends with a small end mark.
 */
export function ArticleBody({ blocks }: { blocks: ArticleBlock[] }) {
  const firstP = blocks.findIndex((b) => b.type === "p");
  const last = blocks.length - 1;
  return (
    <div className="max-w-[66ch] font-display text-[19px] leading-[1.68] text-ink sm:text-[20.5px] [font-feature-settings:'onum','kern']">
      {blocks.map((b, i) => {
        const end = i === last ? <span aria-hidden className="ml-1.5 inline-block h-[0.55em] w-[0.55em] translate-y-[-0.05em] bg-ink align-baseline" /> : null;
        switch (b.type) {
          case "p":
            return (
              <p
                key={i}
                className={cn(
                  "mt-6 first:mt-0",
                  i === firstP &&
                    "first-letter:float-left first-letter:mr-3 first-letter:mt-[0.12em] first-letter:font-display first-letter:text-[4.1em] first-letter:leading-[0.78] first-letter:text-ink",
                )}
              >
                {b.text}
                {end}
              </p>
            );
          case "h2":
            return (
              <h2 key={i} className="mt-14 font-display text-[26px] font-medium leading-[1.15] tracking-[-0.015em] text-ink sm:text-[29px]">
                {b.text}
              </h2>
            );
          case "quote":
            return (
              <PullQuote key={i} cite={b.cite} className="my-12 py-1 lg:-ml-10 [&_blockquote]:text-[26px] [&_blockquote]:leading-[1.25] sm:[&_blockquote]:text-[32px] [&_figcaption]:font-sans">
                “{b.text}”
              </PullQuote>
            );
          case "list":
            return (
              <ul key={i} className="mt-6 space-y-3 border-y border-line py-5">
                {b.items.map((it, j) => (
                  <li key={j} className="grid grid-cols-[2rem_minmax(0,1fr)] items-baseline">
                    <span className="font-sans text-[12px] font-semibold tabular-nums tracking-[0.06em] text-ink-4">{String(j + 1).padStart(2, "0")}</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            );
        }
      })}
    </div>
  );
}
