"use client";

import React, { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Loader2 } from "lucide-react";

export type Option = {
  value: string;
  label: string;
  icon?: React.ReactNode;
  isGroupLabel?: boolean;
};

interface SelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  dropdownClassName?: string;
  isLoading?: boolean;
}

export function Select({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select an option", 
  className = "",
  dropdownClassName = "min-w-[200px]",
  isLoading = false
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({
    position: "fixed",
    top: -9999,
    left: -9999,
  });

  const selectedOption = options.find((opt) => opt.value === value);

  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUpwards = spaceBelow < 250 && spaceAbove > spaceBelow;

      setDropdownStyle({
        position: "fixed",
        top: openUpwards ? "auto" : rect.bottom + 4,
        bottom: openUpwards ? window.innerHeight - rect.top + 4 : "auto",
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        (containerRef.current && !containerRef.current.contains(target)) &&
        (!dropdownRef.current || !dropdownRef.current.contains(target))
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          if (!isLoading) setIsOpen(!isOpen);
        }}
        disabled={isLoading}
        className="w-full flex items-center justify-between gap-3 px-3 py-2 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-xl font-medium text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-700/10 focus:border-zinc-700 h-9 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        {isLoading ? (
          <Loader2 size={16} className="text-zinc-400 animate-spin shrink-0" />
        ) : (
          <ChevronDown 
            size={16} 
            className={`text-zinc-400 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`} 
          />
        )}
      </button>

      {isMounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: dropdownStyle.bottom !== "auto" ? 4 : -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropdownStyle.bottom !== "auto" ? 4 : -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`bg-white border border-zinc-200 rounded-xl overflow-hidden py-1 ${dropdownClassName}`}
            style={{ 
              ...dropdownStyle,
              transformOrigin: dropdownStyle.bottom !== "auto" ? "bottom" : "top",
              boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08), 0 0px 4px rgba(0, 0, 0, 0.02)"
            }}
          >
            <div className="max-h-[200px] overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
              {options.map((option) => (
                option.isGroupLabel ? (
                  <div key={option.value} className="px-2.5 py-1.5 mt-1 text-[11px] font-bold tracking-wider text-zinc-400 uppercase select-none first:mt-0">
                    {option.label}
                  </div>
                ) : (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 text-sm text-left transition-colors rounded-lg ${
                      value === option.value 
                        ? "bg-zinc-100/80 text-zinc-900" 
                        : "hover:bg-zinc-50 text-zinc-600"
                    }`}
                  >
                    <span className={`flex items-center gap-2 truncate ${value === option.value ? "font-medium" : ""}`}>
                      {option.icon}
                      {option.label}
                    </span>
                    {value === option.value && <Check size={14} className="text-zinc-800 shrink-0" />}
                  </button>
                )
              ))}
            </div>
          </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
