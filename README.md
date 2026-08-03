# ✨ Vibely — AI-Integrated Social Media Platform

> **Share your world. Connect your vibe.**  
> An enterprise-grade, lightweight AI-powered social media platform (Web App + Mobile PWA) built with a **Python FastAPI backend** and **React frontend**, utilizing **100% free-tier services**.

---

## 🌟 Key Features

- ⚡ **Groq Llama 3 AI Engine**: Ultra-fast AI post caption generation, vibe tag recommendations, content safety moderation, and interactive **VibeAI Chat Companion**.
- 🗄️ **PostgreSQL & SQLite Database Support**: Ready for local PostgreSQL, SQLite, or free-tier cloud PostgreSQL (Supabase / Neon.tech).
- 🛡️ **Daily User Quotas & Rate Limiting** (Built-in $0 Cost Safeguards):
  - **10 AI Generations / day** per user.
  - **15 Posts / day** per user.
  - **10 Image Uploads / day** per user.
  - **60 API requests / minute** per IP address.
- 🎨 **Enterprise Dark Glassmorphism Design**: Sleek dark theme, backdrop-blur cards, vibrant typography (`Outfit` & `Inter`), glowing badges, and heart pulse animations.
- 📱 **Progressive Web App (PWA)**: Installable on iOS & Android directly from the browser without app store fees.
- 🔐 **JWT Authentication & Profile System**: Custom avatars, bio editor, Vibe Badge switcher (`Creator`, `AI Pioneer`, `Techie`), and follower metrics.

---

## 🛠️ 100% Free Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend API** | Python 3.10+ (FastAPI + AsyncIO) | High-performance REST API with OpenAPI auto-docs |
| **Database** | PostgreSQL (psycopg2-binary) / SQLite | Relational database with automatic table creation & pooling |
| **Security** | PyJWT + Bcrypt | Secure authentication & password hashing |
| **AI Services** | Groq Cloud API (Llama 3 8B) | Ultra-fast free LLM inference (<0.5s) |
| **Frontend** | React 19 + Vite 8 + Tailwind CSS | Responsive edge web application |
| **Icons** | Lucide React | Modern vector icon set |

---

## 🐘 Configuring PostgreSQL Database

You can connect Vibely to local PostgreSQL or Supabase Free Tier PostgreSQL by setting the `DATABASE_URL` environment variable:

Create or edit `.env` inside `backend/`:

### Option A: Local PostgreSQL
```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/vibely_db
```

### Option B: Supabase Free PostgreSQL Cloud (Recommended for $0 hosting)
```env
DATABASE_URL=postgresql://postgres.xxxx:your_password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### Option C: Default SQLite (No installation needed)
```env
DATABASE_URL=sqlite:///./vibely.db
```

---

## 🚀 How to Run Locally (Step-by-Step)

### Prerequisites
- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- *(Optional)* PostgreSQL database installed locally or a free Supabase project

---

### Step 1: Start the Python FastAPI Backend

1. Open your terminal in the `backend` folder:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **Windows**:
     ```powershell
     python -m venv .venv
     .venv\Scripts\activate
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. Install backend dependencies (including PostgreSQL drivers):
   ```bash
   pip install -r requirements.txt
   ```

4. Create `.env` inside `backend/`:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/vibely_db
   GROQ_API_KEY=gsk_your_free_groq_api_key_here
   ```

5. Start the FastAPI backend server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```

   - Backend URL: `http://localhost:8000`
   - Interactive Swagger API Docs: `http://localhost:8000/api/v1/docs`

---

### Step 2: Start the React Frontend Web App

1. Open a **second terminal** window in the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser at:  
   👉 **`http://localhost:5173`**

---

## 🧪 Running Automated Tests

To verify backend endpoints, authentication, and daily quotas:
```bash
cd backend
.venv\Scripts\python -m pytest tests/
```

To test the frontend production build:
```bash
cd frontend
npm run build
```

---

## 🌐 100% Free Cloud Deployment Guide

### Deploy Backend to Render.com (Free)
1. Create a **Web Service** on [Render.com](https://render.com) connected to your GitHub repo.
2. Set **Root Directory** to `backend`.
3. Set **Build Command**: `pip install -r requirements.txt`
4. Set **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Set Environment Variable `DATABASE_URL` = Your Supabase PostgreSQL connection string.

### Deploy Frontend to Vercel.com (Free)
1. Create a project on [Vercel.com](https://vercel.com) connected to your GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Set Environment Variable: `VITE_API_BASE_URL` = `https://your-render-backend.onrender.com/api/v1`
