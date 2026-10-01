# Meridian AI

**A personal AI operating system — one workspace instead of ten disconnected apps.**

---

## 🎬 Interactive Portfolio Demo Video & Engineering Brag Showcase

> **Recruiter & Engineering Interviewer Showcase (75-Second Walkthrough)**
>
> 📽️ **Interactive Showcase Video**: Open **[brag-output/showcase_video.html](brag-output/showcase_video.html)** in your browser to play the animated feature walkthrough!
>
> 🚀 **Engineering Brag Document**: Detailed technical breakdowns in **[MERIDIAN_BRAG_DOCUMENT.md](MERIDIAN_BRAG_DOCUMENT.md)**.
> 
> 📋 **Recruiter Demo Script**: 75s script & architectural QA in **[brag-output/RECRUITER_DEMO_SCRIPT.md](brag-output/RECRUITER_DEMO_SCRIPT.md)**.

---


## Platform Modules & Features (V1 - V5 Completed)

- 🔐 **V1: Auth & Knowledge Hub**: User registration and login utilizing native `bcrypt` cryptography and type-safe JWT OAuth2 tokens. Ingestion of PDFs, Word documents (`.docx`, `.doc`), plain text (`.txt`, `.md`), structured data (`.csv`, `.json`), and scanned image PDFs with PyTorch OCR fallback, vectorized locally into Qdrant.
- 💬 **V2: Persistent Memory & LangGraph RAG Agent**: Agent reasoning cycles built with LangGraph to invoke vector search tools, retrieve grounded document passages with citations, and write long-term user profile memories.
- 🃏 **V3: AI Study Hub**: Automatic compilation of flashcards with interactive 3D card flip animation, multiple-choice practice quizzes with inline explanations, and hierarchical mind map concept trees.
- 📅 **V4: AI Schedule Planner**: Event calendar management with priority weighting and an automated conflict resolution timeline-shifting engine.
- 📊 **V5: Learning Analytics, Retention Metrics & Anki Export**: Daily activity logging (`StudyLog`), a 5-Stage Memory Retention progress dashboard (Learning ➔ Mastered), automated retention mastery scoring math, and one-click Anki CSV deck export.
- 🎨 **Meridian DS Visual Identity**: A restrained, dark theme design system built around HSL color tokens (`#070B10` Deep Space, `#0D151E` Midnight, `#45D6C5` Meridian Teal, `#5B9CFF` Signal Blue, `#A27BFF` Intelligence Violet).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS, Meridian DS |
| Backend | FastAPI, Python 3.11, SQLAlchemy ORM, PostgreSQL, Redis |
| AI / Agents | LangGraph, Google Gemini 3.5 (via LiteLLM), Qdrant (vector DB) |
| Embeddings | Local PyTorch Sentence-Transformer (`all-MiniLM-L6-v2`) |
| Standards | RFC-4180 CSV (Anki Export), Spaced Repetition timedelta math |
| Infra | Docker, Docker Compose, GitHub Actions CI |

---

## Architectural Decisions

To understand the core design trade-offs made in this project (e.g. why we run embeddings locally on CPU, how we bypassed Gemini `thought_signature` validation errors, Leitner box math, and why we explicitly accumulate state lists in LangGraph), please refer to the detailed **[Architectural Decision Log (DECISIONS.md)](file:///d:/Projects/Meridian-AI/DECISIONS.md)**.

---

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- Python 3.11+
- A Google Gemini API key

### Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Tanmay-262/Meridian-AI.git
   cd Meridian-AI
   ```

2. **Configure environment credentials**:
   * Copy the template:
     ```bash
     cp backend/.env.example backend/.env
     ```
   * Open `backend/.env` and paste your Gemini API key:
     ```bash
     GEMINI_API_KEY=your_gemini_api_key_here
     ```

3. **Start the platform**:
   ```bash
   docker compose up -d --build
   ```

4. **Access the services**:
   - Next.js Frontend: `http://localhost:3000`
   - FastAPI Backend Swagger Docs: `http://localhost:8000/docs`
   - Qdrant Vector Console: `http://localhost:6333/dashboard`

---

## Project Structure

```
meridian/
├── .github/workflows/   # CI/CD pipelines
├── backend/
│   ├── app/
│   │   ├── api/        # FastAPI routers (auth, documents, RAG, chat, planner, learning)
│   │   ├── agent/      # LangGraph state machine & tool nodes
│   │   ├── rag/        # PyTorch embedding & recursive text splitter
│   │   ├── models/     # SQLAlchemy model schemas (User, Document, Flashcard, QuizQuestion, MindMap, StudyLog)
│   │   ├── database/   # Postgres sessions & Qdrant collections
│   │   └── core/       # Security, JWT tokens, and settings configs
│   └── tests/          # Pytest API & analytics test suites
├── frontend/           # Next.js App Router workspace (Meridian DS visual identity)
├── docker-compose.yml  # Multi-container orchestration config
├── DECISIONS.md        # Architectural Decision Log (ADL)
└── README.md           # Getting started & platform overview
```

---

## Roadmap

Meridian AI is designed to grow from a personal workspace into an all-in-one AI Operating System.

| Version | Focus | Status |
|---|---|---|
| **V1** | Auth, Knowledge Hub, multi-format ingestion (PDF/DOCX/TXT/MD/CSV/JSON), Qdrant vector DB | ✅ Completed |
| **V2** | Persistent Memory & LangGraph RAG Chat Agent with citations | ✅ Completed |
| **V3** | AI Study Hub — 3D flashcards, practice quizzes, mind map concept trees | ✅ Completed |
| **V4** | AI Schedule Planner — priority weighting & auto-conflict resolution timeline shifting | ✅ Completed |
| **V5** | Learning Analytics — 5-stage memory retention graph, study streaks & Anki CSV export | ✅ Completed |
| **V6** | Voice & Speech Interface — voice dictation & audio narrator text-to-speech | 📋 Planned |
| **V7** | Multi-Document Synthesis — cross-file comparative RAG Q&A | 📋 Planned |
| **V8** | Global Workspace Command Palette (`Ctrl + K`) & spotlight search | 📋 Planned |

---

## License

MIT — see [LICENSE](LICENSE).
