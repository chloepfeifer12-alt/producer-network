import type { ReactNode } from "react";
import { PublicHeader } from "./public-header";
import { PublicFooter } from "./public-footer";

/** Member experience: the same top-level destinations as the public site, no admin-style sidebar. */
export function MemberShell({ children }: { children: ReactNode }) {
  return (
    <>
      <PublicHeader />
      <main id="main" className="mx-auto w-full max-w-[1320px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">{children}</main>
      <PublicFooter />
    </>
  );
}
