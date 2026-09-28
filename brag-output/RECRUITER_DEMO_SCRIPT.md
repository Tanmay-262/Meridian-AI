# 🎥 Meridian Personal OS — Recruiter & AI Engineering Portfolio Demo Video (75 Seconds)

> **Target Audience**: Technical Recruiters, Engineering Managers, and Senior AI/Software Engineering Interviewers.  
> **Key Focus**: Production-grade engineering, zero-cost AI architecture, stateful multi-agent design, and real working features without fluff or vanity metrics.

---

## ⏱️ 75-Second Master Portfolio Script

### 🎬 Scene 1: Strong Opening & Product Reveal (0:00 - 0:12)
* **Visual**: Immediate high-resolution UI walkthrough of **Meridian Personal OS** running live in Deep Space dark theme (`#070B10`). Mouse cursor smoothly navigates across the Command Center dashboard, showing live metrics, active RAG collections, and upcoming scheduled events.
* **On-Screen Text / Code Overlay**:  
  `System: Meridian Personal OS v0.1`  
  `Stack: FastAPI + Next.js + LangGraph + PyTorch CPU + PostgreSQL + Qdrant`
* **Voiceover / Caption**:  
  *"Most developers rely on 10 disconnected apps daily, with AI chatbots that reset context on every refresh. I engineered **Meridian Personal OS** — a unified, local-first workspace that combines document RAG, persistent user memory, and proactive calendar agent loops into one high-performance command center."*

---

### 🎬 Scene 2: Local $0-Cost PyTorch RAG Pipeline (0:12 - 0:28)
* **Visual**: Split screen showing real UI file drop into Knowledge Hub, and adjacent backend Python code ([embeddings.py](file:///d:/Projects/Meridian-AI/backend/app/rag/embeddings.py)) executing PyTorch mean pooling and L2 normalization on CPU. Search query returned with exact vector similarity scores and source passage highlights.
* **Architecture Callout**:  
  `Model: sentence-transformers/all-MiniLM-L6-v2`  
  `Compute: Container CPU (Zero External API Fees)`  
  `Vector Store: Qdrant (384-Dimensional Cosine Similarity)`
* **Voiceover / Caption**:  
  *"Instead of accumulating SaaS API bills or leaking user documents to 3rd-party services, Meridian runs a local PyTorch `all-MiniLM-L6-v2` encoder inside the backend container. Text is chunked recursively, embedded via attention masking and L2 normalization, and stored in Qdrant for 100% private, zero-cost semantic search."*

---

### 🎬 Scene 3: LangGraph Cyclical State & PostgreSQL Memory (0:28 - 0:45)
* **Visual**: Live chat session window. User types: *"I'm building a FastAPI backend with PostgreSQL."* The AI responds, triggers `save_long_term_memory`, and writes the record into PostgreSQL. Graph node loop pulsing with Intelligence Violet (`#A27BFF`).
* **Technical Callout**:  
  `Orchestration: LangGraph Cyclical State Machine`  
  `Persistence: PostgreSQL (LongTermMemory schema)`  
  `Quota Optimization: LiteLLM proxy targeting Gemini v1 schema`
* **Voiceover / Caption**:  
  *"To give the AI true stateful memory, I built a cyclical state machine in LangGraph. Unlike static chains, the agent loops: evaluating queries, retrieving grounded document passages, and writing long-term profile facts into PostgreSQL that persist across independent chat threads."*

---

### 🎬 Scene 4: AI Planner & Priority Conflict Resolver (0:45 - 1:00)
* **Visual**: Weekly calendar UI showing an overlapping task highlighted in Gold Signal (`#D5A65B`). User clicks *"Auto-Resolve Conflicts"*. Backend function `auto_resolve_schedule_conflicts` executes, re-sorting task priority weights (`high` > `medium` > `low`) and shifting lower-priority tasks smoothly to conflict-free time slots.
* **Technical Callout**:  
  `Algorithm: Deterministic Priority Conflict Resolver`  
  `Execution: Iterative shift loop (max_iterations = 10)`
* **Voiceover / Caption**:  
  *"The AI Planner isn't just a passive calendar display. When schedule overlaps occur, a deterministic Python resolution algorithm automatically shifts lower-priority tasks to start after higher-priority events, guaranteeing a conflict-free weekly timeline."*

---

### 🎬 Scene 5: Active Recall V3 Learning Hub (1:00 - 1:10)
* **Visual**: Quick demonstration of 3D interactive flashcard flipping with rigid CSS backface visibility controls, 5-box Leitner memory progression status, and dynamic concept mind map nodes.
* **Technical Callout**:  
  `Algorithm: 5-Box Leitner Spaced Repetition (timedelta interval progress)`
* **Voiceover / Caption**:  
  *"Workspace materials are automatically converted into 3D flashcards, quizzes, and mind maps powered by a native 5-box Leitner spaced repetition engine."*

---

### 🎬 Scene 6: Architecture & Closing Value (1:10 - 1:15)
* **Visual**: Fast zoom-out to Docker Compose terminal launching all 6 services (`FastAPI`, `Next.js`, `PostgreSQL`, `Qdrant`, `Redis`, `LiteLLM`). Clean closing logo card with GitHub link.
* **Closing Statement**:  
  *"Meridian Personal OS represents production-grade AI engineering: private, resilient, and proactive. Check out the open-source repository on GitHub!"*

---

## 🎯 Interview Talking Points for Technical QA

When discussing this project in engineering interviews, focus on these 4 core design choices:
1. **Why Local Embeddings?** Eliminates API cost scaling issues and protects sensitive user documents.
2. **Why LangGraph over LangChain?** LangChain DAGs are strictly linear. LangGraph allows cyclical evaluation, enabling multi-step tool calls and state modification loops.
3. **How was Gemini API instability handled?** Bypassed experimental `v1beta` `thought_signature` crashes by forcing stable `v1` schemas via LiteLLM and targeting `gemini-3.5-flash-lite` for separate quota pools.
4. **How was test isolation achieved?** Built Pytest fixtures using FastAPI `dependency_overrides` for OAuth2 bypass and transactional SQLAlchemy database mocks.

---
*Created for Meridian AI Portfolio Showcase*
