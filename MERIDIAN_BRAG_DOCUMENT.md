# 🚀 Meridian Personal OS — Engineering Brag Document

> **"One Unified AI Operating System to Replace Ten Disconnected Apps."**
> 
> *A high-impact portfolio showcase detailing the engineering breakthroughs, zero-cost AI optimizations, multi-agent architectures, and visual design systems built into Meridian Personal OS.*

---

## 🌟 Executive Overview

**Meridian Personal OS** solves the modern *App Fragmentation Crisis* by replacing disconnected tools (Notion, ChatGPT, PDF readers, calendar tools, flashcard apps) with a **unified, local-first, AI-powered command center**.

Built with **FastAPI, Next.js, LangGraph, PostgreSQL, Qdrant, PyTorch, and Google Gemini**, Meridian integrates document RAG, persistent user memory, intelligent calendar conflict resolution, and active recall learning into a single cohesive ecosystem.

---

## 🏆 Key Engineering Accomplishments

### 1. 🧠 Cyclical AI Agent Orchestration (LangGraph + PostgreSQL Memory)
* **Problem**: Traditional linear LLM chains (e.g. standard RAG wrappers) treat every interaction as an isolated session without historical memory context or multi-step reasoning capabilities.
* **Breakthrough**: Engineered a custom cyclical state machine using **LangGraph**:
  * **Persistent Memory**: Gemini reads and writes user profile facts (hobbies, tech stack, constraints) into a shared PostgreSQL database across independent chat threads.
  * **Explicit List Accumulation**: Resolved implicit reducer merge bugs in LangGraph by explicitly maintaining and concatenating message lists inside graph nodes, preventing message state wiping during tool call evaluation loops.
  * **Tool Execution**: Seamlessly triggers vector RAG lookup tools, calendar querying, and memory extraction within real-time reasoning loops.

### 2. ⚡ Zero-Cost Local Embeddings Pipeline (PyTorch on CPU)
* **Problem**: Relying on commercial embeddings APIs (e.g., OpenAI `text-embedding-3`) incurs recurring API costs and leaks user documents to 3rd-party SaaS providers.
* **Breakthrough**: Built a self-contained local PyTorch embedding pipeline inside the Docker backend container:
  * Uses `all-MiniLM-L6-v2` sentence transformers to encode text locally on CPU.
  * Implemented manual token attention masking, **mean pooling** across token embeddings, and **L2 normalization** for high-precision 384-dimensional cosine similarity vectors in **Qdrant**.
  * **Impact**: **$0 API costs**, 100% document privacy, and complete offline RAG capability.

### 3. 🎯 Google Gemini API Quota Bypassing & Schema Optimization
* **Problem**: Google Gemini’s experimental `v1beta` endpoint introduced strict "Thinking" validation errors (`thought_signature` missing in tool-calling cycles) and low daily request quotas on `gemini-3.5-flash`.
* **Breakthrough**:
  * Forced LiteLLM proxy to target the **stable `v1` endpoint**, bypassing requirement checks for thought signatures during multi-turn tool loops.
  * Dynamically routed agent queries to `gemini-3.5-flash-lite`, tapping into a separate quota pool to prevent daily rate-limit shutdowns.

### 4. 📅 Auto-Resolving AI Planner Agent (Iterative Conflict Shifting)
* **Problem**: Overlapping events and meeting conflicts require manual dragging and rescheduling across calendar grids.
* **Breakthrough**: Developed a deterministic, iterative schedule conflict resolution algorithm (`auto_resolve_schedule_conflicts`) in Python:
  * Dynamically shifts lower-priority conflicting events to start immediately at the end time of higher-priority events.
  * Recursively evaluates shifted timelines until a completely conflict-free schedule is guaranteed (guarded by a `max_iterations = 10` execution ceiling).

### 5. 📚 V3 AI Learning Hub & Spaced Repetition Engine
* **Problem**: Passive reading leads to rapid information decay; traditional flashcard apps require tedious manual card creation.
* **Breakthrough**:
  * **Automated Knowledge Extraction**: Automatically synthesizes 3D interactive flashcards, MCQ quizzes, and visual mind maps directly from uploaded workspace documents.
  * **Native Leitner Box Spaced Repetition**: Implemented a 5-box Leitner memory progression engine using native Python `timedelta` mappings (1 min, 10 min, 1 hr, 1 day, 5 days) to maximize active recall retention.
  * **3D Flip Dynamics**: Handcrafted custom CSS 3D card flipping with rigid display state management (`hidden`/`flex`) to eliminate backface mirror bleed bugs.

