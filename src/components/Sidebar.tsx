"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Stamp, 
  FileSpreadsheet, 
  Calendar,
  BookOpen,
  History
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/credentials", label: "Credentials", icon: BookOpen },
    { href: "/dashboard/events", label: "Events", icon: Calendar },
    { href: "/dashboard/templates", label: "Templates", icon: Stamp },
    { href: "/dashboard/generate", label: "Generate", icon: FileSpreadsheet },
    { href: "/dashboard/audit", label: "Audit Trail", icon: History },
  ];

  const isTemplateStudio = /^\/dashboard\/templates\/[^/]+$/.test(pathname);
  const isEventStudio = /^\/dashboard\/events\/[^/]+$/.test(pathname);
  const isStudioMode = isTemplateStudio || isEventStudio;

  return (
    <aside 
      className={`mob-tabbar flex-shrink-0 border-zinc-200 bg-white/50 backdrop-blur-md flex flex-col h-full sticky top-16 z-40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-hidden ${
        isStudioMode ? 'mob-tabbar-off w-0 border-r-0 opacity-0' : 'w-[72px] lg:w-[180px] border-r opacity-100'
      }`}
    >
      <div className="p-4 py-8 flex-1 min-w-[72px] lg:min-w-[180px]">
        <nav className="space-y-1 flex flex-col">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href) && item.href !== "/validate");
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors duration-200 z-10 group ${
                  isActive 
                    ? "text-zinc-800 bg-zinc-100" 
                    : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50/50"
                }`}
                title={item.label}
              >
                <Icon size={18} className={`shrink-0 transition-colors duration-200 ${isActive ? "text-zinc-800" : "text-zinc-400 group-hover:text-zinc-600"}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className="hidden lg:block whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
