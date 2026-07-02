"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard, Code2, Network, Sparkles, LogOut,
  ChevronLeft, ChevronRight, X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import UserAvatar from "@/components/ui/UserAvatar";

const nav = [
  { label: "Home",          href: "/dashboard",               icon: LayoutDashboard },
  { label: "DSA Sheets",    href: "/dashboard/dsa",           icon: Code2 },
  { label: "System Design", href: "/dashboard/system-design", icon: Network },
  { label: "AI Mentor",     href: "/dashboard/mentor",        icon: Sparkles },
];

type Props = {
  mobileOpen: boolean;
  onMobileClose: () => void;
};

function UserChip({ collapsed }: { collapsed: boolean }) {
  const { data: session } = useSession();
  const user = session?.user;
  if (!user) return null;

  return (
    <Link
      href="/dashboard/profile"
      className={cn(
        "flex items-center gap-2.5 rounded-xl border border-slate-800/60 bg-slate-900/40 p-2 mx-2 mb-2",
        "hover:border-slate-700 hover:bg-slate-800/60 transition-colors duration-150",
        collapsed && "justify-center px-2",
      )}
    >
      <UserAvatar image={user.image} name={user.name} size={28} />
      {!collapsed && (
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-300 truncate">{user.name ?? "Profile"}</p>
          <p className="text-[10px] text-slate-600 truncate">{user.email}</p>
        </div>
      )}
    </Link>
  );
}

export default function Sidebar({ mobileOpen, onMobileClose }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Read persisted preference on mount — can't be a lazy useState initializer
    // without an SSR hydration mismatch, so effect-driven setState is intentional.
    const stored = localStorage.getItem("sidebar-collapsed");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      localStorage.setItem("sidebar-collapsed", String(!v));
      return !v;
    });
  };

  const sidebarContent = (
    <div className="flex h-full flex-col py-4">
      {/* Logo + collapse toggle */}
      <div className={cn(
        "flex items-center mb-6 px-3",
        collapsed ? "justify-center" : "justify-between",
      )}>
        {!collapsed && (
          <span className="flex items-center gap-1.5 text-sm font-bold tracking-tight text-white">
            <Sparkles size={13} className="text-sky-400" />
            Code<span className="text-sky-400">ward</span>
          </span>
        )}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden md:flex h-6 w-6 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-800 hover:text-slate-300 transition-colors"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        <button
          onClick={onMobileClose}
          className="md:hidden flex h-6 w-6 items-center justify-center rounded-lg text-slate-500 hover:text-slate-300"
        >
          <X size={14} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-2">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onMobileClose}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-all duration-150",
                collapsed && "justify-center px-2",
                active
                  ? "border-l-2 border-sky-400 bg-sky-500/10 text-sky-400 pl-[9px]"
                  : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-200 border-l-2 border-transparent",
              )}
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: user chip + sign out */}
      <div className="pt-2 border-t border-slate-800/60 space-y-1">
        <UserChip collapsed={collapsed} />
        <div className="px-2">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            title={collapsed ? "Sign out" : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-2.5 py-3.5 text-xs text-slate-500",
              "hover:bg-slate-800/70 hover:text-slate-300 transition-colors duration-150",
              collapsed && "justify-center px-2",
            )}
          >
            <LogOut size={14} className="shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          "hidden md:flex flex-col h-screen border-r border-slate-800/60 bg-canvas shrink-0",
          "transition-[width] duration-200 ease-out overflow-hidden",
          collapsed ? "w-14" : "w-56",
        )}
      >
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={onMobileClose} />
          <aside className="fixed inset-y-0 left-0 z-50 w-56 flex flex-col border-r border-slate-800/60 bg-canvas md:hidden animate-slide-right">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
