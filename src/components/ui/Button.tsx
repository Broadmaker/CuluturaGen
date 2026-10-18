import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

// Themed button (md/08 §112 design tokens). Renders <a> when href is given.
type Variant = "primary" | "accent" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-500 text-white hover:bg-brand-600 shadow-sm shadow-brand-500/25",
  accent: "bg-brand-500 text-white hover:bg-brand-600 shadow-sm shadow-brand-500/25 font-semibold",
  secondary: "border border-stone-200 bg-white text-ink-700 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 shadow-sm",
  ghost: "text-ink-500 underline-offset-2 hover:text-brand-600 hover:underline",
  danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  href?: string;
  children: ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  href,
  className = "",
  children,
  ...rest
}: Props) {
  const cls = `inline-flex items-center justify-center gap-1.5 rounded-xl font-medium transition-colors disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
