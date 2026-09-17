"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Award, 
  LayoutDashboard, 
  Stamp, 
  FileSpreadsheet, 
  ShieldCheck, 
  LogOut,
  UserCheck,
  Calendar,
  ArrowRight
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isLandingMode = pathname === "/" || isAuthPage;
  const isValidateMode = pathname.startsWith("/validate");
  const isDashboardMode = pathname.startsWith("/dashboard");

  const [confirmLogout, setConfirmLogout] = useState(false);
  const logoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const routeStateRef = useRef({ current: pathname, source: pathname });
  if (routeStateRef.current.current !== pathname) {
    routeStateRef.current.source = routeStateRef.current.current;
    routeStateRef.current.current = pathname;
  }
  
  const sourcePath = routeStateRef.current.source;
  const wasLanding = sourcePath === "/" || sourcePath === "/login" || sourcePath === "/register";
  const wasValidate = sourcePath.startsWith("/validate");
  const wasDashboard = sourcePath.startsWith("/dashboard");

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [animating, setAnimating] = useState(false);

  // Block clicks during transitions to prevent animation glitches from spamming
  useEffect(() => {
    const isMajorTransition = 
      (sourcePath.startsWith("/validate") && pathname.startsWith("/dashboard")) ||
      (sourcePath.startsWith("/dashboard") && pathname.startsWith("/validate"));
      
    setAnimating(true);
    const timer = setTimeout(() => {
      setAnimating(false);
    }, isMajorTransition ? 1400 : 400); // 1.4s for flight + fade, 0.4s for normal nav
    
    return () => clearTimeout(timer);
  }, [pathname, sourcePath]);

  // Prefetch pages
  useEffect(() => {
    router.prefetch('/validate');
    router.prefetch('/dashboard');
  }, [router]);

  // Native layoutId flight animation architecture removes need for manual triggers

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/events", label: "Events", icon: Calendar },
    { href: "/dashboard/templates", label: "Templates", icon: Stamp },
    { href: "/dashboard/generate", label: "Generate", icon: FileSpreadsheet },
  ];

  return (
    <>
      <header className={`sticky top-0 z-50 no-print px-4 sm:px-6 transition-all duration-700 ease-[cubic-bezier(0.85,0,0.15,1)] flex items-center ${
        isLandingMode 
          ? 'bg-black border-b-4 border-gray-900 h-20' 
          : 'bg-white border-b-2 border-black h-16'
      } ${animating ? 'pointer-events-none' : ''}`}>
        <div className="max-w-7xl mx-auto w-full h-full flex justify-between items-center">
          
          {/* Left area begins */}
          {/* Brand/Logo Area - Fixed width to prevent layout shifts when .portal is added */}
          <div className="w-[200px] shrink-0 h-full flex items-center">
            <Link 
              href={isLandingMode ? "/" : "/dashboard"} 
              className={`flex items-center h-full transition-all duration-700 ease-[cubic-bezier(0.85,0,0.15,1)] z-50 ${
                (pathname === "/dashboard" || pathname === "/" || pathname.startsWith("/validate")) ? 'cursor-default pointer-events-none' : ''
              }`}
            >
              <div className="flex items-baseline relative transition-all duration-700">
                <motion.span 
                  initial={false}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    fontSize: isLandingMode ? "36px" : "30px",
                    color: isLandingMode ? "#ffffff" : "#000000"
                  }}
                  transition={{ duration: 0.7, ease: [0.85, 0, 0.15, 1] }}
                  className="font-black tracking-[-0.08em] lowercase leading-none relative z-10" 
                  style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
                >
                  shim
                </motion.span>
                
                <AnimatePresence initial={false}>
                  {isLandingMode && (
                    <motion.span 
                      key="subtitle"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.4, ease: [0.85, 0, 0.15, 1] }}
                      className="text-[0.6rem] font-bold text-gray-400 uppercase tracking-widest absolute top-full left-0 whitespace-nowrap"
                    >
                      Digital Credential Platform
                    </motion.span>
                  )}
                </AnimatePresence>
                
                <span className="relative grid items-baseline">
                  <AnimatePresence initial={false}>
                    {isDashboardMode && (
                      <motion.span 
                        key="portal-dashboard"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.3, ease: "easeOut" } }}
                        transition={{ duration: 0.7, delay: wasValidate ? 0.3 : 0, ease: [0.85, 0, 0.15, 1] }}
                        className="col-start-1 row-start-1 text-black pointer-events-none text-3xl font-black tracking-[-0.08em] lowercase leading-none"
                        style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
                      >
                        .portal
                      </motion.span>
                    )}
                    {isValidateMode && (
                      <motion.span 
                        key="validate-mode-text"
                        layoutId={isMounted ? "validate-text" : undefined}
                        initial={wasLanding ? { opacity: 0 } : false}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.7, ease: [0.85, 0, 0.15, 1] }}
                        className="col-start-1 row-start-1 text-gray-400 pointer-events-none text-3xl font-black tracking-[-0.08em] lowercase leading-none"
                        style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
                      >
                        .validate
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              </div>
            </Link>
          </div>

          {/* Dynamic Center/Right Content */}
          <div className="flex items-center h-full gap-8 relative overflow-hidden flex-1 justify-end">
            

            <AnimatePresence initial={false}>
              {isLandingMode ? (
                <motion.div 
                  key="landing-mode"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, delay: (wasDashboard || wasValidate) ? 0.3 : 0 }}
                  className="flex items-center gap-6 h-full absolute right-0"
                >
                  {!isAuthPage && (
                    <>
                      <Link href="/validate" className="text-[13px] font-bold text-white hover:text-gray-300 transition-colors flex items-center gap-1.5 uppercase tracking-widest bg-gray-900 border-2 border-gray-700 px-3 py-1.5 hover:border-gray-500">
                        Verify
                      </Link>
                      <div className="h-6 w-px bg-gray-800"></div>
                      <Link href="/login" className="text-[13px] font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest">
                        Sign In
                      </Link>
                      <Link href="/register" className="bg-white hover:bg-gray-200 text-black transition-colors text-[13px] font-bold uppercase tracking-widest px-5 py-2.5 flex items-center gap-2">
                        Get Started
                        <ArrowRight size={14} />
                      </Link>
                    </>
                  )}
                </motion.div>
              ) : isValidateMode ? (
                <motion.div 
                  key="validate-mode"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.3, ease: "easeOut" } }}
                  transition={{ duration: 0.7, delay: wasDashboard ? 0.3 : 0, ease: [0.85, 0, 0.15, 1] }}
                  className="flex items-center h-full absolute right-0"
                >
                  {session?.user ? (
                    <Link 
                      href="/dashboard"
                      className="text-[0.65rem] font-bold text-black border-2 border-black hover:bg-black hover:text-white transition-all px-4 py-2 uppercase tracking-widest flex items-center gap-2 relative z-10 bg-white"
                    >
                      <LayoutDashboard size={14} />
                      <span>Dashboard</span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-6 z-10 bg-white p-2">
                      <Link href="/" className="text-[0.65rem] font-bold text-gray-500 hover:text-black uppercase tracking-widest transition-colors">
                        Home
                      </Link>
                      <Link href="/login" className="text-[0.65rem] font-bold text-black border-2 border-black hover:bg-black hover:text-white transition-colors px-4 py-2 uppercase tracking-widest">
                        Sign In
                      </Link>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="dashboard-mode"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 1, transition: { duration: 0.7 } }}
                  className="flex items-center h-full w-full absolute inset-0 pointer-events-none"
                >
                  {/* Navigation Links - Centered/Leftish */}
                  <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.3, ease: "easeOut" } }}
                  transition={{ duration: 0.7, delay: wasValidate ? 0.3 : 0, ease: [0.85, 0, 0.15, 1] }}
                  className="flex-1 flex justify-center md:justify-start md:pl-[20px] pointer-events-auto h-full"
                  >
                  <nav 
                    className="flex items-center gap-8 h-full transition-all duration-700 ease-[cubic-bezier(0.85,0,0.15,1)]"
                  >
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href) && item.href !== "/validate");
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`relative flex items-center gap-2 h-full font-medium text-sm transition-colors ${
                            isActive 
                              ? "text-black font-bold" 
                              : "text-slate-500 hover:text-black"
                          }`}
                          title={item.label}
                        >
                          <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-black" : "text-slate-400"} />
                          <span className={`uppercase tracking-wider text-xs sm:text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                          
                          {isActive && (
                            <motion.div 
                              layoutId="navbar-active-border" 
                              className="absolute bottom-[-2px] left-0 right-0 h-[3px] bg-black"
                              initial={false}
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30
                              }}
                            />
                          )}
                        </Link>
                      );
                    })}
                  </nav>

                  </motion.div>

                  {/* User Session & Actions - Right aligned */}
                  <div className="flex items-center gap-4 h-full transition-all duration-700 ease-[cubic-bezier(0.85,0,0.15,1)] pointer-events-auto pr-0">
                    {/* Fixed width wrapper prevents siblings from jumping left when .validate flies away */}
                    <div className="w-[130px] flex items-center justify-start shrink-0 pr-4">
                      {isDashboardMode && (
                        <Link
                          href="/validate"
                          className="flex items-center font-bold text-black border border-transparent transition-colors group hover:text-black"
                          title="Open Public Validator"
                        >
                          <motion.span 
                            layoutId={isMounted ? "validate-text" : undefined}
                            transition={{ duration: 0.7, ease: [0.85, 0, 0.15, 1] }}
                            className="font-black text-3xl text-gray-400 tracking-[-0.08em] lowercase leading-none transition-colors group-hover:text-black" 
                            style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
                          >
                            .validate
                          </motion.span>
                        </Link>
                      )}
                    </div>

                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, transition: { duration: 0.3, ease: "easeOut" } }}
                      transition={{ duration: 0.7, delay: wasValidate ? 0.3 : 0, ease: [0.85, 0, 0.15, 1] }}
                      className="flex items-center gap-4 h-full"
                    >
                      <div className="w-px h-6 bg-gray-300"></div>

                      {isDashboardMode && (
                        <div className="flex items-stretch border-[3px] border-black h-9 bg-white shrink-0">
                          <div className="hidden md:flex px-3 py-1 flex-col justify-center border-r-[3px] border-black max-w-[10rem] xl:max-w-[14rem] bg-slate-50">
                            <span className="text-[10px] font-bold text-black uppercase tracking-widest leading-none truncate">
                              {session?.user?.name || "Organizer"}
                            </span>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none truncate mt-0.5">
                              {session?.user?.email || "..."}
                            </span>
                          </div>
                          <div className="w-9 h-full bg-black text-white flex items-center justify-center font-bold text-sm shrink-0">
                            {session?.user?.name?.charAt(0).toUpperCase() || <UserCheck size={16} />}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={async () => {
                          if (!confirmLogout) {
                            setConfirmLogout(true);
                            if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
                            logoutTimeoutRef.current = setTimeout(() => {
                              setConfirmLogout(false);
                            }, 3000);
                          } else {
                            if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
                            setConfirmLogout(false);
                            // Clear session cookie FIRST so page.tsx doesn't redirect us back to dashboard
                            await signOut({ redirect: false });
                            // Then trigger smooth layout transition
                            router.push("/");
                          }
                        }}
                        className={`shrink-0 flex items-center justify-center border-[3px] transition-all ml-2 overflow-hidden ${
                          confirmLogout 
                            ? "w-[120px] h-9 border-red-600 bg-red-600 text-white hover:bg-red-700 hover:border-red-700" 
                            : "w-9 h-9 border-transparent hover:border-black hover:bg-black hover:text-white text-slate-400"
                        }`}
                        title="Sign Out"
                      >
                        <AnimatePresence mode="wait">
                          {confirmLogout ? (
                            <motion.span 
                              key="confirm"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                              className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                            >
                              Confirm
                            </motion.span>
                          ) : (
                            <motion.div 
                              key="icon"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <LogOut size={16} strokeWidth={2.5} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>


    </>
  );
}
