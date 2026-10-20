/**
 * Entry point for the single-file preview build.
 *
 * Re-creates the App Router's file-based routing in the browser: every
 * src/app/**\/page.tsx becomes a route, wrapped in the layouts above it.
 * Pages and components are imported unchanged from the Next.js app.
 */
import "./preview.css";
import { Component, Suspense, use, useEffect, type ComponentType, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { DemoBanner } from "@/components/layout/demo-banner";
import { StoreHydrator } from "@/components/providers/store-hydrator";
import { Toaster } from "@/components/ui/toast";
import { brand } from "@/config/brand";
import { navigate, paramsRef, setInitial, useLoc } from "./shims/router";
import { NotFoundError, RedirectError } from "./shims/next-navigation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- pages take varied props
type Mod = { default: ComponentType<any>; metadata?: { title?: unknown }; generateMetadata?: (a: any) => Promise<{ title?: unknown }> };

const pages = import.meta.glob<Mod>("../src/app/**/page.tsx", { eager: true });
const layouts = import.meta.glob<Mod>(["../src/app/**/layout.tsx", "!../src/app/layout.tsx"], { eager: true });
const notFounds = import.meta.glob<Mod>(["../src/app/**/not-found.tsx", "!../src/app/not-found.tsx"], { eager: true });
const RootNotFound = (import.meta.glob<Mod>("../src/app/not-found.tsx", { eager: true })["../src/app/not-found.tsx"]!).default;
const RootError = (import.meta.glob<Mod>("../src/app/error.tsx", { eager: true })["../src/app/error.tsx"]!).default;

interface Route {
  dir: string; // e.g. ../src/app/(public)/people/[id]
  segments: string[]; // URL segments; ":id" for params
  page: Mod;
}

const dirOf = (file: string) => file.slice(0, file.lastIndexOf("/"));

const routes: Route[] = Object.entries(pages)
  .map(([file, page]) => {
    const dir = dirOf(file);
    const segments = dir
      .replace("../src/app", "")
      .split("/")
      .filter((s) => s && !/^\(.*\)$/.test(s))
      .map((s) => (s.startsWith("[") ? `:${s.slice(1, -1)}` : s));
    return { dir, segments, page };
  })
  // Static segments win over params.
  .sort((a, b) => b.segments.filter((s) => !s.startsWith(":")).length - a.segments.filter((s) => !s.startsWith(":")).length);

/** Old links that the Next app redirects with route handlers. */
const REDIRECTS: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^\/network\/members$/, () => "/people"],
  [/^\/network\/members\/([^/]+)$/, (m) => `/people/${m[1]}`],
];

function match(pathname: string) {
  const parts = pathname.split("/").filter(Boolean).map(decodeURIComponent);
  for (const r of routes) {
    if (r.segments.length !== parts.length) continue;
    const params: Record<string, string> = {};
    if (r.segments.every((s, i) => (s.startsWith(":") ? ((params[s.slice(1)] = parts[i]!), true) : s === parts[i]))) return { route: r, params };
  }
  return null;
}

/** Layouts that wrap a page directory, outermost first. */
function layoutsFor(dir: string) {
  const out: ComponentType<{ children: ReactNode }>[] = [];
  let d = dir;
  while (d.startsWith("../src/app/")) {
    const l = layouts[`${d}/layout.tsx`];
    if (l) out.unshift(l.default);
    d = dirOf(d);
  }
  return out;
}

function nearestNotFound(dir: string) {
  let d = dir;
  while (d.startsWith("../src/app/")) {
    const n = notFounds[`${d}/not-found.tsx`];
    if (n) return n.default;
    d = dirOf(d);
  }
  return null;
}

// Async server components (they await params) are resolved once per URL.
const asyncCache = new Map<string, Promise<ReactNode>>();
function AsyncPage({ cacheKey, render }: { cacheKey: string; render: () => Promise<ReactNode> }) {
  let p = asyncCache.get(cacheKey);
  if (!p) {
    p = render();
    asyncCache.set(cacheKey, p);
  }
  return <>{use(p)}</>;
}

