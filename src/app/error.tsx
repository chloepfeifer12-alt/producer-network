"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { resetDemoData } from "@/lib/store/db-store";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-6 py-20">
      <div className="eyebrow mb-3">Something went wrong</div>
      <h1 className="font-display text-4xl">This screen hit an unexpected error.</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-3">You can try again. If the local demo data was changed into an unexpected state, resetting it usually helps.</p>
      <div className="mt-6 flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button variant="secondary" onClick={() => { resetDemoData(); reset(); }}>Reset demo data</Button>
      </div>
    </main>
  );
}
