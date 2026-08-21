# Meridian Personal OS — Project Pitch Deck

**A unified, local, AI-first workspace designed to replace disconnected productivity apps.**

---

### Slide 1: The Problem
> **The App Fragmentation Crisis**
* **The Reality**: Users rely on 10+ disconnected apps daily (Notion, ChatGPT, Google Docs, Todoist, PDF readers).
* **The Consequences**:
  - Information gets siloed in separate databases.
  - Context is constantly lost; users must copy-paste data between tools.
  - AI assistants behave like basic chatbots starting from scratch on every turn.

---

### Slide 2: The Solution
> **Meridian Personal OS**
* **Unified Context**: A single glassmorphic command center dashboard combining files, notes, AI chat, and scheduling.
* **Persistent Memory**: A shared Postgres database that lets AI agents remember your preferences, technologies, and settings across different chat threads.
* **Dynamic Agents**: LangGraph orchestrations that allow AI to look up files, write database memories, and manage calendar events in real time.

---

### Slide 3: Architectural Blueprint
```
                   Next.js Glassmorphic Frontend
                                 │
                          FastAPI Backend
                                 │
                ┌──────────────────────────────────┐
                │ LangGraph AI Orchestration Loop  │
                └──────────────────────────────────┘
                 /       /         \            \
    Knowledge Hub   RAG Search   Memory Tool   Planner Calendar
         │              │            │               │
      PyTorch        Qdrant     PostgreSQL      PostgreSQL
    L6-v2 Encoder   Vector DB    (Memories)     (Schedules)
```

---

### Slide 4: Core Capabilities (Shipped)
* **🔑 Custom Session Security**: Native `bcrypt` authentication and JWT tokens.
* **📁 Knowledge Ingestion**: Uploads PDFs and Word files, chunks text, and vectorizes them locally.
* **🔍 Semantic RAG Search**: Returns accurate answers grounded in your documents with similarity scores and sources.
* **💬 AI Chat with Long-Term Memory**: Gemini writes user details (hobbies, preferred tools) to a persistent SQL database.
* **📅 Planner Calendar**: An interactive weekly timeline highlighting scheduling conflicts with an automated AI reschedule button.

---

### Slide 5: The AI Reasoning Loop (LangGraph)
* **Cyclical State Machine**: Unlike linear DAG chains (LangChain) that call a tool and immediately reply, LangGraph enables the agent to loop:
  1. **Agent Node**: Reads prompt and current user memories.
  2. **Action Node**: Executes tools (like calendar scheduling).
  3. **Evaluation**: Checks results and loops back to Agent Node if more reasoning cycles are needed to answer the query.

---

### Slide 6: Zero-Cost local AI Engineering
* **Local Embedding Models**: Avoids external OpenAI bills by hosting a local PyTorch `all-MiniLM-L6-v2` encoder inside the Docker container.
* **Gemini Quota Bypassing**: Uses stable `v1` endpoint schemas to eliminate experimental thought signatures, and routes queries to `gemini-3.5-flash-lite` to bypass daily quota restrictions for free.
* **Orchestration**: Packaged with Docker Compose to start databases, caches, vector stores, and apps in one single command.

---

### Slide 7: Product Roadmap
* **V0.1 — Foundation**: Authentication, Knowledge Hub, Memory Chat, Local RAG. (✅ **Completed**)
* **V2 — Planner Agent**: Priority-based scheduling, overlap conflict detection, auto-rescheduling. (✅ **Completed**)
* **V3 — Learning Agent**: Auto-generated flashcards, quizzes, and mind maps from uploaded materials. (📋 **Planned**)
* **V4 — Career Agent**: Resume analyzer, ATS scoring, and skill-gap checks. (📋 **Planned**)

---

### Slide 8: Summary — Why Meridian Wins
* **1. Offline-First & Private**: Local vector generation protects user document privacy.
* **2. Proactive scheduling**: The AI doesn't just chat; it organizes calendars and resolves conflicts dynamically.
* **3. Extensible**: Clean, type-safe API boundaries make adding V3/V4 agents simple.
