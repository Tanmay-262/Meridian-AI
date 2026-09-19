"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Enforce session check at layout level
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b10] text-[#f0f5fa]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#45d6c5] border-t-transparent" />
          <p className="text-[#71818c] text-sm tracking-wide font-mono">Validating session...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: "Overview", path: "/dashboard", icon: "📊" },
    { name: "Knowledge Hub", path: "/dashboard/knowledge", icon: "📁" },
    { name: "AI Chat", path: "/dashboard/chat", icon: "💬" },
    { name: "RAG Q&A", path: "/dashboard/rag", icon: "🔍" },
    { name: "Planner Calendar", path: "/dashboard/planner", icon: "📅" },
    { name: "Study Hub", path: "/dashboard/learning", icon: "🧠" },
  ];

  const userDisplayName = user.profile?.full_name || user.email.split("@")[0];

  return (
    <div className="min-h-screen bg-[#070b10] text-[#f0f5fa] flex flex-col md:flex-row font-sans">
      {/* Background radial glows */}
      <div className="absolute top-0 right-0 h-[400px] w-[600px] rounded-full bg-[#45d6c5]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-[400px] w-[600px] rounded-full bg-[#5b9cff]/5 blur-[120px] pointer-events-none" />

      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#1d2a3d] bg-[#0d151e] flex flex-col z-20">
        {/* Brand Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-[#1d2a3d]">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#45d6c5]/15 border border-[#45d6c5]/30">
              <span className="text-xs font-bold text-[#45d6c5] tracking-wider font-mono">M</span>
            </div>
            <span className="font-bold text-base tracking-tight text-[#f0f5fa]">
              MERIDIAN <span className="text-[10px] font-mono text-[#71818c]">/ Workspace</span>
            </span>
          </div>
        </div>

        {/* System Online Badge */}
        <div className="px-6 py-2 bg-[#111d2a]/50 border-b border-[#1d2a3d] flex items-center justify-between">
          <span className="text-[10px] font-mono text-[#71818c] uppercase tracking-wider">Status</span>
          <span className="text-[10px] font-mono text-[#45d6c5] flex items-center gap-1.5 font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-[#45d6c5] animate-pulse" />
            SYSTEM ONLINE
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-[#45d6c5]/10 border border-[#45d6c5]/30 text-[#45d6c5] shadow-sm"
                    : "text-[#71818c] border border-transparent hover:bg-[#111d2a] hover:text-[#f0f5fa]"
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-[#1d2a3d] bg-[#070b10]/40 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-8 w-8 rounded-lg bg-[#5b9cff]/15 border border-[#5b9cff]/30 flex-shrink-0 flex items-center justify-center font-bold text-xs text-[#5b9cff] font-mono">
              {userDisplayName[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-[#f0f5fa] truncate">{userDisplayName}</p>
              <p className="text-[10px] text-[#71818c] truncate font-mono">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-[#71818c] hover:text-red-400 hover:bg-red-500/10 transition-colors duration-200 text-xs"
          >
            🚪
          </button>
        </div>
      </aside>

      {/* Main Dashboard Screen View */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto relative z-10 bg-[#070b10]">
        {children}
      </div>
    </div>
  );
}
