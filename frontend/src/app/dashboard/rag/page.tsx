"use client";

import React, { useState } from "react";
import { apiFetch } from "@/lib/api";

interface RAGSearchResult {
  text: string;
  score: number;
  document_id: number;
  filename: string;
}

export default function RAGPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RAGSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      // Query semantic search endpoint, limit to top 5 hits
      const data = await apiFetch<RAGSearchResult[]>(
        `/rag/search?q=${encodeURIComponent(query)}&limit=5`
      );
      setResults(data);
    } catch (err: any) {
      console.error("Semantic search failed:", err);
      setError(err.message || "Failed to complete semantic search query.");
    } finally {
      setIsLoading(false);
    }
  };

  // Convert decimal cosine score to percentage representation
  const formatScore = (score: number) => {
    return Math.round(score * 100) + "%";
  };

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-8 grid gap-8 animate-fadeIn">
      {/* Title Header */}
      <section className="flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Semantic RAG Q&A
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base max-w-xl">
          Search your Knowledge Hub documents. The system embeds your query using PyTorch to retrieve semantically matching text segments with citations.
        </p>
      </section>

      {/* Query input zone */}
      <section className="rounded-2xl border border-slate-800/80 bg-slate-900/30 p-6 backdrop-blur-sm">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Ask a question about your documents..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
              className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 pl-11 pr-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-emerald-500 focus:bg-slate-950/80"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3.5 text-xs font-semibold text-slate-950 shadow-lg shadow-emerald-500/10 transition-all hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </form>
      </section>

      {/* Results grid */}
      <section className="grid gap-6">
        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-400">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="text-slate-500 text-xs tracking-wide">Executing PyTorch embedding & Qdrant search...</p>
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12 bg-slate-950/20 rounded-2xl border border-dashed border-slate-800">
            <span className="text-3xl mb-3">🔍</span>
            <h4 className="font-semibold text-sm mb-1 text-slate-300">No matching segments found</h4>
            <p className="text-slate-500 text-xs max-w-sm">
              Your search did not match any text chunks inside your Knowledge Hub. Try modifying your query or adding more files.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {hasSearched && (
              <h3 className="font-semibold text-xs text-slate-500 uppercase tracking-widest mb-2">
                Top Matches ({results.length})
              </h3>
            )}
            
            {results.map((result, idx) => {
              const isWord = result.filename.endsWith(".docx") || result.filename.endsWith(".doc");
              return (
                <div
                  key={idx}
                  className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/30 p-6 backdrop-blur-sm hover:border-slate-700/60 transition-all duration-300 flex flex-col gap-4"
                >
                  {/* Result Header: Citation & Similarity Score */}
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800/40 pb-3">
                    {/* Citation Source Badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{isWord ? "🟦" : "🟥"}</span>
                      <span className="text-xs font-semibold text-slate-200">{result.filename}</span>
                    </div>

                    {/* Cosine Score Badge */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Similarity Score:</span>
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                        {formatScore(result.score)}
                      </span>
                    </div>
                  </div>

                  {/* Grounded text block */}
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {result.text}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
