## 🧑‍💻 Coding Practices & Principles (Keep It Clean)

This app is small on purpose. The goal is **clarity, maintainability, and correctness**, not cleverness. Use simple patterns, consistent structure, and strong boundaries between layers.

---

### ✅ Guiding Principles
- **KISS**: keep implementations straightforward.
- **YAGNI**: don’t build features “just in case”. Only implement what the MVP needs.
- **SOLID (pragmatically)**:
  - **S**ingle responsibility: each module/class does one job.
  - **O**pen/closed: add behavior via new code, not rewriting core flows.
  - **L**iskov: keep interfaces consistent.
  - **I**nterface segregation: keep DTOs/contracts minimal.
  - **D**ependency inversion: routes depend on services, services depend on abstractions (when needed).

---

### 🧩 Backend Practices (FastAPI)
#### 1) Use Pydantic for validation everywhere
- All request bodies must be Pydantic models.
- All responses must be Pydantic models (no raw dicts in routes).
- Use explicit `response_model=...` on endpoints.

**Example structure**
- `schemas/` (Pydantic DTOs): request/response models
- `models/` (ORM): DB models
- `services/`: business logic
- `api/routes_*.py`: thin HTTP layer only

---

#### 2) Keep routes thin (no business logic in endpoints)
Routes should:
- parse input (Pydantic),
- call service functions,
- return response DTOs.

**No:**
- credit calculations in routes
- direct DB logic sprawled across endpoints
- branching workflows inside route handlers

**Yes:**
- `proposal_service.propose_card(...)`
- `credit_service.apply_completion_reward(...)`

---

#### 3) Centralize business rules
Business rules must live in one place (services), for example:
- credit economy logic
- completion confirmation flow
- proposal state transitions
- veto/snooze rules

This prevents duplicated logic and inconsistent behavior.

---

#### 4) Explicit state machines for workflows
For `Proposal.status` transitions, enforce rules in a single service function:

Allowed transitions (example):
- `proposed → accepted | maybe_later | rejected`
- `accepted → completed_pending_confirmation`
- `completed_pending_confirmation → completed_confirmed`

Reject invalid transitions with clear errors.

---

#### 5) Ledger is the source of truth
- Credits are modified only via ledger entries.
- Balance can be stored for convenience, but must match the ledger.
- Never trust the frontend to compute credits.

---

#### 6) Errors and observability
- Use consistent error responses.
- Validate and fail early.
- Add structured logs around credit changes and status transitions.

---

#### 7) Testing (minimal but meaningful)
MVP test focus:
- proposal transition rules
- credit ledger entries created correctly
- completion confirmation prevents cheating
- “maybe later” behavior works

---

### 🎨 Frontend Practices (React)
#### 1) Avoid spaghetti state
- Keep state local when possible.
- Use one data-fetching pattern consistently (e.g. React Query or a small custom client).
- Avoid global state unless you truly need it.

---

#### 2) Components should be dumb; logic should be in hooks/services
- UI components: rendering + callbacks
- Data logic: `hooks/` or `api/` layer

Example:
- `useCards()` fetches cards
- `<CardList />` renders cards

---

#### 3) Never duplicate backend rules
Frontend should not implement:
- credit calculations
- proposal state machines
- “who can confirm completion”

Frontend only displays data and calls backend actions.

---

#### 4) Types & contracts
- Use TypeScript if possible (recommended).
- Generate or mirror types from backend Pydantic schemas.
- Keep a single `apiClient` wrapper that handles:
  - base URL
  - auth token
  - error normalization

---

### 🔒 Security & Data Hygiene Rules
- Never store secrets in the repo.
- Environment variables for API keys (LLM).
- Never store personal Reddit usernames (if Reddit is used later).
- Keep generated content respectful, consent-forward.

---

### 🧹 Clean Code Rules of Thumb (applies to both)
- Prefer **small functions** with clear names.
- One file = one responsibility.
- Avoid “god classes” and mega-modules.
- Delete dead code quickly (YAGNI).
- Write code for the next week’s you, not for a portfolio.

---

### 📦 Suggested Packages (Backend)
- FastAPI
- Pydantic (built-in with FastAPI usage)
- SQLAlchemy (or SQLModel if preferred)
- Alembic (later, when moving to Postgres)
- Passlib + bcrypt for password hashing

---

### ✅ Definition of “Clean MVP”
The MVP is clean when:
- routes are thin,
- services contain business logic,
- validation is via Pydantic,
- credits are ledger-driven,
- proposal transitions are enforced,
- frontend is mostly rendering + API calls,
- you can add a feature without rewriting existing code.
