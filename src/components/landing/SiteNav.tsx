import Link from "next/link";
import { Sparkles } from "lucide-react";

/** Fixed marketing top-nav — shared by the landing page and the About / Contact
 *  / Privacy / Terms pages so they stay visually in sync. */
export default function SiteNav() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-neutral-800 bg-black/85 backdrop-blur-[20px]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-1.5 text-lg font-bold tracking-tight text-white">
          <Sparkles size={16} className="text-emerald-400" />
          Code<span className="text-emerald-400">ward</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-neutral-400 hover:text-white transition-colors px-3 py-1.5">
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-medium px-4 py-2 transition-colors"
          >
            Get started
          </Link>
        </div>
      </div>
    </nav>
  );
}
