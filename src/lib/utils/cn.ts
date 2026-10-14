import clsx, { type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge about the design-system's custom tokens so later classes win cleanly.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: ["canvas", "surface", "subtle", "sunken", "line", "line-strong", "ink", "ink-2", "ink-3", "ink-4", "navy", "navy-700", "navy-600", "navy-400", "navy-200", "navy-100", "navy-50", "gold", "gold-ink", "gold-200", "gold-50", "success", "success-50", "warning", "warning-50", "danger", "danger-50"],
      shadow: ["card", "lift", "pop"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
