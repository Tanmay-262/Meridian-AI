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
      <div className="flex min-h-screen items-center justify-center bg-[#0b0f19] text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-slate-400 text-sm tracking-wide">Validating session...</p>
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
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col md:flex-row">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 h-[400px] w-[600px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-[400px] w-[600px] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />

      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800/80 bg-slate-900/40 backdrop-blur-md flex flex-col z-20">
        <div className="px-6 py-5 flex items-center gap-3 border-b border-slate-800/40">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/20">
            <span className="text-xs font-bold text-slate-950 tracking-wider">M</span>
          </div>
          <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Meridian OS
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-sm"
                    : "text-slate-400 border border-transparent hover:bg-slate-800/50 hover:text-slate-100"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-slate-950 flex-shrink-0 flex items-center justify-center font-bold text-sm">
              {userDisplayName[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-slate-200 truncate">{userDisplayName}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-2 text-slate-400 hover:text-rose-400 transition-colors duration-200 text-sm"
          >
            🚪
          </button>
        </div>
      </aside>

      {/* Main Dashboard Screen View */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto relative z-10">
        {children}
      </div>
    </div>
  );
}
