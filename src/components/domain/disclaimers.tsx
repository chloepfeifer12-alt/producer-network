import { Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function CompensationDisclaimer({ className }: { className?: string }) {
  return (
    <p className={cn("flex gap-2 text-xs leading-relaxed text-ink-3", className)}>
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>
        Compensation information is provided by the organization and shown as disclosed. It is not verified by the platform and is not a
        guarantee or projection of earnings. Commission-based results vary widely by individual. Confirm all terms in writing before accepting.
      </span>
    </p>
  );
}

export function DemoApplicationDisclaimer({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs leading-relaxed text-ink-3", className)}>
      Prototype: applications are stored only in this browser&apos;s demo data and are never transmitted to any real organization.
    </p>
  );
}
