"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Check, ChevronDown, FlaskConical, LogOut, RotateCcw } from "lucide-react";
import { Popover } from "@/components/ui/menu";
import { Avatar } from "@/components/ui/avatar";
import { DEMO_PERSONAS, homeFor, signInAsDemo, signOutDemo, useCurrentUser } from "@/lib/auth/session";
import { resetDemoData, useDb, useHydrated } from "@/lib/store/db-store";
import { ROLE_LABEL } from "@/lib/auth/permissions";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";

export function RoleSwitcher({ variant = "banner" }: { variant?: "banner" | "panel" }) {
  const user = useCurrentUser();
  const db = useDb();
  const hydrated = useHydrated();
  const router = useRouter();

  const choose = (userId: string, close?: () => void) => {
    signInAsDemo(userId);
    const u = db.users.find((x) => x.id === userId);
    close?.();
    router.push(homeFor(u));
    toast(`Now viewing as ${u?.name}`, { body: "Demo role — not real authentication.", tone: "info" });
  };

  const list = (close?: () => void) => (
    <div className="space-y-0.5">
      {DEMO_PERSONAS.map((p) => {
        const u = db.users.find((x) => x.id === p.userId);
        const prof = db.profiles.find((x) => x.userId === p.userId);
        const active = user?.id === p.userId;
        return (
          <button
            key={p.userId}
            type="button"
            onClick={() => choose(p.userId, close)}
            className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-subtle", active && "bg-subtle")}
          >
            <Avatar name={u?.name ?? p.label} tone={prof?.avatarTone ?? 1} size={34} />
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium text-ink">{p.label}</span>
              <span className="block truncate text-xs text-ink-3">{p.description}</span>
            </span>
            {active ? <Check className="h-4 w-4 text-navy-600" /> : <ArrowRight className="h-3.5 w-3.5 text-ink-4" />}
          </button>
        );
      })}
    </div>
  );

  if (variant === "panel") return list();

  return (
    <Popover
      label="Demo role switcher"
      className="w-[min(380px,calc(100vw-1.5rem))] p-2"
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium text-white/90 transition hover:bg-white/10"
        >
          <span className="hidden text-white/55 sm:inline">Demo role:</span>
          <span className="max-w-[160px] truncate">{!hydrated ? "…" : user ? `${user.name} · ${ROLE_LABEL(user)}` : "Visitor"}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="px-3 pb-2 pt-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-ink">
              <FlaskConical className="h-3.5 w-3.5" /> Prototype role switcher
            </div>
            <p className="mt-1 text-xs leading-relaxed text-ink-3">Explore as a fictional persona. This is not authentication and must never ship to production.</p>
          </div>
          {list(close)}
          <div className="mt-1 flex items-center justify-between border-t border-line px-1 pt-2">
            <button
              type="button"
              onClick={() => {
                signOutDemo();
                close();
                router.push("/");
              }}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs text-ink-3 hover:bg-subtle hover:text-ink"
            >
              <LogOut className="h-3.5 w-3.5" /> Browse as visitor
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Reset all demo data to the original synthetic seed? Your changes in this browser will be lost.")) {
                  resetDemoData();
                  close();
                  toast("Demo data reset", { tone: "info" });
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs text-ink-3 hover:bg-subtle hover:text-ink"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset demo data
            </button>
          </div>
        </div>
      )}
    </Popover>
  );
}
