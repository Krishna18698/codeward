/** Keyboard-only bypass for the repeated header nav.
 *
 *  Off-screen until focused, so it costs sighted users nothing and gives
 *  keyboard and screen-reader users a first stop that jumps straight to the
 *  page's <main id="main">. Render it as the first child of each page shell —
 *  it has to be the first thing in the tab order to be any use.
 */
export default function SkipLink() {
  return (
    <a href="#main" className="skip-link">
      Skip to content
    </a>
  );
}
