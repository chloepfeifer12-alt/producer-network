"use client";

import { create } from "zustand";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ToastTone = "success" | "error" | "info";
interface ToastItem {
  id: number;
  title: string;
  body?: string;
  tone: ToastTone;
}

const useToasts = create<{ items: ToastItem[] }>(() => ({ items: [] }));
let seq = 0;

export function toast(title: string, opts: { body?: string; tone?: ToastTone } = {}) {
  const id = ++seq;
  useToasts.setState((s) => ({ items: [...s.items.slice(-3), { id, title, body: opts.body, tone: opts.tone ?? "success" }] }));
  setTimeout(() => dismiss(id), opts.tone === "error" ? 6500 : 4200);
}

function dismiss(id: number) {
  useToasts.setState((s) => ({ items: s.items.filter((t) => t.id !== id) }));
}

/** Helper: show a toast from a service Result. */
export function toastResult(r: { ok: boolean; error?: string } | { ok: true; data: unknown } | { ok: false; error: string }, success: string, body?: string) {
  if (r.ok) toast(success, { body });
  else toast("Couldn't complete that", { body: (r as { error: string }).error, tone: "error" });
  return r.ok;
}

export function Toaster() {
  const items = useToasts((s) => s.items);
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-2 sm:left-auto sm:right-5 sm:translate-x-0">
      {items.map((t) => {
        const Icon = t.tone === "success" ? CircleCheck : t.tone === "error" ? CircleAlert : Info;
        return (
          <div key={t.id} role="status" className="pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-pop animate-rise">
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", t.tone === "success" ? "text-success" : t.tone === "error" ? "text-danger" : "text-navy-600")} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-ink">{t.title}</div>
              {t.body && <div className="mt-0.5 text-[13px] leading-relaxed text-ink-3">{t.body}</div>}
            </div>
            <button type="button" onClick={() => dismiss(t.id)} className="rounded p-0.5 text-ink-4 hover:text-ink" aria-label="Dismiss">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
