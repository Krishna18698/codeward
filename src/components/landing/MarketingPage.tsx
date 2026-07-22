import SiteNav from "./SiteNav";
import SiteFooter from "./SiteFooter";

/** Shared shell for the static Company pages (About / Contact / Privacy /
 *  Terms): the marketing nav + a centered prose column + the footer, all in the
 *  same dark/emerald theme as the rest of the site. */
export default function MarketingPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-canvas text-neutral-100">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-6 pt-36 pb-24">
        {eyebrow && (
          <p className="font-mono text-[13px] uppercase tracking-wide text-emerald-400 mb-3">{eyebrow}</p>
        )}
        <h1 className="text-3xl md:text-4xl font-semibold tracking-heading text-white leading-tight">{title}</h1>
        {intro && <p className="mt-4 text-lg text-neutral-400 leading-relaxed">{intro}</p>}
        <div className="mt-10 space-y-5 text-[15px] leading-7 text-neutral-300">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

/** Section heading used inside the Company pages' prose. */
export function MarketingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pt-4">
      <h2 className="text-lg font-semibold tracking-heading text-white mb-2">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