### 6. 📁 Multi-Format Knowledge Hub & Multi-Modal Processing
* **Problem**: Workspace documents come in diverse formats, including scanned non-selectable PDFs.
* **Breakthrough**:
  * Added unified ingestion for **PDF, TXT, MD, CSV, and JSON** files.
  * Engineered a fallback parser utilizing OCR scanning logic for image-based PDFs, ensuring robust vectorization regardless of document source.

### 7. 🎨 Meridian DS — Deep Space Visual Identity System
* **Problem**: AI applications often suffer from generic "purple gradient" template syndrome or high-fatigue light themes.
* **Breakthrough**: Created **Meridian DS**, a bespoke dark design system built on HSL design tokens:
  * **Deep Space Backdrop** (`#070B10`) & **Midnight Panels** (`#0D151E`) for low eye strain.
  * **Restrained Semantic Tokens**: **Meridian Teal** (`#45D6C5`) for primary CTA, **Signal Blue** (`#5B9CFF`) for system stats, **Intelligence Violet** (`#A27BFF`) for AI reasoning loops, and **Gold Signal** (`#D5A65B`) for priority alerts.
  * **Glassmorphism & Micro-Animations**: Sleek backdrop filters, subtle border highlights (`#1D2A3D`), and fluid interaction states.

### 8. 🛡️ Production-Grade Security & Resilient CI/CD Testing
* **Problem**: Outdated auth libraries (`passlib`) crash under modern Python releases, and rigid settings break automated CI runners.
* **Breakthrough**:
  * Replaced unmaintained `passlib` with native **`bcrypt`** hashing and JWT access tokens.
  * Configured Docker Compose with optional environment loading (`required: false`) for seamless GitHub Actions validation.
  * Built an isolated Pytest suite with FastAPI `dependency_overrides` (OAuth2 bypass) and transactional SQLAlchemy mock database fixtures.

---

## 📊 Technical Stack Matrix

| Architecture Layer | Key Technologies & Frameworks |
| :--- | :--- |
| **Frontend UI** | Next.js (App Router), TypeScript, Tailwind CSS, Lucide Icons, Custom CSS 3D Transforms |
| **Backend Core** | FastAPI (Python 3.11+), Pydantic v2, SQLAlchemy ORM, Alembic |
| **AI & Orchestration** | LangGraph, Google Gemini (via LiteLLM Proxy), PyTorch (`all-MiniLM-L6-v2`) |
| **Databases** | PostgreSQL (Relational Memory & Schedule Data), Qdrant (Vector Store), Redis (Cache) |
| **Security** | Native `bcrypt`, OAuth2 Bearer Tokens, JWT Claims Validation |
| **DevOps & Infra** | Docker, Docker Compose, Pytest, GitHub Actions CI/CD |

---

## 📈 Feature Matrix & Shipped Progress

| Feature Module | Capabilities Shipped | Status |
| :--- | :--- | :---: |
| **V0.1 Core Foundation** | Custom `bcrypt` JWT Auth, Multi-Format Ingestion (PDF/TXT/MD/CSV/JSON), Qdrant Vector Store, Local PyTorch Embeddings | ✅ **Shipped** |
| **LangGraph AI Chat** | Multi-turn reasoning loops, Postgres user memory extraction, grounded document RAG | ✅ **Shipped** |
| **V2 Planner Agent** | Weekly interactive timeline, priority task tagging, AI auto-reschedule conflict resolver | ✅ **Shipped** |
| **V3 Learning Hub** | Flashcard 3D flip generator, MCQ quizzes, 5-Box Leitner spaced repetition, concept mind maps | ✅ **Shipped** |
| **Meridian DS Theme** | Bespoke Deep Space visual identity system, HSL color tokens, glassmorphism | ✅ **Shipped** |
| **V4 Career Agent** | Resume parser, ATS scoring engine, skill-gap analysis | 📋 *Planned* |
| **V5 Multi-Agent OS** | Shared cross-agent memory, autonomous subagent delegation | 📋 *Planned* |

---

## 🏆 Summary: Why Meridian OS Stands Out

1. **100% Privacy & Zero API Cost for Embeddings**: Local PyTorch models keep document vectorization on-device.
2. **Proactive Intelligence**: The AI doesn't just respond; it manages schedules, extracts profile memory, and generates active recall flashcards.
3. **Resilient Architecture**: Bypasses rate limits, recovers gracefully from OCR failures, and runs cleanly under strict CI test suites.
4. **World-Class Aesthetic**: Premium dark-mode design that looks and feels like a modern professional OS.

---
*Created by [Tanmay-262](https://github.com/Tanmay-262) — Meridian AI Engineering Team*
