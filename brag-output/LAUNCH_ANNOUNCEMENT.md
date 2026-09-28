# 📢 Meridian Personal OS — Social Launch Copy Package

This document contains pre-formatted launch copy optimized for X/Twitter, LinkedIn, Product Hunt, and Hacker News.

---

## 🧵 1. X / Twitter Launch Thread (High-Engagement)

**Tweet 1 / Header**:
> I was tired of using 10+ disconnected apps every single day (Notion, ChatGPT, PDF readers, Google Docs, Todoist).
> 
> So I built **Meridian Personal OS** — a unified, local-first AI workspace that replaces them all.
> 
> 🧠 $0-cost PyTorch RAG
> 📅 AI Auto-Scheduling
> 💬 LangGraph Persistent Memory
> 
> 🧵 Here is how it works: [ATTACH DEMO VIDEO]

**Tweet 2 / Local RAG**:
> 1/ Most RAG tools send your files to external SaaS APIs and bill per token.
> 
> Meridian runs a local PyTorch `all-MiniLM-L6-v2` encoder on your CPU inside Docker.
> 
> Upload PDFs, CSVs, or scanned docs ➔ vectorized into Qdrant on-device. 100% private, $0 API bills. 🔒

**Tweet 3 / LangGraph & Memory**:
> 2/ Chatbots usually forget everything the moment you refresh.
> 
> Meridian uses **LangGraph cyclical state loops** + **PostgreSQL persistent memory**.
> 
> Gemini reads your goals, tech stack, and constraints, writing permanent profile facts that persist across threads. 💡

**Tweet 4 / AI Calendar & Planner**:
> 3/ Calendar conflict nightmares? 
> 
> Meridian’s AI Planner Agent detects overlapping tasks and auto-resolves conflicts with priority-based timeline shifting in one click. 🗓️⚡

**Tweet 5 / Learning Hub**:
> 4/ Turn any document into active recall tools:
> 
> - 3D interactive flashcards
> - 5-Box Leitner spaced repetition engine
> - Auto-generated concept mind maps
> - MCQ practice quizzes
> 
> Never forget what you read again. 📚

**Tweet 6 / CTA**:
> 5/ 100% Open Source. Dockerized multi-service setup (`docker compose up -d`).
> 
> Check out the repo, star it, or run it locally:
> 🔗 https://github.com/Tanmay-262/Meridian-AI
> 
> Would love your feedback! Let me know what you think! 👇

---

## 💼 2. LinkedIn Launch Post

**Title**: *Introducing Meridian Personal OS: Why I built a unified, local-first AI workspace to replace disconnected productivity tools.*

**Body**:
> Modern knowledge workers spend hours context-switching across a maze of disconnected apps — Notion for notes, ChatGPT for answers, PDF readers for research, and Todoist for tasks. Context gets lost, and AI assistants reset on every turn.
> 
> To solve this app fragmentation crisis, I built **Meridian Personal OS**.
> 
> Key Technical & Product Highlights:
> 🔹 **Zero-Cost Local RAG**: Integrated PyTorch CPU embeddings (`all-MiniLM-L6-v2`) and Qdrant vector search. No third-party document processing fees, 100% on-device privacy.
> 🔹 **LangGraph State Orchestration**: Persistent user memory backed by PostgreSQL, allowing AI agents to learn preferences and invoke tools across threads.
> 🔹 **Proactive AI Scheduling**: Deterministic conflict resolution loops that automatically reschedule overlapping calendar priorities.
> 🔹 **Active Recall Learning Hub**: 3D flashcards with Leitner box spaced repetition and automated mind mapping.
> 🔹 **Bespoke Design System**: Engineered 'Meridian DS', a high-contrast Deep Space dark theme tailored for low visual strain.
> 
> Built with FastAPI, Next.js (App Router), LangGraph, PostgreSQL, Qdrant, and Docker.
> 
> 📦 Fully open-source on GitHub: https://github.com/Tanmay-262/Meridian-AI
> 
> #ArtificialIntelligence #FullStack #Python #NextJS #OpenSource #SoftwareEngineering #LangGraph #MachineLearning

---

## 🚀 3. Product Hunt Tagline & Description

* **Tagline**: *One unified, local-first AI operating system to replace 10 disconnected apps.*
* **Short Description**: Meridian Personal OS combines document RAG, persistent AI memory, automated calendar conflict resolution, and 3D flashcard spaced repetition into a single dark-mode command center. Powered by FastAPI, Next.js, and LangGraph.
* **Maker Comment**:
  > Hey PH community! 👋
  > 
  > Like many of you, I found myself juggling 10+ tabs daily just to get work done. I wanted an AI assistant that actually remembered my context, kept my documents private, and helped me manage my time without charging monthly API subscription fees for basic vector embeddings.
  > 
  > Meridian Personal OS is built from the ground up to be local-first, privacy-focused, and proactive. Run it with a single `docker compose up` command.
  > 
  > Excited to hear your thoughts and suggestions!

---

## 🟧 4. Hacker News (Show HN)

**Title**: *Show HN: Meridian AI – Local-first personal OS with PyTorch RAG, LangGraph memory, and AI auto-scheduling*

**Body**:
> Hi HN! I built Meridian Personal OS to unify disconnected apps into one offline-friendly command center.
> 
> Architecturally, I made a few key trade-offs:
> 1. **CPU PyTorch Embeddings**: Instead of sending files to external SaaS endpoints, the backend runs a local PyTorch `all-MiniLM-L6-v2` model inside Docker with manual token attention masking and L2 normalization, feeding into Qdrant.
> 2. **LangGraph Explicit List Merging**: Solved message deletion bugs in LangGraph by explicitly concatenating state history in graph nodes, ensuring Gemini receives complete conversation trails during tool-calling cycles.
> 3. **Stable API Quota Bypassing**: Routed calls via stable `v1` schemas targeting `gemini-3.5-flash-lite` to avoid experimental `thought_signature` validation errors and daily rate limit blocks.
> 
> Source code & documentation: https://github.com/Tanmay-262/Meridian-AI
> 
> Feedback and questions welcome!

---
*Generated by Meridian AI launch toolkit*
