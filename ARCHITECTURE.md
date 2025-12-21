## 🏗️ Architecture (MVP v1)

### High-level overview
The app is **local-first**: runs on a machine at home and is reachable only on your **home LAN** (phones/laptops). Later it can be deployed to the cloud with minimal changes.

**Components**
- **Frontend:** React.js (Vite)
- **Backend:** FastAPI (Python)
- **Database:** SQLite (MVP) → Postgres (later)
- **LLM Generator:** background job inside backend (MVP) → worker queue (later)

---

### Deployment modes

#### 1) Local LAN (MVP)
- Backend runs on `0.0.0.0:8000`
- Frontend runs on `0.0.0.0:5173` (dev) or served as static files by FastAPI (recommended for single-port simplicity)
- SQLite DB file stored on disk on the home server/laptop

Example LAN access:
- `http://192.168.1.X:5173` (React dev)
- `http://192.168.1.X:8000` (API / docs)

Recommended MVP simplification:
- Build React and serve it from FastAPI so everything is on **one port**:
  - `http://192.168.1.X:8000`

#### 2) Cloud (Future)
- Frontend hosted on Vercel/Netlify/Cloudflare Pages
- Backend hosted on Render/Fly.io/Railway
- Database on managed Postgres (Supabase/Render/Fly/Neon)

---

### Project structure (suggested)
