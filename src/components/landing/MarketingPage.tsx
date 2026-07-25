import SiteNav from "./SiteNav";
import SiteFooter from "./SiteFooter";

/** Shared shell for the static Company pages (About / Contact / Privacy /
 *  Terms): the marketing nav + a centered prose column + the footer, all in the
 *  same dark/emerald theme as the rest of the site. */
export default function MarketingPage({
  eyebrow,
  title,
  intro,
  lastUpdated,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  lastUpdated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-dvh bg-canvas text-primary">
      <SiteNav />

      {/* Dotted matrix behind the page header — radial-masked so it fades out. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[560px]"
        style={{
          backgroundImage: "radial-gradient(var(--dot-color) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage: "radial-gradient(ellipse 60% 55% at 50% 22%, #000 15%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 55% at 50% 22%, #000 15%, transparent 70%)",
        }}
      />

      <main className="relative z-10 mx-auto max-w-3xl px-6 pt-36 pb-24">
        {eyebrow && (
          <p className="mb-4 inline-flex items-center gap-2 font-mono text-[13px] uppercase tracking-wide text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-hover" />
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl md:text-4xl font-semibold tracking-heading text-primary leading-tight">{title}</h1>
        {intro && <p className="mt-4 text-lg text-secondary leading-relaxed">{intro}</p>}
        {lastUpdated && (
          <p className="mt-4 font-mono text-[13px] text-muted">Last updated: {lastUpdated}</p>
        )}
        <div className="mt-10 space-y-5 text-[15px] leading-7 text-secondary">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

/** Section heading used inside the Company pages' prose. */
export function MarketingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pt-4">
      <h2 className="text-lg font-semibold tracking-heading text-primary mb-2">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
