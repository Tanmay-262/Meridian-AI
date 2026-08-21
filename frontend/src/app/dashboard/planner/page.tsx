"use client";

import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface PlannerEvent {
  id: string;
  user_id: number;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function PlannerPage() {
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  
  const [isFetching, setIsFetching] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "warning" } | null>(null);

  // Fetch events
  const fetchEvents = async () => {
    try {
      const data = await apiFetch<PlannerEvent[]>("/planner/events");
      setEvents(data);
    } catch (err: any) {
      console.error("Failed to load events:", err);
      setMessage({ text: err.message || "Failed to load events.", type: "error" });
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Check client-side if an event has a conflict/overlap
  const checkConflict = (target: PlannerEvent) => {
    const tStart = new Date(target.start_time).getTime();
    const tEnd = new Date(target.end_time).getTime();

    return events.some((ev) => {
      if (ev.id === target.id) return false;
      const s = new Date(ev.start_time).getTime();
      const e = new Date(ev.end_time).getTime();
      // Overlap formula: start1 < end2 && end1 > start2
      return tStart < e && tEnd > s;
    });
  };

  const hasAnyConflicts = events.some((ev) => checkConflict(ev));

  // Schedule event
  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startTime || !endTime) {
      setMessage({ text: "Please fill in all required fields.", type: "error" });
      return;
    }

    const startDt = new Date(startTime);
    const endDt = new Date(endTime);

    if (startDt >= endDt) {
      setMessage({ text: "End Time must be after Start Time.", type: "error" });
      return;
    }

    setIsScheduling(true);
    setMessage(null);

    try {
      await apiFetch<PlannerEvent>("/planner/events", {
        method: "POST",
        body: JSON.stringify({
          title,
          description: description || null,
          start_time: startDt.toISOString(),
          end_time: endDt.toISOString(),
          priority,
        }),
      });

      setTitle("");
      setDescription("");
      setStartTime("");
      setEndTime("");
      setPriority("medium");
      
      // Reload schedule
      await fetchEvents();
      setMessage({ text: "Event successfully scheduled!", type: "success" });
    } catch (err: any) {
      console.error("Failed to schedule event:", err);
      setMessage({ text: err.message || "Failed to schedule event.", type: "error" });
    } finally {
      setIsScheduling(false);
    }
  };

  // Trigger auto conflict resolution
  const handleAutoResolve = async () => {
    setIsResolving(true);
    setMessage(null);
    try {
      const data = await apiFetch<{ message: string }>("/planner/resolve", {
        method: "POST",
      });
      await fetchEvents();
      setMessage({ text: data.message, type: "success" });
    } catch (err: any) {
      console.error("Failed to resolve conflicts:", err);
      setMessage({ text: err.message || "Failed to resolve conflicts.", type: "error" });
    } finally {
      setIsResolving(false);
    }
  };

  // Delete event
  const handleDelete = async (eventId: string) => {
    setMessage(null);
    try {
      await apiFetch(`/planner/events/${eventId}`, {
        method: "DELETE",
      });
      setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
      setMessage({ text: "Event deleted successfully.", type: "success" });
    } catch (err: any) {
      console.error("Failed to delete event:", err);
      setMessage({ text: err.message || "Failed to delete event.", type: "error" });
    }
  };

  const priorityColors: Record<string, string> = {
    high: "bg-red-500/10 border-red-500/30 text-red-400",
    medium: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    low: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  };

  return (
    <main className="flex-1 px-8 py-10 max-w-6xl w-full mx-auto space-y-8">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/40 pb-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Schedule Planner
          </h2>
          <p className="text-zinc-500 text-xs mt-1">
            Organize events, meetings, and let the AI resolve overlaps automatically based on priority weights.
          </p>
        </div>

        {hasAnyConflicts && (
          <button
            onClick={handleAutoResolve}
            disabled={isResolving}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isResolving ? (
              <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
            ) : (
              "✨"
            )}
            Auto-Resolve Conflicts
          </button>
        )}
      </section>

      {/* Message Notifications */}
      {message && (
        <div
          className={`p-4 rounded-xl border text-xs leading-relaxed whitespace-pre-line ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : message.type === "warning"
              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Warning Banner for active conflicts */}
      {hasAnyConflicts && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3">
          <span>⚠️</span>
          <span>
            <strong>Scheduling Conflict Detected:</strong> Two or more events overlap. Click the **Auto-Resolve Conflicts** button to automatically shift low-priority tasks.
          </span>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Calendar Event Feed */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-300">Scheduled Events</h3>
          
          {isFetching ? (
            <div className="flex flex-col items-center justify-center p-20 border border-zinc-800/40 rounded-2xl bg-zinc-950/20">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              <p className="text-zinc-500 text-xs mt-3">Loading active schedule...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 border border-dashed border-zinc-800 rounded-2xl text-center">
              <span className="text-3xl">📅</span>
              <p className="text-zinc-400 text-sm mt-3 font-semibold">Your schedule is empty</p>
              <p className="text-zinc-500 text-xs mt-1">Use the panel on the right to schedule tasks or ask the AI.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((ev) => {
                const hasConflict = checkConflict(ev);
                return (
                  <div
                    key={ev.id}
                    className={`p-4 rounded-xl border bg-zinc-950/40 backdrop-blur-md flex items-start justify-between gap-4 transition-all hover:bg-zinc-900/40 ${
                      hasConflict ? "border-red-500/40 shadow-md shadow-red-500/5" : "border-zinc-800/80"
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${priorityColors[ev.priority] || priorityColors.medium}`}>
                          {ev.priority}
                        </span>
                        
                        {hasConflict && (
                          <span className="text-[10px] font-semibold bg-red-500/15 border border-red-500/30 text-red-400 px-2 py-0.5 rounded-full">
                            Overlap Conflict
                          </span>
                        )}
                        
                        <h4 className="font-semibold text-zinc-100 text-sm truncate">{ev.title}</h4>
                      </div>

                      {ev.description && (
                        <p className="text-xs text-zinc-400 line-clamp-2">{ev.description}</p>
                      )}

                      <p className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                        <span>🕒</span>
                        <span>
                          {new Date(ev.start_time).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}{" "}
                          to{" "}
                          {new Date(ev.end_time).toLocaleTimeString(undefined, {
                            timeStyle: "short",
                          })}
                        </span>
                      </p>
                    </div>

                    <button
                      onClick={() => handleDelete(ev.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800/40 rounded-lg transition-all"
                      title="Delete Event"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Create Event Form */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-300">Schedule Task</h3>
          
          <form onSubmit={handleSchedule} className="p-6 border border-zinc-800/80 rounded-2xl bg-zinc-950/40 backdrop-blur-md space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium">Event Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Weekly Standup"
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium">Notes / Details</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details or link to meeting..."
                rows={2}
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium">Priority Weight</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>

            {/* Start Time */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium">Start Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* End Time */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium">End Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isScheduling}
              className="w-full py-2.5 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isScheduling && (
                <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
              )}
              Add to Calendar
            </button>
          </form>
        </div>

      </div>
    </main>
  );
}
