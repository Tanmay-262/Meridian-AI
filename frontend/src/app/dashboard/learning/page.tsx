"use client";

import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface Tag {
  id: number;
  name: string;
}

interface Document {
  id: number;
  filename: string;
  status: string;
  tags: Tag[];
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  box: number;
  next_review: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_option: string;
  explanation: string;
}

interface MindMap {
  id: string;
  structure: {
    title: string;
    children?: { title: string; children?: any[] }[];
  };
}

export default function LearningPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [mindMap, setMindMap] = useState<MindMap | null>(null);

  const [activeTab, setActiveTab] = useState<"flashcards" | "quizzes" | "mindmap">("flashcards");
  const [isFetchingDocs, setIsFetchingDocs] = useState(true);
  const [isFetchingStudy, setIsFetchingStudy] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReviewingId, setIsReviewingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Flashcards state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quizzes state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({}); // maps question ID -> user selected option

  // Fetch documents
  useEffect(() => {
    async function loadDocs() {
      try {
        const docs = await apiFetch<Document[]>("/documents");
        const readyDocs = docs.filter((d) => d.status === "completed");
        setDocuments(readyDocs);
        if (readyDocs.length > 0) {
          setSelectedDocId(readyDocs[0].id);
        }
      } catch (err: any) {
        console.error("Failed to load documents:", err);
      } finally {
        setIsFetchingDocs(false);
      }
    }
    loadDocs();
  }, []);

  // Fetch study assets for selected document
  const fetchStudyAssets = async (docId: number) => {
    setIsFetchingStudy(true);
    setMessage(null);
    setFlashcards([]);
    setQuizzes([]);
    setMindMap(null);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setQuizAnswers({});

    try {
      // We check if mindmap outline exists first
      const mapData = await apiFetch<MindMap>(`/learning/mindmap/${docId}`);
      setMindMap(mapData);

      // Fetch flashcards & quizzes
      const cardsData = await apiFetch<Flashcard[]>(`/learning/flashcards?document_id=${docId}`);
      setFlashcards(cardsData);

      const quizData = await apiFetch<QuizQuestion[]>(`/learning/quizzes?document_id=${docId}`);
      setQuizzes(quizData);
    } catch (err: any) {
      // 404 is normal if study materials have not been generated yet
      if (err.status !== 404) {
        console.error("Failed to load study assets:", err);
        setMessage({ text: "Failed to load study assets.", type: "error" });
      }
    } finally {
      setIsFetchingStudy(false);
    }
  };

  useEffect(() => {
    if (selectedDocId !== null) {
      fetchStudyAssets(selectedDocId);
    }
  }, [selectedDocId]);

  // Generate study assets
  const handleGenerate = async () => {
    if (selectedDocId === null) return;
    setIsGenerating(true);
    setMessage(null);
    try {
      await apiFetch(`/learning/generate/${selectedDocId}`, { method: "POST" });
      await fetchStudyAssets(selectedDocId);
      setMessage({ text: "Study materials generated successfully!", type: "success" });
    } catch (err: any) {
      console.error("Failed to generate study materials:", err);
      setMessage({ text: err.message || "Failed to generate study materials.", type: "error" });
    } finally {
      setIsGenerating(false);
    }
  };

  // Review flashcard (Leitner repetition adjustment)
  const handleCardReview = async (cardId: string, correct: boolean) => {
    setIsReviewingId(cardId);
    try {
      const updatedCard = await apiFetch<Flashcard>(`/learning/flashcards/review/${cardId}`, {
        method: "POST",
        body: JSON.stringify({ correct }),
      });
      
      // Update local flashcard box/scheduling values
      setFlashcards((prev) =>
        prev.map((c) => (c.id === cardId ? updatedCard : c))
      );
      
      setIsFlipped(false);
      // Advance to next card automatically after a brief delay
      setTimeout(() => {
        if (currentCardIndex < flashcards.length - 1) {
          setCurrentCardIndex((i) => i + 1);
        }
      }, 300);
    } catch (err: any) {
      console.error("Failed to review card:", err);
    } finally {
      setIsReviewingId(null);
    }
  };

  // Render Mind Map Recursive Node List
  const renderMindMapNode = (node: any, depth = 0) => {
    if (!node) return null;
    return (
      <div key={node.title} style={{ paddingLeft: `${depth * 16}px` }} className="space-y-1">
        <div className="flex items-center gap-2 py-1">
          <span className="text-[10px] text-indigo-400">❖</span>
          <span className={`text-xs ${depth === 0 ? "font-bold text-zinc-100" : "text-zinc-300"}`}>
            {node.title}
          </span>
        </div>
        {node.children && node.children.map((child: any) => renderMindMapNode(child, depth + 1))}
      </div>
    );
  };

  const optionLabels = ["A", "B", "C", "D"];

  return (
    <main className="flex-1 px-8 py-10 max-w-5xl w-full mx-auto space-y-8">
      {/* Header Panel */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/40 pb-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            AI Study Hub
          </h2>
          <p className="text-zinc-500 text-xs mt-1">
            Analyze reading materials to automatically compile flashcards, multiple-choice quizzes, and mind maps.
          </p>
        </div>

        {/* Document Selector */}
        {!isFetchingDocs && documents.length > 0 && (
          <select
            value={selectedDocId || ""}
            onChange={(e) => setSelectedDocId(Number(e.target.value))}
            className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 max-w-xs truncate"
          >
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.filename}
              </option>
            ))}
          </select>
        )}
      </section>

      {/* Message Alerts */}
      {message && (
        <div
          className={`p-4 rounded-xl border text-xs ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {isFetchingDocs || isFetchingStudy ? (
        <div className="flex flex-col items-center justify-center p-32 border border-zinc-800/40 rounded-2xl bg-zinc-950/20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-zinc-500 text-xs mt-3">Loading study materials...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-24 border border-dashed border-zinc-800 rounded-2xl text-center">
          <span className="text-3xl">📁</span>
          <p className="text-zinc-400 text-sm mt-3 font-semibold">No ready documents found</p>
          <p className="text-zinc-500 text-xs mt-1">Go upload a document in the Knowledge Hub first!</p>
        </div>
      ) : !mindMap ? (
        /* Empty State: Prompt Generation */
        <div className="flex flex-col items-center justify-center p-24 border border-zinc-800/80 rounded-2xl bg-zinc-950/40 backdrop-blur-md text-center max-w-xl mx-auto space-y-4">
          <span className="text-4xl">🧠</span>
          <h3 className="font-semibold text-zinc-200">Generate Study Pack</h3>
          <p className="text-zinc-500 text-xs leading-relaxed">
            There are no study assets generated for this document yet. Click the button below to parse document chunks and let the AI compile flashcards, mind maps, and quiz questions.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-6 py-2.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isGenerating && (
              <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
            )}
            Compile Study Materials
          </button>
        </div>
      ) : (
        /* Study assets content tabs view */
        <div className="space-y-6">
          {/* Tabs Menu */}
          <div className="flex border-b border-zinc-800/40 gap-2">
            {[
              { id: "flashcards", name: "Flashcards", icon: "🃏" },
              { id: "quizzes", name: "Practice Quizzes", icon: "📝" },
              { id: "mindmap", name: "Mind Map Outline", icon: "🌿" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

          {/* Flashcards Tab Panel */}
          {activeTab === "flashcards" && flashcards.length > 0 && (
            <div className="space-y-6 max-w-md mx-auto">
              <div className="flex items-center justify-between text-xs text-zinc-500 px-2">
                <span>Card {currentCardIndex + 1} of {flashcards.length}</span>
                <span>Leitner Box: {flashcards[currentCardIndex].box}</span>
              </div>

              {/* 3D Flashcard container */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="h-64 w-full cursor-pointer relative group perspective"
              >
                <div
                  className={`h-full w-full transition-all duration-500 preserve-3d relative ${
                    isFlipped ? "rotate-y-180" : ""
                  }`}
                >
                  {/* Front Side */}
                  <div className="absolute inset-0 backface-hidden rounded-2xl border bg-gradient-to-tr from-indigo-950/30 to-purple-950/20 border-indigo-500/20 p-6 flex flex-col items-center justify-center text-center space-y-4">
                    <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Question</span>
                    <p className="text-zinc-200 font-semibold text-sm leading-relaxed">
                      {flashcards[currentCardIndex].front}
                    </p>
                    <span className="text-[10px] text-zinc-600 mt-4 group-hover:text-zinc-400 transition-colors">
                      Click to reveal answer
                    </span>
                  </div>

                  {/* Back Side */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl border bg-zinc-950 border-zinc-800/80 p-6 flex flex-col items-center justify-center text-center space-y-4">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Answer</span>
                    <p className="text-zinc-300 text-xs leading-relaxed max-h-[160px] overflow-y-auto">
                      {flashcards[currentCardIndex].back}
                    </p>
                  </div>
                </div>
              </div>

              {/* Leitner Box Spaced Repetition Review actions */}
              {isFlipped && (
                <div className="flex gap-4">
                  <button
                    onClick={() => handleCardReview(flashcards[currentCardIndex].id, false)}
                    disabled={isReviewingId !== null}
                    className="flex-1 py-2 text-xs font-semibold rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                  >
                    ❌ Hard (Box 1)
                  </button>
                  <button
                    onClick={() => handleCardReview(flashcards[currentCardIndex].id, true)}
                    disabled={isReviewingId !== null}
                    className="flex-1 py-2 text-xs font-semibold rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                  >
                    ✓ Got It! (+1 Box)
                  </button>
                </div>
              )}

              {/* Slider Controls */}
              <div className="flex justify-between items-center gap-4 pt-2">
                <button
                  disabled={currentCardIndex === 0}
                  onClick={() => {
                    setIsFlipped(false);
                    setCurrentCardIndex((i) => i - 1);
                  }}
                  className="px-4 py-2 rounded-xl border border-zinc-800 text-xs hover:bg-zinc-900 disabled:opacity-30"
                >
                  ← Prev
                </button>
                <button
                  disabled={currentCardIndex === flashcards.length - 1}
                  onClick={() => {
                    setIsFlipped(false);
                    setCurrentCardIndex((i) => i + 1);
                  }}
                  className="px-4 py-2 rounded-xl border border-zinc-800 text-xs hover:bg-zinc-900 disabled:opacity-30"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Quizzes Tab Panel */}
          {activeTab === "quizzes" && quizzes.length > 0 && (
            <div className="space-y-8">
              {quizzes.map((q, idx) => {
                const selectedOption = quizAnswers[q.id];
                const isSelected = selectedOption !== undefined;
                const isCorrect = selectedOption === q.correct_option;

                return (
                  <div key={q.id} className="p-6 border border-zinc-800/80 rounded-2xl bg-zinc-950/40 backdrop-blur-md space-y-4">
                    <h4 className="font-semibold text-sm text-zinc-200">
                      {idx + 1}. {q.question}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt, oIdx) => {
                        const optionChar = optionLabels[oIdx];
                        const isThisSelected = selectedOption === optionChar;
                        const isThisCorrect = q.correct_option === optionChar;

                        let btnStyle = "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 text-zinc-300";
                        if (isSelected) {
                          if (isThisCorrect) {
                            btnStyle = "border-emerald-500/40 bg-emerald-500/10 text-emerald-400";
                          } else if (isThisSelected) {
                            btnStyle = "border-red-500/40 bg-red-500/10 text-red-400";
                          } else {
                            btnStyle = "border-zinc-800/30 opacity-50 text-zinc-500";
                          }
                        }

                        return (
                          <button
                            key={opt}
                            disabled={isSelected}
                            onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: optionChar }))}
                            className={`px-4 py-2.5 rounded-xl border text-left text-xs font-medium transition-all duration-200 flex items-center gap-2 ${btnStyle}`}
                          >
                            <span className="h-5 w-5 rounded-lg border border-zinc-700/60 bg-zinc-950 flex items-center justify-center text-[10px] font-bold">
                              {optionChar}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {isSelected && (
                      <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1.5 ${
                        isCorrect ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400" : "bg-red-500/5 border-red-500/10 text-zinc-400"
                      }`}>
                        <p className="font-bold flex items-center gap-1.5">
                          {isCorrect ? "✓ Correct!" : "❌ Incorrect"}
                          <span className="text-[10px] text-zinc-500">Correct Option: {q.correct_option}</span>
                        </p>
                        <p className="text-zinc-400 text-[11px]">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* MindMap Tab Panel */}
          {activeTab === "mindmap" && mindMap && (
            <div className="p-6 border border-zinc-800/80 rounded-2xl bg-zinc-950/40 backdrop-blur-md space-y-4">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <span>🌳</span> Conceptual Mind Map Tree
              </h3>
              <p className="text-[10px] text-zinc-500">
                Explore the conceptual outline mapped from your document text topics.
              </p>
              <div className="border border-zinc-800/40 rounded-xl p-4 bg-zinc-950/30 overflow-x-auto max-h-[400px] space-y-2">
                {renderMindMapNode(mindMap.structure)}
              </div>
            </div>
          )}

        </div>
      )}
    </main>
  );
}
