"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
export default function DashboardTransition({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      {children}
    </AnimatePresence>
  );
}
