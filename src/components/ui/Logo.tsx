/** The Codeward mark: a prompt chevron inside a shield — code, warded.
 *
 *  Until now the brand lockup borrowed lucide's Sparkles — the same icon the AI
 *  mentor uses in seven other places, so the logo and the assistant were
 *  indistinguishable. This gives the brand its own mark and lets Sparkles mean
 *  "AI" exclusively.
 *
 *  Drawn to lucide's geometry on purpose (24×24 box, 2px stroke, round caps and
 *  joins, `currentColor`) so it sits at the same visual weight as every icon
 *  beside it, and inherits the accent colour from its container exactly the way
 *  the Sparkles it replaces did. */
export default function Logo({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {/* ward — the shield */}
      <path d="M12 2.75 L19.75 5.75 L19.75 11.5 C19.75 16 16.5 19.5 12 21.25 C7.5 19.5 4.25 16 4.25 11.5 L4.25 5.75 Z" />
      {/* code — a prompt chevron. This was a full `>_` at first; at the 14px
          the nav actually uses, the caret and the underscore merged into a
          blob, so the interior is one mark that survives the smallest size. */}
      <path d="M9.8 9.2 L13 12 L9.8 14.8" />
    </svg>
  );
}
