import { Skeleton } from "@/components/ui/feedback";

export function FitSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-14 pt-10 sm:px-6 sm:pt-16 lg:px-8" aria-busy="true" aria-label="Loading Your Industry Fit">
      <Skeleton className="mb-8 h-3 w-56" />
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="space-y-5 lg:col-span-7">
          <Skeleton className="h-16 w-4/5" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="mt-8 h-12 w-40 rounded-xl" />
        </div>
        <div className="lg:col-span-5">
          <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
