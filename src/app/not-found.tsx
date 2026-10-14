import Link from "next/link";
import { PublicHeader } from "@/components/layout/public-header";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <PublicHeader />
      <main id="main" className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-6 py-20">
        <div className="eyebrow mb-3">404</div>
        <h1 className="font-display text-4xl">We couldn&apos;t find that page.</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-3">The link may be outdated, or the listing may have been archived in this demo.</p>
        <div className="mt-6 flex gap-2">
          <Link href="/" className={buttonClass("primary")}>Go home</Link>
          <Link href="/opportunities" className={buttonClass("secondary")}>Browse opportunities</Link>
        </div>
      </main>
    </>
  );
}
