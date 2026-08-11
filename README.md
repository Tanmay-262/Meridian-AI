# Meridian AI

**A personal AI operating system — one workspace instead of ten disconnected apps.**

---

## What's Built (V0.1 - Completed)

- 🔐 **Custom Authentication**: User registration and login utilizing native `bcrypt` cryptography and type-safe SQLAlchemy schemas.
- 📄 **Knowledge Hub**: Ingestion of PDFs and Word documents, split recursively into chunks and vectorized locally using a PyTorch encoder.
- 💬 **LangGraph AI Chat**: Agent reasoning cycles built with LangGraph to invoke search tools, load memories, and write long-term user profile facts.
- 🔍 **Local Semantic RAG**: Question answering grounded directly in your uploaded files, complete with similarity scores and sources.
- 🐳 **Infrastructure**: Dockerized multi-service network backed by a GitHub Actions CI pipeline verifying builds and Pytest suites.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, Python, SQLAlchemy, PostgreSQL, Redis |
| AI / Agents | LangGraph, Google Gemini (via LiteLLM), Qdrant (vector DB) |
| Embeddings | Local PyTorch Encoder (`all-MiniLM-L6-v2`) |
| Infra | Docker, Docker Compose, GitHub Actions |

---

## Architectural Decisions

To understand the core design trade-offs made in this project (e.g. why we run embeddings locally on CPU, how we bypassed Gemini `thought_signature` validation errors, and why we explicitly accumulate state lists in LangGraph), please refer to the detailed **[Architectural Decision Log (DECISIONS.md)](file:///d:/Projects/Meridian-AI/DECISIONS.md)**.

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
│   │   ├── api/        # FastAPI routes & business logic
│   │   ├── agent/      # LangGraph state machine & tool nodes
│   │   ├── rag/        # PyTorch embedding & recursive text splitter
│   │   ├── models/      # SQLAlchemy model schemas
│   │   ├── database/    # Postgres sessions & Qdrant collections
│   │   └── core/        # Security, JWT tokens, and settings configs
│   ├── tests/          # Pytest API checks
│   └── migrations/     # Alembic database migrations
├── frontend/           # Next.js App Router workspace
├── docker-compose.yml  # Multi-container orchestration config
├── DECISIONS.md        # Architectural Decision Log (ADL)
└── README.md           # Getting started & platform overview
```

---

## Roadmap

Meridian AI is designed to grow from a student-focused MVP into a general-purpose personal AI OS.

| Version | Focus | Status |
|---|---|---|
| **V0.1** | Foundation, Knowledge Hub, AI Chat + Memory, local RAG | ✅ Completed |
| **V2** | Planner Agent — scheduling, conflict detection, auto-rescheduling | 📋 Planned |
| **V3** | Learning Agent — auto-generated flashcards, quizzes, mind maps from uploaded material | 📋 Planned |
| **V4** | Career Agent — resume analysis, ATS scoring, skill-gap analysis | 📋 Planned |
| **V5** | Multi-agent orchestration — agents collaborating over shared memory | 📋 Planned |

---

## License

MIT — see [LICENSE](LICENSE).
