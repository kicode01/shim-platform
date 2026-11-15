"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Stamp,
  FileSpreadsheet,
  Calendar,
  BookOpen,
  History,
  Users,
  LifeBuoy,
  Shield,
} from "lucide-react";
import { canAccessDashboardPage, DashboardGateKey } from "@/lib/permissions";

interface NavItemConfig {
  gate: DashboardGateKey;
  href: string;
  label: string;
  shortLabel: string;
  icon: typeof LayoutDashboard;
}

const ALL_NAV_ITEMS: NavItemConfig[] = [
  { gate: "overview", href: "/dashboard", label: "Overview", shortLabel: "Home", icon: LayoutDashboard },
  { gate: "credentials", href: "/dashboard/credentials", label: "Credentials", shortLabel: "Creds", icon: BookOpen },
  { gate: "events", href: "/dashboard/events", label: "Events", shortLabel: "Events", icon: Calendar },
  { gate: "templates", href: "/dashboard/templates", label: "Templates", shortLabel: "Studio", icon: Stamp },
  { gate: "issue", href: "/dashboard/generate", label: "Issue", shortLabel: "Issue", icon: FileSpreadsheet },
  { gate: "admin-only", href: "/dashboard/users", label: "Users", shortLabel: "Users", icon: Users },
  { gate: "audit", href: "/dashboard/audit", label: "Audit", shortLabel: "Audit", icon: History },
  { gate: "support", href: "/dashboard/support", label: "Support", shortLabel: "Support", icon: LifeBuoy },
];

export default function Sidebar({
  userRole = "organizer",
  allowedPages,
}: {
  userRole?: string;
  allowedPages?: string[];
}) {
  const pathname = usePathname();

  const navItems = ALL_NAV_ITEMS.filter((item) =>
    canAccessDashboardPage(userRole, allowedPages, item.gate)
  );

  const isTemplateStudio = /^\/dashboard\/templates\/[^/]+$/.test(pathname);
  const isEventStudio = /^\/dashboard\/events\/[^/]+$/.test(pathname);
  const isStudioMode = isTemplateStudio || isEventStudio;

  return (
    <aside
      className={`mob-tabbar flex-shrink-0 border-zinc-200 bg-white/50 backdrop-blur-md flex flex-col h-full sticky top-16 z-40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-hidden ${
        isStudioMode
          ? "mob-tabbar-off w-0 border-r-0 opacity-0"
          : "w-[72px] lg:w-[180px] border-r opacity-100"
      }`}
    >
      <div className="p-4 py-6 lg:py-8 flex-1 min-w-[72px] lg:min-w-[180px]">
        <div className="hidden lg:flex items-center gap-1.5 px-3 pb-4 mb-3 border-b border-zinc-100">
          {userRole === "admin" ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-900 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-md">
              <Shield size={11} className="shrink-0" />
              Admin Control
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-50 border border-zinc-200/80 px-2 py-0.5 rounded-md">
              Organizer Studio
            </span>
          )}
        </div>

        <nav className="space-y-1 flex flex-col">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(item.href) &&
                item.href !== "/validate");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors duration-200 z-10 group ${
                  isActive
                    ? "text-zinc-900 bg-zinc-100 font-semibold"
                    : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50/50"
                }`}
                title={item.label}
              >
                <Icon
                  size={18}
                  className={`shrink-0 transition-colors duration-200 ${
                    isActive
                      ? "text-zinc-900"
                      : "text-zinc-400 group-hover:text-zinc-600"
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="lg:hidden text-[10px] font-semibold tracking-tight mt-0.5 truncate leading-none">
                  {item.shortLabel}
                </span>
                <span className="hidden lg:block whitespace-nowrap overflow-hidden text-ellipsis">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
