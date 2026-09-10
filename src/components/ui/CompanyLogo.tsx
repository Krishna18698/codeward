import { COMPANY_MARKS, COMPANY_MONOGRAM } from "./companyMarks";

/** Brand marks for the company tags on problem rows.
 *
 *  Replaces `<img src="google.com/s2/favicons?domain=…">`, which cost one
 *  third-party request per company per row — 418 image elements on a single
 *  sheet page — and told Google which problems a user was browsing.
 *
 *  Defined as a <symbol> sprite rather than inlined per usage, because
 *  companies repeat heavily: Amazon alone tags 228 problems. Inlining would
 *  have stamped its full path markup into every one of those rows and
 *  duplicated every gradient id with it. As a sprite each mark's geometry
 *  exists exactly once and a usage costs a single <use> element — which
 *  matters, since cutting row DOM is the other half of this work.
 */

const SPRITE_PREFIX = "cmark-";

/** Renders every mark's geometry once. Mount a single instance high in the
 *  tree — <use> resolves against ids anywhere in the same document. */
export function CompanyLogoSprite() {
  const symbols = Object.entries(COMPANY_MARKS)
    .map(
      ([name, m]) =>
        `<symbol id="${SPRITE_PREFIX}${slug(name)}" viewBox="${m.viewBox}">${m.inner}</symbol>`,
    )
    .join("");

  return (
    <svg
      aria-hidden
      focusable="false"
      // Not `display:none` — Safari has historically dropped <use> references
      // into a hidden subtree. Zero-size + absolute keeps it out of layout
      // while leaving the symbols resolvable.
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      dangerouslySetInnerHTML={{ __html: symbols }}
    />
  );
}

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function CompanyLogo({ name, size = 16 }: { name: string; size?: number }) {
  const mark = COMPANY_MARKS[name];

  if (mark) {
    return (
      <svg
        width={size}
        height={size}
        role="img"
        aria-label={name}
        // Marks whose black was swapped for currentColor inherit this through
        // <use>, so they stay legible on both grounds.
        className={mark.invertOnDark ? "company-mark-invert" : undefined}
        style={{ color: "var(--color-primary)" }}
      >
        <use href={`#${SPRITE_PREFIX}${slug(name)}`} />
      </svg>
    );
  }

  // No square mark exists for this brand in any source — draw initials rather
  // than squash a wordmark into a 16px box or silently render nothing.
  const colour = COMPANY_MONOGRAM[name];
  if (!colour) return null;
  const initials = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <span
      role="img"
      aria-label={name}
      style={{ width: size, height: size, background: colour, fontSize: size * 0.5 }}
      className="inline-flex shrink-0 items-center justify-center rounded-sm font-semibold leading-none text-white"
    >
      {initials}
    </span>
  );
}
