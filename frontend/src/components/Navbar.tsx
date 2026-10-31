"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Archive,
  MessageSquareQuote,
  Ghost,
  Clock,
  Sparkles,
  Settings,
  ShieldCheck,
  FolderLock,
  Layers,
  HelpCircle
} from "lucide-react";
import { fetchSystemStatus } from "@/lib/api";

export default function Navbar() {
  const pathname = usePathname();
  const [isOfflineReady, setIsOfflineReady] = useState<boolean | null>(null);

  useEffect(() => {
    fetchSystemStatus()
      .then((stat) => setIsOfflineReady(stat.is_fully_offline))
      .catch(() => setIsOfflineReady(false));
  }, []);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: Compass },
    { label: "Memory Vault", href: "/vault", icon: Archive },
    { label: "Ask Archive", href: "/ask", icon: MessageSquareQuote },
    { label: "Ghost Chamber", href: "/ghost-chamber", icon: Ghost, highlight: true },
    { label: "Timeline", href: "/timeline", icon: Clock },
    { label: "Forgotten Drawer", href: "/forgotten-drawer", icon: Layers },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#2C2925] bg-[#0D0D0F]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded border border-[#5A4A32] bg-[#17171C] flex items-center justify-center text-[#D6A65C] group-hover:border-[#D6A65C] transition-colors shadow-sm">
            <FolderLock className="w-5 h-5 text-[#D6A65C] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-serif tracking-wider text-lg font-medium text-[#E8E0D2] group-hover:text-[#D6A65C] transition-colors">
                EchoVault
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border border-[#3E3830] text-[#9E988E] bg-[#141418]">
                v1.0
              </span>
            </div>
            <p className="text-[10px] text-[#7A756D] font-mono tracking-tight -mt-0.5 hidden sm:block">
              Week 4: Ghost in the Machine
            </p>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-mono tracking-wide transition-all ${
                  isActive
                    ? "bg-[#1E1C1A] text-[#D6A65C] border border-[#5A4A32] shadow-sm"
                    : item.highlight
                    ? "text-[#D6A65C] hover:bg-[#1A1816] hover:text-[#E8E0D2]"
                    : "text-[#9E988E] hover:text-[#E8E0D2] hover:bg-[#15151A]"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#D6A65C]" : item.highlight ? "text-[#D6A65C]" : "text-[#7A756D]"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Local Privacy indicator */}
        <div className="flex items-center space-x-3">
          <Link
            href="/settings"
            title="Privacy status: All memories and inference remain strictly local"
            className="flex items-center space-x-1.5 text-xs font-mono px-2.5 py-1 rounded border border-[#302B24] bg-[#121216] hover:border-[#5A4A32] transition-colors"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${isOfflineReady ? "text-[#7E8B68]" : "text-[#D6A65C]"}`} />
            <span className="hidden lg:inline text-[#9E988E]">
              {isOfflineReady ? "Local Inference Ready" : "Local AI Active"}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#7E8B68] animate-ping" />
          </Link>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="md:hidden flex overflow-x-auto border-t border-[#22201D] bg-[#101014] px-2 py-1.5 space-x-1 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-mono whitespace-nowrap ${
                isActive
                  ? "bg-[#221F1B] text-[#D6A65C] border border-[#5A4A32]"
                  : "text-[#9E988E]"
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
