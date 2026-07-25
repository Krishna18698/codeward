import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:   "bg-accent-fill text-black hover:bg-accent-hover",
  secondary: "border border-border text-secondary hover:border-border hover:text-primary hover:bg-border",
  ghost:     "text-secondary hover:text-primary hover:bg-border",
  danger:    "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20",
};

const sizes: Record<Size, string> = {
  sm: "h-7  px-3   text-xs  gap-1.5 rounded-lg",
  md: "h-9  px-4   text-sm  gap-2   rounded-xl",
  lg: "h-11 px-5   text-sm  gap-2   rounded-xl",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, leftIcon, rightIcon, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-150",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin shrink-0" />
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      {children}
      {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  )
);
Button.displayName = "Button";

export { Button };
