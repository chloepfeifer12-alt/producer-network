"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const control =
  "w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-4 shadow-[inset_0_1px_1px_rgb(21_23_28/0.03)] transition focus:border-navy-400 focus:outline-none focus:ring-4 focus:ring-navy-100 disabled:bg-subtle disabled:text-ink-3";

export function Label({ htmlFor, children, optional, className }: { htmlFor?: string; children: ReactNode; optional?: boolean; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-1.5 flex items-center gap-2 text-[13px] font-medium text-ink-2", className)}>
      {children}
      {optional && <span className="text-xs font-normal text-ink-4">Optional</span>}
    </label>
  );
}

export function Field({ label, hint, error, optional, children, className, id }: { label?: ReactNode; hint?: ReactNode; error?: string; optional?: boolean; children: ReactNode; className?: string; id?: string }) {
  return (
    <div className={className}>
      {label && <Label htmlFor={id} optional={optional}>{label}</Label>}
      {children}
      {error ? <p className="mt-1.5 text-xs text-danger">{error}</p> : hint ? <p className="mt-1.5 text-xs leading-relaxed text-ink-3">{hint}</p> : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(control, "h-10", className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(control, "min-h-[96px] py-2.5 leading-relaxed", className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(control, "h-10 appearance-none pr-9", className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" />
    </div>
  );
});

export function Checkbox({ checked, onChange, label, description, disabled, id: idProp }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; description?: ReactNode; disabled?: boolean; id?: string }) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <label htmlFor={id} className={cn("group flex cursor-pointer items-start gap-3", disabled && "cursor-not-allowed opacity-60")}>
      <span className="relative mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center">
        <input id={id} type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        <span className="absolute inset-0 rounded-[5px] border border-line-strong bg-surface transition peer-checked:border-navy peer-checked:bg-navy peer-focus-visible:ring-4 peer-focus-visible:ring-navy-100" />
        <Check className="relative h-3 w-3 text-white opacity-0 transition peer-checked:opacity-100" strokeWidth={3} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-xs leading-relaxed text-ink-3">{description}</span>}
      </span>
    </label>
  );
}

export function Switch({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; description?: ReactNode; disabled?: boolean }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-6">
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-[13px] leading-relaxed text-ink-3">{description}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 inline-flex h-6 w-10 shrink-0 items-center rounded-full transition disabled:opacity-50",
          checked ? "bg-navy" : "bg-line-strong",
        )}
      >
        <span className={cn("inline-block h-5 w-5 rounded-full bg-white shadow transition", checked ? "translate-x-[18px]" : "translate-x-0.5")} />
      </button>
    </div>
  );
}

/** Multi- or single-select chips. */
export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  multiple = true,
  size = "md",
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T[];
  onChange: (v: T[]) => void;
  multiple?: boolean;
  size?: "sm" | "md";
  ariaLabel?: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={ariaLabel}>
      {options.map((o) => {
        const active = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => {
              if (multiple) onChange(active ? value.filter((v) => v !== o.value) : [...value, o.value]);
              else onChange(active ? [] : [o.value]);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border transition",
              size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-[13px]",
              active ? "border-navy bg-navy text-white" : "border-line-strong bg-surface text-ink-2 hover:border-ink-4 hover:text-ink",
            )}
          >
            {active && <Check className="h-3 w-3" strokeWidth={2.5} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Editable list of short strings (responsibilities, interests…). */
export function ListEditor({ value, onChange, placeholder, addLabel = "Add" }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string; addLabel?: string }) {
  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Input value={item} onChange={(e) => onChange(value.map((v, j) => (j === i ? e.target.value : v)))} aria-label={`Item ${i + 1}`} />
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="shrink-0 rounded-lg px-3 text-sm text-ink-3 hover:bg-sunken hover:text-ink" aria-label={`Remove item ${i + 1}`}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, ""])} className="text-sm font-medium text-navy-600 hover:text-navy">
        + {addLabel}
      </button>
      {placeholder && value.length === 0 && <p className="text-xs text-ink-4">{placeholder}</p>}
    </div>
  );
}
