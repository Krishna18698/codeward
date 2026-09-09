import type { ReactNode } from "react";

/** The page header every mode shares.
 *
 *  Codeward's landing hero was 60px while every page *inside* the app dropped to
 *  24px — the marketing site was designed and the product read as a control
 *  panel. This sets one scale for all seven modes at ~48px, with the second half
 *  of the title in the accent colour so a page announces itself before you use it.
 *
 *  Extracted from ModeCatalog's own header block, which Code Review, Bug Hunt and
 *  Build It already shared — those three keep rendering through this component. */
export type PageHeaderProps = {
  /** Small mono kicker above the title. */
  eyebrow?: string;
  title: string;
  /** Second half of the title, rendered in the accent colour. Falls on its own
   *  line at md and up, which is what gives the two-beat editorial read. */
  titleAccent?: string;
  subtitle?: string;
  /** Mono pills under the subtitle. The one at `accentChipIndex` is filled. */
  chips?: string[];
  accentChipIndex?: number;
  /** Right-hand slot — progress rings, view toggles. */
  trailing?: ReactNode;
  /** Chat and reader pages want the scale without the vertical cost. */
  compact?: boolean;
};

export default function PageHeader({
  eyebrow, title, titleAccent, subtitle, chips, accentChipIndex = 1, trailing, compact = false,
}: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-accent">{eyebrow}</p>
        )}

        <h1
          className={`font-semibold tracking-heading text-primary ${
            compact
              ? "text-2xl md:text-3xl leading-[1.1]"
              : "text-[28px] md:text-[44px] lg:text-[48px] leading-[1.04]"
          }`}
        >
          {title}
          {titleAccent && (
            <>
              <br className="hidden md:block" />{" "}
              <span className="text-accent">{titleAccent}</span>
            </>
          )}
        </h1>

        {subtitle && (
          <p className={`mt-3 max-w-xl text-secondary ${compact ? "text-sm" : "text-[15px] leading-relaxed"}`}>
            {subtitle}
          </p>
        )}

        {chips && chips.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-[11px]">
            {chips.map((c, i) => (
              <span
                key={c}
                className={`rounded-full border px-2.5 py-1 ${
                  i === accentChipIndex
                    ? "border-accent/30 bg-accent/10 text-accent"
                    : "border-border text-secondary"
                }`}
              >
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      {trailing && <div className="hidden shrink-0 sm:block">{trailing}</div>}
    </div>
  );
}
