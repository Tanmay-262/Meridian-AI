# Meridian AI

**A personal AI operating system — one workspace instead of ten disconnected apps.**

> 🚧 **Status:** Actively in development (V0.1). Foundation, AI chat with memory, and RAG are being built now. See [Roadmap](#roadmap) for what's shipped vs. planned.

---

## The Problem

Students and professionals rely on a dozen disconnected tools — Notion, Google Docs, ChatGPT, Gmail, GitHub, PDF readers, todo apps — none of which share context. Information gets copy-pasted between apps, tasks get lost, and every AI assistant starts from zero.

Meridian is a unified workspace where specialized AI agents collaborate over **shared, persistent context** to help users manage knowledge, learning, and work — instead of behaving like isolated chatbots.

## What's Built (V0.1)

- 🔐 Authentication, user profiles, dashboard
- 📄 Knowledge Hub — upload PDFs/DOCX, tag, organize, search
- 💬 AI Chat with persistent long-term memory
- 🔍 RAG — ask questions grounded in your own uploaded documents, with citations
- 🐳 Dockerized, deployed, CI/CD via GitHub Actions

V0.1 is intentionally scoped: one working vertical slice (foundation → knowledge → chat → RAG), built and deployed end-to-end, rather than a wide set of half-finished features. See [Roadmap](#roadmap) for what comes next.

## Demo

> 🎬 *Live demo link and walkthrough GIF go here once deployed.*

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, Python, SQLAlchemy, PostgreSQL, Redis |
| AI / Agents | LangGraph, OpenAI / Gemini, Qdrant (vector DB), LiteLLM |
| Infra | Docker, Docker Compose, GitHub Actions, Vercel, Railway |
| Observability | Langfuse, Sentry |

## Architecture

```
                    Frontend (Next.js)
                          │
                     FastAPI Backend
                          │
              ┌───────────────────────┐
              │  AI Orchestration     │
              │  (LangGraph)          │
              └───────────────────────┘
                          │
              Chat Agent  │  RAG Pipeline
                          │
                 Qdrant (vectors)
                 PostgreSQL (app data)
                 Redis (cache/sessions)
                          │
                 OpenAI / Gemini API
```

Future phases (Planner, Learning, Career, and Document agents) plug into this same orchestration layer — see [Roadmap](#roadmap).

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- Python 3.11+
- An OpenAI or Gemini API key

### Setup

```bash
# Clone the repo
git clone https://github.com/<your-username>/meridian.git
cd meridian

# Copy environment templates and fill in your keys
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Start everything (Postgres, Redis, Qdrant, backend, frontend)
docker compose up --build
```

- Frontend: `http://localhost:3000`
- Backend API docs: `http://localhost:8000/docs`

### Running tests

```bash
# Backend
cd backend && pytest

# Frontend
cd frontend && npm test
```

## Project Structure

```
meridian/
├── frontend/           # Next.js app (App Router)
├── backend/
│   ├── app/
│   │   ├── api/        # FastAPI routes
│   │   ├── agents/      # LangGraph agent definitions
│   │   ├── rag/          # Chunking, embedding, retrieval
│   │   ├── models/      # SQLAlchemy models
│   │   └── core/        # Config, auth, dependencies
│   └── tests/
├── docker-compose.yml
└── .github/workflows/   # CI/CD
```

## Roadmap

Meridian AI is designed to grow from a student-focused MVP into a general-purpose personal AI OS.

| Version | Focus | Status |
|---|---|---|
| **V0.1** | Foundation, Knowledge Hub, AI Chat + Memory, basic RAG | 🚧 In progress |
| **V2** | Planner Agent — scheduling, conflict detection, auto-rescheduling | 📋 Planned |
| **V3** | Learning Agent — auto-generated flashcards, quizzes, mind maps from uploaded material | 📋 Planned |
| **V4** | Career Agent — resume analysis, ATS scoring, skill-gap analysis | 📋 Planned |
| **V5** | Multi-agent orchestration — agents collaborating over shared memory | 📋 Planned |
| **V6+** | Extends beyond students to working professionals, teams, and organizations | 💭 Vision |

## Development Philosophy

This is a learning-first project as much as a portfolio piece — every architectural decision (why LangGraph over raw function calling, why Qdrant, chunking strategy, memory design) is made deliberately and documented, not just implemented. Contributions of feedback and ideas are welcome via Issues.

## License

MIT — see [LICENSE](LICENSE).

## Author

Built by Tanmay as part of an ongoing AI engineering portfolio. Feedback welcome via Issues or [connect on LinkedIn](#).
