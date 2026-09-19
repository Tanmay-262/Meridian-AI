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
      {/* Visual Identity Spec Header */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#45d6c5] uppercase tracking-wider font-semibold">
            MERIDIAN DS / VISUAL IDENTITY
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#f0f5fa]">
          Intelligent, <span className="text-[#71818c] font-normal">but not loud.</span>
        </h1>
        <p className="text-[#71818c] text-xs sm:text-sm max-w-2xl leading-relaxed">
          A premium dark interface built around deep space tones, Meridian teal, restrained blue-violet intelligence accents, and a subtle warm signal.
        </p>
      </section>

      {/* System Overview Metrics Panel */}
      <section className="rounded-2xl border border-[#1d2a3d] bg-[#0d151e] p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-[#1d2a3d] pb-4">
          <h2 className="text-lg font-bold text-[#f0f5fa] tracking-tight">System Overview</h2>
          <span className="text-[10px] font-mono text-[#45d6c5] bg-[#45d6c5]/10 border border-[#45d6c5]/20 px-2.5 py-1 rounded-full font-semibold">
            ● SYSTEM ONLINE
          </span>
        </div>

        {/* 3 Core Metric Cards */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          {/* Knowledge Card */}
          <div className="rounded-xl border border-[#1d2a3d] bg-[#111d2a]/60 p-5 space-y-3">
            <p className="text-[10px] font-mono font-bold text-[#71818c] uppercase tracking-wider">KNOWLEDGE</p>
            <p className="text-3xl font-extrabold text-[#f0f5fa] font-mono">
              {isLoadingStats ? "..." : (docCount !== null ? docCount : "2,481")}
            </p>
            <div className="h-1.5 w-full bg-[#070b10] rounded-full overflow-hidden">
              <div className="h-full bg-[#45d6c5] w-3/4 rounded-full" />
            </div>
          </div>

          {/* Memory Card */}
          <div className="rounded-xl border border-[#1d2a3d] bg-[#111d2a]/60 p-5 space-y-3">
            <p className="text-[10px] font-mono font-bold text-[#71818c] uppercase tracking-wider">MEMORY</p>
            <p className="text-3xl font-extrabold text-[#f0f5fa] font-mono">
              {isLoadingStats ? "..." : (threadCount !== null ? `${threadCount} Threads` : "86%")}
            </p>
            <div className="h-1.5 w-full bg-[#070b10] rounded-full overflow-hidden">
              <div className="h-full bg-[#a27bff] w-4/5 rounded-full" />
            </div>
          </div>

          {/* Agents Card */}
          <div className="rounded-xl border border-[#1d2a3d] bg-[#111d2a]/60 p-5 space-y-3">
            <p className="text-[10px] font-mono font-bold text-[#71818c] uppercase tracking-wider">AGENTS</p>
            <p className="text-3xl font-extrabold text-[#f0f5fa] font-mono">04</p>
            <div className="h-1.5 w-full bg-[#070b10] rounded-full overflow-hidden">
              <div className="h-full bg-[#5b9cff] w-2/3 rounded-full" />
            </div>
          </div>
        </div>

        {/* Multi-spectrum divider line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-[#45d6c5] via-[#a27bff] to-[#d5a65b] rounded-full" />
      </section>

      {/* Feature Navigation Cards Grid */}
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Knowledge Hub */}
        <Link href="/dashboard/knowledge" className="group relative rounded-2xl border border-[#1d2a3d] bg-[#0d151e] p-6 transition-all duration-300 hover:border-[#45d6c5]/50 hover:bg-[#111d2a]">
          <div className="h-10 w-10 rounded-xl bg-[#45d6c5]/10 text-[#45d6c5] border border-[#45d6c5]/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
            📁
          </div>
          <h3 className="font-bold text-base text-[#f0f5fa] mb-2">Knowledge Hub</h3>
          <p className="text-[#71818c] text-xs leading-relaxed">
            Upload PDF or Word documents. Organize them with custom tags and manage your central document index.
          </p>
          <div className="mt-4 inline-flex items-center text-xs font-semibold text-[#45d6c5] gap-1 font-mono group-hover:translate-x-1 transition-transform">
            Open Hub →
          </div>
        </Link>

        {/* Card 2: AI Chat with Memory */}
        <Link href="/dashboard/chat" className="group relative rounded-2xl border border-[#1d2a3d] bg-[#0d151e] p-6 transition-all duration-300 hover:border-[#a27bff]/50 hover:bg-[#111d2a]">
          <div className="h-10 w-10 rounded-xl bg-[#a27bff]/10 text-[#a27bff] border border-[#a27bff]/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
            💬
          </div>
          <h3 className="font-bold text-base text-[#f0f5fa] mb-2">Persistent AI Chat</h3>
          <p className="text-[#71818c] text-xs leading-relaxed">
            Interact with your assistant. LangGraph memory maintains persistent facts across chat threads.
          </p>
          <div className="mt-4 inline-flex items-center text-xs font-semibold text-[#a27bff] gap-1 font-mono group-hover:translate-x-1 transition-transform">
            Start Chatting →
          </div>
        </Link>

        {/* Card 3: Grounded RAG Search */}
        <Link href="/dashboard/rag" className="group relative rounded-2xl border border-[#1d2a3d] bg-[#0d151e] p-6 transition-all duration-300 hover:border-[#5b9cff]/50 hover:bg-[#111d2a]">
          <div className="h-10 w-10 rounded-xl bg-[#5b9cff]/10 text-[#5b9cff] border border-[#5b9cff]/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
            🔍
          </div>
          <h3 className="font-bold text-base text-[#f0f5fa] mb-2">Semantic RAG Q&A</h3>
          <p className="text-[#71818c] text-xs leading-relaxed">
            Ask questions across document archives. Answers are generated using PyTorch vector similarity with citations.
          </p>
          <div className="mt-4 inline-flex items-center text-xs font-semibold text-[#5b9cff] gap-1 font-mono group-hover:translate-x-1 transition-transform">
            Run Search →
          </div>
        </Link>
      </section>

      {/* Visual Identity Palette Badges Footer */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
        <div className="rounded-xl border border-[#1d2a3d] bg-[#0d151e] p-4 flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-[#45d6c5]" />
          <div>
            <p className="text-xs font-bold text-[#f0f5fa]">Identity</p>
            <p className="text-[10px] text-[#71818c] font-mono">Meridian Teal</p>
          </div>
        </div>
        <div className="rounded-xl border border-[#1d2a3d] bg-[#0d151e] p-4 flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-[#5b9cff]" />
          <div>
            <p className="text-xs font-bold text-[#f0f5fa]">System</p>
            <p className="text-[10px] text-[#71818c] font-mono">Signal Blue</p>
          </div>
        </div>
        <div className="rounded-xl border border-[#1d2a3d] bg-[#0d151e] p-4 flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-[#a27bff]" />
          <div>
            <p className="text-xs font-bold text-[#f0f5fa]">Intelligence</p>
            <p className="text-[10px] text-[#71818c] font-mono">Violet</p>
          </div>
        </div>
        <div className="rounded-xl border border-[#1d2a3d] bg-[#0d151e] p-4 flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-[#d5a65b]" />
          <div>
            <p className="text-xs font-bold text-[#f0f5fa]">Signal</p>
            <p className="text-[10px] text-[#71818c] font-mono">Gold</p>
          </div>
        </div>
      </section>
    </main>
  );
}
