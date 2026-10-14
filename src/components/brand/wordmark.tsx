import Link from "next/link";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils/cn";

export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="#15171C" />
      <circle cx="11" cy="12" r="3.2" fill="#FAF8F3" />
      <circle cx="21.5" cy="11" r="2.4" fill="#A8895A" />
      <circle cx="19.5" cy="21.5" r="3.6" fill="#FAF8F3" />
      <path d="M13.5 13.6 17.6 19M13.9 11.6l5.4-.4M21.2 13.3l-.8 4.6" stroke="#FAF8F3" strokeOpacity=".55" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ href = "/", className, inverted }: { href?: string; className?: string; inverted?: boolean }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)} aria-label={`${brand.name} home`}>
      <LogoMark />
      <span className={cn("text-[15px] font-semibold tracking-[-0.02em]", inverted ? "text-white" : "text-ink")}>{brand.wordmark}</span>
    </Link>
  );
}
