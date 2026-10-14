import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "accent" | "quiet" | "danger" | "link";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background,color,border-color,box-shadow,transform] duration-150 disabled:pointer-events-none disabled:opacity-45 active:translate-y-px select-none";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-ink text-white hover:bg-[#2a2d35] shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]",
  accent: "bg-navy text-white hover:bg-navy-600 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]",
  secondary: "bg-surface text-ink border border-line-strong hover:border-ink-4 hover:bg-subtle/60 shadow-card",
  ghost: "text-ink-2 hover:bg-sunken/70 hover:text-ink",
  quiet: "bg-subtle text-ink-2 hover:bg-sunken hover:text-ink",
  danger: "bg-surface text-danger border border-danger/30 hover:bg-danger-50",
  link: "text-navy-600 hover:text-navy underline-offset-4 hover:underline px-0! h-auto!",
};

const sizes: Record<ButtonSize, string> = {
  xs: "h-7 px-2.5 text-xs rounded-md",
  sm: "h-8 px-3 text-[13px] rounded-lg",
  md: "h-10 px-4 text-sm rounded-lg",
  lg: "h-12 px-6 text-[15px] rounded-xl",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, type = "button", ...props },
  ref,
) {
  return <button ref={ref} type={type} className={buttonClass(variant, size, className)} {...props} />;
});

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

export function IconButton({ className, label, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-3 transition hover:bg-sunken/70 hover:text-ink", className)}
      {...props}
    />
  );
}
