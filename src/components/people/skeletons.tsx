import { Skeleton } from "@/components/ui/feedback";

const WRAP = "mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-8";

export function PeopleSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading people">
      <div className="border-b border-line">
        <div className={`${WRAP} grid gap-12 pb-16 pt-14 lg:grid-cols-12`}>
          <div className="space-y-5 lg:col-span-7">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-16 w-full max-w-xl" />
            <Skeleton className="h-16 w-4/5 max-w-lg" />
            <Skeleton className="h-5 w-full max-w-md" />
            <Skeleton className="h-12 w-full max-w-xl rounded-xl" />
          </div>
          <Skeleton className="h-72 rounded-2xl lg:col-span-5" />
        </div>
      </div>
      <div className={`${WRAP} grid gap-5 py-16 lg:grid-cols-12`}>
        <Skeleton className="h-[460px] rounded-2xl lg:col-span-7" />
        <div className="grid gap-5 lg:col-span-5">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function PortfolioSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading profile">
      <Skeleton className="h-40 w-full rounded-none sm:h-52" />
      <div className={`${WRAP} -mt-14`}>
        <Skeleton className="h-28 w-28 rounded-full ring-4 ring-canvas" />
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
