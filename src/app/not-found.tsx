import Link from "next/link";
import { Sparkles, ArrowLeft, LayoutDashboard } from "lucide-react";

/** Global 404 — replaces Next's unstyled built-in default so a bad URL still
 *  looks like Codeward (theme tokens, branding) and always offers a way out. */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas text-primary flex flex-col items-center justify-center px-6 py-16">
      {/* Brand */}
      <Link href="/" className="mb-10 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/30 bg-accent/15">
          <Sparkles size={16} className="text-accent" />
        </div>
        <span className="text-base font-bold tracking-tight">
          Code<span className="text-accent">ward</span>
        </span>
      </Link>

      <p className="font-mono text-[13px] tracking-widest text-accent">404</p>
      <h1 className="mt-3 text-center text-2xl md:text-3xl font-semibold tracking-heading text-balance">
        This page doesn&apos;t exist.
      </h1>
      <p className="mt-3 max-w-md text-center text-sm leading-relaxed text-secondary">
        The link may be out of date, or the page moved. Nothing&apos;s broken — let&apos;s get you
        back to your prep.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-accent-fill px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-accent-hover"
        >
          <LayoutDashboard size={15} />
          Go to dashboard
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-secondary transition-colors hover:border-border-accent hover:text-primary"
        >
          <ArrowLeft size={15} />
          Back home
        </Link>
      </div>
    </div>
  );
}
