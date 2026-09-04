import Link from "next/link";
import { Compass, ArrowLeft } from "lucide-react";

/** In-app 404. Lives under /dashboard so it renders INSIDE the dashboard shell —
 *  the nav stays put and the user is never stranded. This is what the
 *  notFound() calls in the [slug]/[id] detail routes land on when an exercise,
 *  article or question id doesn't exist. */
export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center animate-fade-up">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface">
        <Compass size={20} className="text-muted" />
      </div>

      <p className="font-mono text-[13px] tracking-widest text-accent">404</p>
      <h1 className="mt-2 text-xl md:text-2xl font-semibold tracking-heading text-primary text-balance">
        We couldn&apos;t find that one.
      </h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-secondary">
        This exercise, article or question doesn&apos;t exist — it may have been renamed or the
        link is out of date. Everything else is still here.
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-accent-fill px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-accent-hover"
        >
          <ArrowLeft size={15} />
          Back to dashboard
        </Link>
      </div>

      {/* Quick hops back into the practice modes */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
        {[
          { href: "/dashboard/dsa", label: "DSA Sheets" },
          { href: "/dashboard/system-design", label: "System Design" },
          { href: "/dashboard/code-review", label: "Code Review" },
          { href: "/dashboard/bug-hunt", label: "Bug Hunt" },
          { href: "/dashboard/build-it", label: "Build It" },
          { href: "/dashboard/deep-dives", label: "Deep Dives" },
        ].map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="rounded-xl border border-border px-3 py-1.5 font-mono text-[11px] text-secondary transition-colors hover:border-border-accent hover:text-primary"
          >
            {m.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
