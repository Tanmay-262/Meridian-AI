"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check your credentials.");
      setIsSubmitting(false);
    }
  };

  if (isLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b10] text-[#f0f5fa]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#45d6c5] border-t-transparent" />
          <p className="text-[#71818c] text-sm tracking-wide">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070b10] px-4 py-12 sm:px-6 lg:px-8">
      {/* Background ambient mesh gradients */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[#45d6c5]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-[#5b9cff]/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand identity */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-[#45d6c5] to-[#5b9cff] shadow-lg shadow-[#45d6c5]/20 mb-4 transition-transform hover:scale-105 duration-300">
            <span className="text-xl font-bold text-[#070b10] tracking-wider">M</span>
          </div>
          <h2 className="text-3xl font-extrabold text-[#f0f5fa] tracking-tight sm:text-4xl">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-[#71818c]">
            Enter details to access your personal workspace
          </p>
        </div>

        {/* Card wrapper with glassmorphism */}
        <div className="rounded-2xl border border-[#1d2a3d] bg-[#0d151e] p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 animate-pulse">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-[#71818c] uppercase tracking-wider mb-2 font-mono">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-xl border border-[#1d2a3d] bg-[#070b10] px-4 py-3 text-[#f0f5fa] placeholder-[#71818c] outline-none transition-colors duration-200 focus:border-[#45d6c5]"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-[#71818c] uppercase tracking-wider mb-2 font-mono">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-xl border border-[#1d2a3d] bg-[#070b10] px-4 py-3 text-[#f0f5fa] placeholder-[#71818c] outline-none transition-colors duration-200 focus:border-[#45d6c5]"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="relative flex w-full justify-center rounded-xl bg-gradient-to-r from-[#45d6c5] to-[#5b9cff] px-4 py-3 text-sm font-bold text-[#070b10] shadow-lg transition-all duration-300 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#71818c]">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-[#45d6c5] transition-colors duration-200 hover:underline"
              >
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
