"use client";

import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface Tag {
  id: number;
  name: string;
}

interface Document {
  id: number;
  user_id: number;
  filename: string;
  file_size: number;
  status: string;
  created_at: string;
  updated_at: string;
  tags: Tag[];
}

export default function KnowledgePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Format bytes to KB/MB
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Fetch documents
  const fetchDocuments = async () => {
    try {
      const data = await apiFetch<Document[]>("/documents");
      setDocuments(data);
    } catch (err: any) {
      console.error("Failed to load documents:", err);
      setMessage({ text: err.message || "Failed to load documents.", type: "error" });
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Poll for document status if any are in "processing" state
  useEffect(() => {
    const hasProcessing = documents.some((doc) => doc.status === "processing");
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetchDocuments();
    }, 3000); // refresh list every 3s to poll background task

    return () => clearInterval(interval);
  }, [documents]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage({ text: "Please select a file to upload first.", type: "error" });
      return;
    }

    setMessage(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);
    if (tagsInput) {
      formData.append("tags_raw", tagsInput);
    }

    try {
      const newDoc = await apiFetch<Document>("/documents/upload", {
        method: "POST",
        body: formData,
      });

      setMessage({ text: `"${newDoc.filename}" uploaded successfully and is parsing in the background.`, type: "success" });
      setSelectedFile(null);
      setTagsInput("");
      
      // Instantly append to state, poll will update status
      setDocuments((prev) => [newDoc, ...prev]);
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to upload document.", type: "error" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (documentId: number) => {
    if (!confirm("Are you sure you want to delete this document? This will remove the file from storage and clear its database metadata.")) {
      return;
    }

    setDeletingId(documentId);
    setMessage(null);

    try {
      await apiFetch(`/documents/${documentId}`, {
        method: "DELETE",
      });

      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      setMessage({ text: "Document successfully deleted.", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to delete document.", type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  // Filter documents by name or tags
  const filteredDocuments = documents.filter((doc) => {
    const matchQuery = doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTags = doc.tags.some((tag) =>
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchQuery || matchTags;
  });

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 grid gap-8 animate-fadeIn">
      {/* Title */}
      <section className="flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#f0f5fa]">
          Knowledge Hub
        </h1>
        <p className="text-[#71818c] text-xs sm:text-sm max-w-xl">
          Central archives ingestion. Upload PDF and DOCX files to store metadata, index tags, and prepare text for RAG lookup.
        </p>
      </section>

      {/* Upload Zone & Status Alert */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Upload Form (Left Column, span 1) */}
        <div className="lg:col-span-1 rounded-2xl border border-[#1d2a3d] bg-[#0d151e] p-6 h-fit">
          <h3 className="font-bold text-base text-[#f0f5fa] mb-4">Ingest Document</h3>
          
          {message && (
            <div
              className={`mb-4 rounded-xl border p-4 text-xs ${
                message.type === "success"
                  ? "bg-[#45d6c5]/10 border-[#45d6c5]/30 text-[#45d6c5]"
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            {/* File selection drop area */}
            <div className="border-2 border-dashed border-[#1d2a3d] hover:border-[#45d6c5]/60 rounded-xl p-6 text-center cursor-pointer transition-colors duration-200 relative bg-[#111d2a]/40">
              <input
                id="file-upload-input"
                name="file"
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <span className="text-2xl mb-2 block">📥</span>
              <p className="text-xs font-semibold text-[#f0f5fa]">
                {selectedFile ? selectedFile.name : "Drag & drop PDF / DOCX here"}
              </p>
              <p className="text-[10px] text-[#71818c] mt-1 font-mono">
                {selectedFile ? formatBytes(selectedFile.size) : "Max size 10MB"}
              </p>
            </div>

            {/* Custom tags entry */}
            <div>
              <label htmlFor="tags-input" className="block text-xs font-semibold text-[#71818c] uppercase tracking-wider mb-2 font-mono">
                Document Tags
              </label>
              <input
                id="tags-input"
                name="tags_raw"
                type="text"
                placeholder="e.g. machine-learning, notes, math"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="block w-full rounded-xl border border-[#1d2a3d] bg-[#111d2a] px-4 py-2.5 text-xs text-[#f0f5fa] placeholder-[#71818c] outline-none transition-colors focus:border-[#45d6c5]"
              />
            </div>

            <button
              id="upload-submit-btn"
              name="upload_submit"
              type="submit"
              disabled={isUploading || !selectedFile}
              className="w-full justify-center rounded-xl bg-gradient-to-r from-[#45d6c5] to-[#5b9cff] px-4 py-2.5 text-xs font-bold text-[#070b10] shadow-md transition-all duration-300 hover:opacity-90 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isUploading ? "Uploading..." : "Upload Document"}
            </button>
          </form>
        </div>

        {/* Catalog Index (Right Column, span 2) */}
        <div className="lg:col-span-2 rounded-2xl border border-[#1d2a3d] bg-[#0d151e] p-6 flex flex-col min-h-[400px]">
          {/* Search Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71818c] text-xs">🔍</span>
              <input
                id="search-query-input"
                name="search_query"
                type="text"
                placeholder="Search index by filename or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full rounded-xl border border-[#1d2a3d] bg-[#111d2a] pl-10 pr-4 py-2 text-xs text-[#f0f5fa] placeholder-[#71818c] outline-none transition-colors focus:border-[#45d6c5]"
              />
            </div>
          </div>

          {/* Document list render */}
          {isFetching ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#45d6c5] border-t-transparent" />
              <p className="text-[#71818c] text-xs font-mono">Syncing index catalog...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#111d2a]/30 rounded-xl border border-[#1d2a3d] border-dashed">
              <span className="text-3xl mb-3">📁</span>
              <h4 className="font-bold text-sm mb-1 text-[#f0f5fa]">No documents found</h4>
              <p className="text-[#71818c] text-xs max-w-xs">
                {searchQuery ? "No records match your query." : "Upload a PDF or Word document to build your Knowledge catalog."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#1d2a3d] text-left">
                <thead>
                  <tr className="text-[10px] font-mono font-bold text-[#71818c] uppercase tracking-wider">
                    <th className="pb-3 pr-4">File Name</th>
                    <th className="pb-3 px-4">Size</th>
                    <th className="pb-3 px-4">Tags</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1d2a3d]/60 text-xs text-[#f0f5fa]">
                  {filteredDocuments.map((doc) => {
                    const isWord = doc.filename.endsWith(".docx") || doc.filename.endsWith(".doc");
                    return (
                      <tr key={doc.id} className="hover:bg-[#111d2a]/60 transition-colors duration-150">
                        {/* Filename & Icon */}
                        <td className="py-4 pr-4 font-semibold text-[#f0f5fa] flex items-center gap-2.5 max-w-[200px] sm:max-w-[300px]">
                          <span className="text-lg" title={isWord ? "Word Document" : "PDF Document"}>
                            {isWord ? "🟦" : "🟥"}
                          </span>
                          <span className="truncate" title={doc.filename}>{doc.filename}</span>
                        </td>
                        {/* Size */}
                        <td className="py-4 px-4 text-[#71818c] font-mono whitespace-nowrap">
                          {formatBytes(doc.file_size)}
                        </td>
                        {/* Tags list */}
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1">
                            {doc.tags.length === 0 ? (
                              <span className="text-[10px] text-[#71818c] font-mono">—</span>
                            ) : (
                              doc.tags.map((tag) => (
                                <span
                                  key={tag.id}
                                  className="inline-flex items-center rounded-md bg-[#111d2a] px-2 py-0.5 text-[10px] font-mono text-[#5b9cff] border border-[#5b9cff]/20"
                                >
                                  {tag.name}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        {/* Parser status */}
                        <td className="py-4 px-4 whitespace-nowrap font-mono">
                          {doc.status === "processing" && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#d5a65b]">
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#d5a65b]" />
                              Parsing
                            </span>
                          )}
                          {doc.status === "completed" && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#45d6c5]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#45d6c5]" />
                              Ready
                            </span>
                          )}
                          {doc.status === "failed" && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-rose-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                              Failed
                            </span>
                          )}
                        </td>
                        {/* Action buttons */}
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleDelete(doc.id)}
                            disabled={deletingId === doc.id}
                            className="p-1 rounded-md text-[#71818c] hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                            title="Delete document"
                          >
                            {deletingId === doc.id ? (
                              <span className="inline-block animate-spin h-3.5 w-3.5 border border-[#71818c] border-t-transparent rounded-full" />
                            ) : (
                              "🗑️"
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
