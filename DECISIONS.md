# Architectural Decision Log (ADL) — Meridian Personal OS

This document records the key architectural decisions, debug resolutions, and implementation trade-offs made during the development of Meridian Personal OS (V0.1).

---

## 1. Security & Authentication: Native `bcrypt` vs. `passlib`
* **Decision**: Direct usage of the native `bcrypt` Python package for password hashing and validation.
* **Context**: Initially, the codebase relied on `passlib` (with the `bcrypt` backend) to hash passwords. However, `passlib` has been unmaintained for several years and relies on deprecated internal signatures that crash under Python 3.11+ and modern `bcrypt` releases.
* **Resolution**: Replaced `passlib` with direct, raw imports of `bcrypt` to generate salts and verify passwords safely:
  ```python
  import bcrypt
  # Hashing
  hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
  # Verifying
  match = bcrypt.checkpw(password.encode("utf-8"), hashed_pass)
  ```

---

## 2. RAG Local Embeddings: PyTorch CPU Encoder vs. OpenAI Embeddings API
* **Decision**: Running a local PyTorch sentence-transformer (`all-MiniLM-L6-v2`) on the backend CPU container instead of calling an external OpenAI API.
* **Rationale**: 
  - **Zero Cost**: Eliminates API usage bills during development and ingestion.
  - **Privacy**: No user documents are ever sent to third-party endpoints for chunk vectorization.
  - **Self-Contained**: The application runs completely offline (or behind local firewalls) without external network dependencies.
* **Implementation**: Programmed manual token attention masking, **mean pooling** to group token outputs, and **L2 normalization** to produce normalized 384-dimensional cosine similarity vectors.

---

## 3. LangGraph: Explicit Node Accumulation vs. Implicit Reducer Merges
* **Decision**: Explicitly loading and accumulating the message history inside graph nodes instead of relying on implicit LangGraph State annotations.
* **Context**: In LangGraph, if a list key in the central State dict (like `messages`) is not configured with an explicit reducer function, returning a list value from a node will **overwrite** the key instead of appending to it.
  - During tool calling, this caused `action_node` to return only the `tool` message, deleting the user query and the assistant's tool-call request from the state.
  - This deletion triggered Gemini validation errors since Gemini saw a tool response without the preceding tool call.
* **Resolution**: Modified the returns in both `agent_node` and `action_node` to explicitly merge lists:
  ```python
  updated_messages = list(state["messages"]) + new_messages
  return {"messages": updated_messages}
  ```

---

## 4. Google Gemini API: Stable `v1` Endpoint & `thinking_budget` Configuration
* **Decision**: Forcing the stable `v1` API endpoint (`api_version="v1"`) and switching dynamically to `gemini-3.5-flash-lite` to handle quotas.
* **Rationale**: 
  - **Thought Signatures**: Gemini's experimental `v1beta` endpoint has a strict feature called "Thinking" enabled by default. During tool calling, it generates a `thought_signature` token that must be echoed back in subsequent requests. Because OpenAI-compatible proxies (like LiteLLM) strip this metadata, the `v1beta` endpoint threw validation errors.
  - **Resolution**: We configured LiteLLM to use the stable `v1` endpoint. Stable `v1` handles tool-calling natively without enforcing thought signature tokens.
  - **Quota Limits**: Google AI Studio free tier rate-limits `gemini-3.5-flash` to 20 requests per day. We configured the engine to target `gemini-3.5-flash-lite`, which utilizes a separate independent quota pool, preventing rate limit blocks.

---

## 5. CI/CD Infrastructure: Docker Compose Optional `env_file` Loading
* **Decision**: Adding `required: false` to the `env_file` property in `docker-compose.yml`.
* **Rationale**: 
  - Since `.env` files contain sensitive API credentials, they are ignored by git (via `.gitignore`).
  - In a clean GitHub Actions runner, the file `backend/.env` does not exist. By default, running `docker compose config` will fail if a listed environment file is missing.
  - **Resolution**: Setting `required: false` tells Docker Compose that the file is optional, allowing config checks to pass cleanly in CI while still loading it locally.
  ```yaml
  env_file:
    - path: ./backend/.env
      required: false
  ```

---

## 6. Testing Robustness: Safe Config Defaults in `Settings`
* **Decision**: Providing safe default string values in the Pydantic `BaseSettings` configurations class.
* **Rationale**: 
  - Pydantic settings will fail to load (throwing `ValidationError`) if a required property (like `DATABASE_URL` or `QDRANT_URL`) is missing.
  - In CI workflows, these variables are not loaded from any file.
  - **Resolution**: Adding standard fallback default URLs (e.g. `DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/meridian"`) allows pytest to boot the backend and test routes cleanly in any environment without requiring configuration parameters.

---

## 7. Dynamic AI Scheduling: Iterative Priority-Based Conflict Shifting
* **Decision**: Designing a deterministic, iterative schedule-shifting algorithm in Python (`auto_resolve_schedule_conflicts`) instead of relying on heavy constraint satisfaction programming (CSP) libraries.
* **Rationale**: 
  - **Simplicity**: Shifting lower-priority overlapping tasks to start exactly at the end time of conflicting higher-priority tasks is computationally simple, low latency, and highly readable.
  - **Iterative Check**: Overlaps from shifted events are handled by recursively checking and re-sorting active items until a completely conflict-free weekly timeline is achieved, preventing endless loops using a safety limit (`max_iterations = 10`).

---

## 8. Test Isolation: Dependency Overrides & Mock Database Setup
* **Decision**: Overriding `get_current_user` in pytest using FastAPI `dependency_overrides` and executing user inserts inside fixture transactions.
* **Rationale**: 
  - **OAuth2 Bypass**: The live app requires valid OAuth2 JWT tokens for scheduler operations. Overriding the dependency allows testing API routes directly using a mock `User` object.
  - **Postgres Constraints**: The Postgres schema enforces non-nullable `hashed_password` constraints. Setting a mock hashed password in the fixture-injected test user allows schema validation checks to pass cleanly, maintaining database integrity.
