import { Skeleton } from "@/components/ui/feedback";
import { Container } from "@/components/ui/page";

export function OpportunityCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6" aria-hidden>
      <div className="flex items-start gap-4">
        <Skeleton className="h-11 w-11 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
      <Skeleton className="mt-5 h-3 w-2/3" />
      <Skeleton className="mt-3 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-5/6" />
      <div className="mt-5 flex gap-2">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-20" />
      </div>
      <Skeleton className="mt-6 h-8 w-1/2" />
    </div>
  );
}

export function OrgCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card" aria-hidden>
      <Skeleton className="h-20 rounded-none" />
      <div className="px-5 pb-5">
        <Skeleton className="-mt-7 h-[52px] w-[52px] rounded-2xl ring-4 ring-surface" />
        <Skeleton className="mt-4 h-3 w-24" />
        <Skeleton className="mt-2 h-4 w-2/3" />
        <Skeleton className="mt-3 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-4/5" />
        <Skeleton className="mt-6 h-6 w-1/2" />
      </div>
    </div>
  );
}

export function DiscoverySkeleton({ kind = "opportunity" }: { kind?: "opportunity" | "organization" }) {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="border-b border-line">
        <Container className="pb-5 pt-7 sm:pt-9">
          <Skeleton className="h-8 w-80 max-w-full" />
          <Skeleton className="mt-5 h-[74px] w-full rounded-2xl" />
          <div className="mt-4 flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-28 rounded-full" />
            ))}
          </div>
        </Container>
      </div>
      <Container className="py-6">
        <Skeleton className="h-4 w-40" />
        {kind === "opportunity" ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-xl" />
              ))}
            </div>
            <Skeleton className="hidden h-[70vh] rounded-2xl lg:block" />
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <OrgCardSkeleton key={i} />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <Container className="py-10" >
      <div aria-busy="true" aria-label="Loading">
        <Skeleton className="h-3 w-56" />
        <div className="mt-8 flex items-start gap-4">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-9 w-[32rem] max-w-full" />
            <Skeleton className="h-3 w-80 max-w-full" />
          </div>
        </div>
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
            <Skeleton className="h-40" />
            <Skeleton className="h-56" />
          </div>
          <Skeleton className="h-80" />
        </div>
      </div>
    </Container>
  );
}

export function ProfileSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="border-b border-line bg-subtle">
        <Container className="py-14">
          <Skeleton className="h-3 w-48" />
          <div className="mt-8 flex items-center gap-5">
            <Skeleton className="h-[88px] w-[88px] rounded-3xl" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-10 w-96 max-w-full" />
              <Skeleton className="h-4 w-[30rem] max-w-full" />
            </div>
          </div>
        </Container>
      </div>
      <Container className="py-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-72" />
        </div>
      </Container>
    </div>
  );
}
