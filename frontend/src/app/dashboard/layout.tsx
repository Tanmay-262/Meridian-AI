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
      <div className="flex min-h-screen items-center justify-center bg-[#09090b] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-zinc-400 text-sm tracking-wide">Validating session...</p>
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
  ];

  const userDisplayName = user.profile?.full_name || user.email.split("@")[0];

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col md:flex-row">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 h-[400px] w-[600px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-[400px] w-[600px] rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />

      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-800/80 bg-zinc-950/40 backdrop-blur-md flex flex-col z-20">
        <div className="px-6 py-5 flex items-center gap-3 border-b border-zinc-800/40">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-md shadow-indigo-500/10">
            <span className="text-xs font-bold text-white tracking-wider">M</span>
          </div>
          <span className="font-semibold text-base tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
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
                    ? "bg-indigo-600/15 border border-indigo-500/35 text-indigo-400 shadow-md"
                    : "text-zinc-400 border border-transparent hover:bg-zinc-900/50 hover:text-white"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-zinc-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex-shrink-0 flex items-center justify-center font-bold text-sm">
              {userDisplayName[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-zinc-200 truncate">{userDisplayName}</p>
              <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-2 text-zinc-400 hover:text-red-400 transition-colors duration-200 text-sm"
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
