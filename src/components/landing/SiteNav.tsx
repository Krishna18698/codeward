import Link from "next/link";
import Logo from "@/components/ui/Logo";

import ThemeToggle from "@/components/ui/ThemeToggle";

/** Fixed marketing top-nav — shared by the landing page and the About / Contact
 *  / Privacy / Terms pages so they stay visually in sync.
 *
 *  Spacing tightens below 400px only. The logo, theme toggle, Log in and the
 *  CTA together needed 287px of content in the 244px a 280px screen offers, so
 *  the CTA was being clipped; squeezing padding and type below 400px keeps all
 *  four controls rather than hiding one, and leaves 400px and up untouched. */
export default function SiteNav() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-border bg-canvas/85 backdrop-blur-[20px]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-2 py-4 min-[400px]:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-1.5 text-sm font-bold tracking-tight text-primary min-[400px]:text-lg">
          <Logo size={16} className="text-accent" />
          <span>Code<span className="text-accent">ward</span></span>
        </Link>
        <div className="flex shrink-0 items-center gap-1 min-[400px]:gap-3">
          <ThemeToggle />
          <Link href="/login" className="whitespace-nowrap px-1.5 py-1.5 text-[12px] text-secondary transition-colors hover:text-primary min-[400px]:px-3 min-[400px]:text-sm">
            Log in
          </Link>
          <Link
            href="/register"
            className="whitespace-nowrap rounded-lg bg-accent-fill px-2.5 py-2 text-[12px] font-medium text-black transition-colors hover:bg-accent-hover min-[400px]:px-4 min-[400px]:text-sm"
          >
            Get started
          </Link>
        </div>
      </div>
    </nav>
  );
}