function titleText(t: unknown) {
  if (typeof t === "string") return t;
  if (t && typeof t === "object" && "default" in t) return String((t as { default: string }).default);
  return null;
}

class Boundary extends Component<{ resetKey: string; notFound: ReactNode; children: ReactNode }, { error: unknown }> {
  state = { error: null as unknown };
  static getDerivedStateFromError(error: unknown) {
    return { error };
  }
  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }
  componentDidCatch(error: unknown) {
    if (error instanceof RedirectError) navigate(error.to, { replace: true });
  }
  render() {
    const e = this.state.error;
    if (!e) return this.props.children;
    if (e instanceof RedirectError) return null;
    if (e instanceof NotFoundError) return this.props.notFound;
    return <RootError error={e as Error} reset={() => this.setState({ error: null })} />;
  }
}

function App() {
  const loc = useLoc();
  const key = loc.pathname + loc.search;

  let redirectTo: string | null = null;
  for (const [re, to] of REDIRECTS) {
    const m = loc.pathname.match(re);
    if (m) redirectTo = to(m);
  }
  const found = redirectTo ? null : match(loc.pathname);

  useEffect(() => {
    if (redirectTo) navigate(redirectTo, { replace: true });
  }, [redirectTo]);

  useEffect(() => {
    const mod = found?.route.page;
    const set = (t: unknown) => {
      const text = titleText(t);
      document.title = text && text !== brand.name ? `${text} · ${brand.name}` : `${brand.name} — ${brand.tagline}`;
    };
    if (mod?.generateMetadata) mod.generateMetadata({ params: Promise.resolve(found!.params) }).then((m) => set(m?.title), () => set(null));
    else set(mod?.metadata?.title);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (redirectTo) return null;
  if (!found) return <RootNotFound />;

  const { route, params } = found;
  paramsRef.current = params;
  const Page = route.page.default;
  const searchParams = Object.fromEntries(new URLSearchParams(loc.search));
  const isAsync = Page.constructor.name === "AsyncFunction";
  let el: ReactNode = isAsync ? (
    <AsyncPage
      cacheKey={key}
      render={() => (Page as unknown as (p: object) => Promise<ReactNode>)({ params: Promise.resolve(params), searchParams: Promise.resolve(searchParams) })}
    />
  ) : (
    <Page params={Promise.resolve(params)} searchParams={Promise.resolve(searchParams)} />
  );

  const Nearest = nearestNotFound(route.dir);
  el = (
    <Boundary resetKey={key} notFound={Nearest ? <Nearest /> : <RootNotFound />}>
      <Suspense fallback={null}>{el}</Suspense>
    </Boundary>
  );
  for (const L of layoutsFor(route.dir).reverse()) el = <L>{el}</L>;
  // A root-level 404 has its own header, so it renders outside the layouts.
  return (
    <Boundary resetKey={key} notFound={<RootNotFound />}>
      {el}
    </Boundary>
  );
}

// Plain <a href="/..."> links (not next/link) also navigate in-app.
document.addEventListener("click", (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = (e.target as Element).closest?.("a");
  const href = a?.getAttribute("href");
  if (!a || !href || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
  if (href.startsWith("/")) {
    e.preventDefault();
    navigate(href);
  } else if (href.startsWith("#")) {
    e.preventDefault();
    document.getElementById(decodeURIComponent(href.slice(1)))?.scrollIntoView({ block: "start" });
  }
});

(window as unknown as { __pnNavigate: typeof navigate }).__pnNavigate = navigate; // used by the preview smoke test

// A shared link like …/artifact/<id>#discover opens that destination.
const start = location.hash.slice(1);
if (/^[a-z][a-z0-9-]*$/i.test(start) && match(`/${start}`)) setInitial(`/${start}`);
document.documentElement.lang = "en";

createRoot(document.getElementById("root")!).render(
  <>
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-12 focus:z-[100] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:shadow-pop"
    >
      Skip to content
    </a>
    <StoreHydrator />
    <DemoBanner />
    <App />
    <Toaster />
  </>,
);
