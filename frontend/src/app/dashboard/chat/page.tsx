"use client";

import React, { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";

interface Message {
  id: number;
  thread_id: string;
  role: string;
  content: string;
  created_at: string;
}

interface Thread {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

export default function ChatPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isFetchingThreads, setIsFetchingThreads] = useState(true);
  const [isFetchingMessages, setIsFetchingMessages] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [isCreatingThread, setIsCreatingThread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch threads on load
  const fetchThreads = async (selectFirst = false) => {
    try {
      const data = await apiFetch<Thread[]>("/chat/threads");
      setThreads(data);
      if (selectFirst && data.length > 0 && !activeThreadId) {
        handleSelectThread(data[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch chat threads:", err);
    } finally {
      setIsFetchingThreads(false);
    }
  };

  useEffect(() => {
    fetchThreads(true);
  }, []);

  // Scroll on message updates
  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSelectThread = async (threadId: string) => {
    setActiveThreadId(threadId);
    setIsFetchingMessages(true);
    setMessages([]);
    try {
      const data = await apiFetch<Message[]>(`/chat/threads/${threadId}/messages`);
      setMessages(data);
    } catch (err) {
      console.error("Failed to load thread messages:", err);
    } finally {
      setIsFetchingMessages(false);
    }
  };

  const handleCreateThreadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newThreadTitle.trim() || "New Chat";
    setIsCreatingThread(true);
    try {
      const newThread = await apiFetch<Thread>("/chat/threads", {
        method: "POST",
        body: JSON.stringify({ title }),
      });
      setThreads((prev) => [newThread, ...prev]);
      setActiveThreadId(newThread.id);
      setMessages([]);
      setNewThreadTitle("");
    } catch (err) {
      console.error("Failed to create thread:", err);
    } finally {
      setIsCreatingThread(false);
    }
  };

  const handleSendMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeThreadId || isSending) return;

    const userText = inputText.trim();
    setInputText("");
    setIsSending(true);

    // Optimistic UI updates
    const tempUserMsg: Message = {
      id: Date.now(),
      thread_id: activeThreadId,
      role: "user",
      content: userText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const replyMsg = await apiFetch<Message>(
        `/chat/threads/${activeThreadId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ content: userText }),
        }
      );
      setMessages((prev) => [...prev, replyMsg]);
      
      // Update thread update order locally
      setThreads((prev) =>
        prev
          .map((t) =>
            t.id === activeThreadId
              ? { ...t, updated_at: new Date().toISOString() }
              : t
          )
          .sort(
            (a, b) =>
              new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          )
      );
    } catch (err) {
      console.error("Failed to send message:", err);
      // Append error message block
      const tempErrorMsg: Message = {
        id: Date.now() + 1,
        thread_id: activeThreadId,
        role: "assistant",
        content: "Sorry, I ran into an error connecting to the reasoning server. Please check your connection or LLM provider configuration.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempErrorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  // Safe client-side markdown formatter
  const renderMessageContent = (content: string) => {
    const lines = content.split("\n");
    let inCodeBlock = false;

    return lines.map((line, lineIdx) => {
      // Handle code block boundaries
      if (line.startsWith("```")) {
        inCodeBlock = !inCodeBlock;
        return null; // Don't render backticks
      }

      if (inCodeBlock) {
        return (
          <pre
            key={lineIdx}
            className="bg-zinc-950 px-4 py-1.5 rounded-lg font-mono text-xs overflow-x-auto border border-zinc-800/40 text-emerald-400/90 leading-relaxed my-1"
          >
            <code>{line}</code>
          </pre>
        );
      }

      // Simple bullet point conversion
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={lineIdx} className="ml-4 list-disc text-sm text-zinc-300 py-0.5">
            {formatBoldText(line.slice(2))}
          </li>
        );
      }

      // Standard text line
      return (
        <p key={lineIdx} className="text-sm text-zinc-300 leading-relaxed my-1 min-h-[1rem]">
          {formatBoldText(line)}
        </p>
      );
    });
  };

  // Bolding formatter regex helper
  const formatBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, partIdx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={partIdx} className="text-white font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <main className="flex-1 flex min-h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden relative animate-fadeIn">
      {/* Sidebar Threads Drawer (Left) */}
      <aside className="w-80 border-r border-zinc-800/80 bg-zinc-950/20 backdrop-blur-md flex flex-col hidden sm:flex">
        {/* Create new thread input */}
        <div className="p-4 border-b border-zinc-800/40">
          <form onSubmit={handleCreateThreadSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Start new thread..."
              value={newThreadTitle}
              onChange={(e) => setNewThreadTitle(e.target.value)}
              disabled={isCreatingThread}
              className="flex-1 rounded-xl border border-slate-800 bg-slate-950/50 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={isCreatingThread || !newThreadTitle.trim()}
              className="rounded-xl bg-slate-900 border border-slate-800 px-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-50"
            >
              ＋
            </button>
          </form>
        </div>

        {/* Thread listings */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {isFetchingThreads ? (
            <div className="flex flex-col items-center justify-center p-8 gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border border-emerald-500 border-t-transparent" />
              <p className="text-slate-600 text-[10px]">Loading chats...</p>
            </div>
          ) : threads.length === 0 ? (
            <p className="text-slate-500 text-xs text-center p-4">No conversations started yet.</p>
          ) : (
            threads.map((thread) => {
              const isActive = thread.id === activeThreadId;
              return (
                <button
                  key={thread.id}
                  onClick={() => handleSelectThread(thread.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-205 flex flex-col gap-1 ${
                    isActive
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "border-transparent text-slate-400 hover:bg-slate-900/50 hover:text-slate-200"
                  }`}
                >
                  <span className="text-xs font-semibold truncate block w-full">
                    {thread.title}
                  </span>
                  <span className="text-[9px] text-slate-600">
                    {new Date(thread.updated_at).toLocaleDateString()}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Message Chat Room (Right) */}
      <section className="flex-1 flex flex-col min-w-0 bg-slate-950/20">
        {/* Active room header */}
        <div className="px-6 py-4 border-b border-slate-800/40 bg-slate-900/30 backdrop-blur-md flex items-center justify-between min-h-[4rem]">
          {activeThreadId ? (
            <div>
              <h2 className="text-sm font-semibold text-slate-200">
                {threads.find((t) => t.id === activeThreadId)?.title || "Active Chat"}
              </h2>
              <p className="text-[10px] text-slate-500">Connected to Meridian Reasoning Engine</p>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Select or start a chat thread to begin.</p>
          )}
        </div>

        {/* Message bubble stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!activeThreadId ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <span className="text-3xl mb-3">💬</span>
              <h4 className="font-semibold text-sm mb-1 text-slate-300">Meridian persistent memory chat</h4>
              <p className="text-slate-500 text-xs max-w-xs">
                Start a thread from the history bar to converse with your AI agent, search uploaded files, and update profile memories.
              </p>
            </div>
          ) : isFetchingMessages ? (
            <div className="h-full flex flex-col items-center justify-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border border-emerald-500 border-t-transparent" />
              <p className="text-slate-500 text-xs">Syncing chat room history...</p>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isAgent = msg.role === "assistant";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isAgent ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl p-4 text-xs shadow-md border ${
                        isAgent
                          ? "bg-slate-900/40 border-slate-800/80 text-slate-200 rounded-tl-sm backdrop-blur-sm"
                          : "bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-400/40 text-slate-950 font-medium rounded-tr-sm"
                      }`}
                    >
                      <div className="space-y-1.5">
                        {renderMessageContent(msg.content)}
                      </div>
                      <span className={`text-[8px] block mt-2 text-right ${isAgent ? "text-slate-500" : "text-slate-800"}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Generating typing loader bubble */}
              {isSending && (
                <div className="flex justify-start">
                  <div className="max-w-[75%] rounded-2xl rounded-tl-sm p-4 bg-slate-900/30 border border-slate-800/40 text-slate-400 flex items-center gap-1.5">
                    <span className="text-[10px]">Meridian OS is reasoning</span>
                    <span className="flex gap-1">
                      <span className="h-1 w-1 bg-emerald-500 rounded-full animate-bounce delay-75" />
                      <span className="h-1 w-1 bg-emerald-500 rounded-full animate-bounce delay-150" />
                      <span className="h-1 w-1 bg-emerald-500 rounded-full animate-bounce delay-225" />
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input box */}
        <div className="p-4 border-t border-slate-800/40 bg-slate-900/30 backdrop-blur-md">
          <form onSubmit={handleSendMessageSubmit} className="flex gap-2 max-w-4xl mx-auto">
            <input
              type="text"
              placeholder={
                activeThreadId
                  ? "Type your message..."
                  : "Please select a conversation thread first."
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={!activeThreadId || isSending}
              className="flex-1 rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500 focus:bg-slate-950/80 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!activeThreadId || isSending || !inputText.trim()}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 text-xs font-semibold text-slate-950 hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
