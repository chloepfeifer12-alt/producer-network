import { Skeleton } from "@/components/ui/feedback";

const WRAP = "mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-8";

export function PeopleSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading people">
      <div className="border-b border-line">
        <div className={`${WRAP} space-y-4 pb-12 pt-16`}>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-12 w-full max-w-lg" />
          <Skeleton className="h-5 w-full max-w-md" />
          <Skeleton className="h-11 w-full max-w-xl rounded-xl" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <div className={`${WRAP} py-12`}>
        <Skeleton className="h-6 w-64" />
        <div className="mt-10 grid gap-x-12 gap-y-6 lg:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-11 w-11 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3.5 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PortfolioSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading profile">
      <Skeleton className="h-24 w-full rounded-none sm:h-[136px]" />
      <div className={`${WRAP} -mt-12`}>
        <Skeleton className="h-24 w-24 rounded-full ring-4 ring-canvas" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-10 w-72 max-w-full" />
          <Skeleton className="h-5 w-[28rem] max-w-full" />
          <Skeleton className="h-4 w-60" />
        </div>
        <div className="mt-12 grid gap-12 pb-16 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="mt-8 h-48 w-full" />
          </div>
          <Skeleton className="h-80 rounded-2xl lg:col-span-4" />
        </div>
      </div>
    </div>
  );
}
