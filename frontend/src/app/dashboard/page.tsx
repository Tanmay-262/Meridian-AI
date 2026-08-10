"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";

export default function DashboardPage() {
  const { user } = useAuth();
  const [docCount, setDocCount] = useState<number | null>(null);
  const [threadCount, setThreadCount] = useState<number | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        const [docs, threads] = await Promise.all([
          apiFetch<any[]>("/documents"),
          apiFetch<any[]>("/chat/threads"),
        ]);
        setDocCount(docs.length);
        setThreadCount(threads.length);
      } catch (err) {
        console.error("Failed to load dashboard metrics:", err);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [user]);

  if (!user) return null; // safety fallback, handled by layout

  const userDisplayName = user.profile?.full_name || user.email.split("@")[0];

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 grid gap-8 animate-fadeIn">
      {/* Welcome Section */}
      <section className="flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Welcome, <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{userDisplayName}</span>
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base max-w-xl">
          This is your workspace command center. From here, you can manage your files, chat with long-term memory, and search document archives.
        </p>
      </section>

      {/* Real-time Stats Quick Grid */}
      <section className="grid gap-4 grid-cols-2 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/5 p-5 backdrop-blur-sm">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Knowledge Archive</p>
          <p className="text-2xl font-bold text-indigo-400">
            {isLoadingStats ? "..." : `${docCount} Files`}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/5 p-5 backdrop-blur-sm">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Chat Sessions</p>
          <p className="text-2xl font-bold text-purple-400">
            {isLoadingStats ? "..." : `${threadCount} Threads`}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/5 p-5 backdrop-blur-sm col-span-2 md:col-span-1">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Memory Engine</p>
          <p className="text-2xl font-bold text-emerald-400">Active</p>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Knowledge Hub */}
        <Link href="/dashboard/knowledge" className="group relative rounded-2xl border border-zinc-800/80 bg-zinc-900/10 p-6 backdrop-blur-sm transition-all duration-300 hover:border-indigo-500/50 hover:bg-zinc-900/30">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
            📁
          </div>
          <h3 className="font-semibold text-lg mb-2">Knowledge Hub</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Upload PDF or Word documents. Organize them with custom tags and manage your centralized document index.
          </p>
          <div className="mt-4 inline-flex items-center text-xs font-semibold text-indigo-400 gap-1 group-hover:text-indigo-300">
            Open Hub <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </div>
        </Link>

        {/* Card 2: AI Chat with Memory */}
        <Link href="/dashboard/chat" className="group relative rounded-2xl border border-zinc-800/80 bg-zinc-900/10 p-6 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/50 hover:bg-zinc-900/30">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
            💬
          </div>
          <h3 className="font-semibold text-lg mb-2">Persistent AI Chat</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Interact with your personal assistant. The chat maintains long-term memory and user profile context across sessions.
          </p>
          <div className="mt-4 inline-flex items-center text-xs font-semibold text-purple-400 gap-1 group-hover:text-purple-300">
            Start Chatting <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </div>
        </Link>

        {/* Card 3: Grounded RAG Search */}
        <Link href="/dashboard/rag" className="group relative rounded-2xl border border-zinc-800/80 bg-zinc-900/10 p-6 backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/50 hover:bg-zinc-900/30">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
            🔍
          </div>
          <h3 className="font-semibold text-lg mb-2">Semantic RAG Q&A</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Ask complex questions across your knowledge archives. Answers are generated using semantic search with citations.
          </p>
          <div className="mt-4 inline-flex items-center text-xs font-semibold text-emerald-400 gap-1 group-hover:text-emerald-300">
            Run Search <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </div>
        </Link>
      </section>

      {/* Profile Card */}
      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-950/30 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-lg">
            {userDisplayName[0].toUpperCase()}
          </div>
          <div>
            <h4 className="font-semibold">{userDisplayName}</h4>
            <p className="text-xs text-zinc-500">Theme: {user.profile?.theme} | Status: Active</p>
          </div>
        </div>
        <div className="text-xs text-zinc-400">
          Registered on: {new Date(user.created_at).toLocaleDateString()}
        </div>
      </section>
    </main>
  );
}
