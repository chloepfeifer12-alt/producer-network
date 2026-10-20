import { forwardRef, type AnchorHTMLAttributes } from "react";
import { navigate } from "./router";

type Href = string | { pathname?: string; query?: Record<string, string | number | undefined>; hash?: string };

export function hrefToString(href: Href): string {
  if (typeof href === "string") return href;
  const q = new URLSearchParams();
  Object.entries(href.query ?? {}).forEach(([k, v]) => v !== undefined && q.set(k, String(v)));
  const qs = q.toString();
  return `${href.pathname ?? ""}${qs ? `?${qs}` : ""}${href.hash ? `#${href.hash.replace(/^#/, "")}` : ""}`;
}

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: Href;
  replace?: boolean;
  scroll?: boolean;
  prefetch?: boolean | null;
};

const Link = forwardRef<HTMLAnchorElement, Props>(function Link({ href, replace, scroll, prefetch: _prefetch, onClick, ...rest }, ref) {
  const to = hrefToString(href);
  return (
    <a
      ref={ref}
      href={to}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (rest.target && rest.target !== "_self") return;
        if (/^[a-z]+:/i.test(to)) return;
        e.preventDefault();
        navigate(to, { replace, scroll });
      }}
    />
  );
});

export default Link;
