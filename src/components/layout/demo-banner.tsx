import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { RoleSwitcher } from "./role-switcher";

export function DemoBanner() {
  return (
    <div className="relative z-[60] bg-ink text-white">
      <div className="mx-auto flex h-9 max-w-[1400px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/about#prototype" className="flex min-w-0 items-center gap-2 text-[12px] text-white/70 hover:text-white">
          <FlaskConical className="h-3.5 w-3.5 shrink-0 text-gold-200" />
          <span className="truncate">
            <span className="font-medium text-white/90">Prototype</span>
            <span className="hidden sm:inline"> · All people, organizations, listings and metrics are fictional</span>
          </span>
        </Link>
        <RoleSwitcher />
      </div>
    </div>
  );
}
