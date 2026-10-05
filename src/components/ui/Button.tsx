import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

// Themed button (md/08 §112 design tokens). Renders <a> when href is given.
type Variant = "primary" | "accent" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink-900 text-white hover:bg-ink-800 shadow-sm",
  accent: "bg-brass-500 text-ink-950 hover:bg-brass-400 shadow-sm font-semibold",
  secondary: "border border-stone-300 bg-white text-stone-800 hover:border-stone-400 hover:bg-paper shadow-sm",
  ghost: "text-stone-600 underline-offset-2 hover:text-ink-900 hover:underline",
  danger: "border border-red-700 text-red-700 hover:bg-red-50",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
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
  const cls = `inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
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
