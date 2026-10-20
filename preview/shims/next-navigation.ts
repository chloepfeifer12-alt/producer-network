import { useMemo } from "react";
import { getLoc, go, navigate, paramsRef, useLoc } from "./router";

export class NotFoundError extends Error {
  digest = "NEXT_NOT_FOUND";
}
export class RedirectError extends Error {
  constructor(public to: string) {
    super("redirect");
  }
}

export function notFound(): never {
  throw new NotFoundError("not found");
}
export function redirect(to: string): never {
  throw new RedirectError(to);
}
export const permanentRedirect = redirect;

const router = {
  push: (href: string, o?: { scroll?: boolean }) => navigate(href, { scroll: o?.scroll }),
  replace: (href: string, o?: { scroll?: boolean }) => navigate(href, { replace: true, scroll: o?.scroll }),
  back: () => go(-1),
  forward: () => go(1),
  refresh: () => navigate(getLoc().pathname + getLoc().search, { replace: true, scroll: false }),
  prefetch: () => {},
};

export function useRouter() {
  return router;
}

export function usePathname() {
  return useLoc().pathname;
}

export function useSearchParams() {
  const { search } = useLoc();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export function useParams<T extends Record<string, string>>(): T {
  useLoc();
  return paramsRef.current as T;
}

export type ReadonlyURLSearchParams = URLSearchParams;
