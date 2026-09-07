# Ascent — AI Career Accelerator & Job Acquisition Platform

Ascent is a privacy-first, client-side career accelerator built with Next.js, React, and Tailwind CSS. It empowers job seekers across all career disciplines to scan live market opportunities, tailor resumes with precision, deconstruct job requirements, practice AI-evaluated mock interviews, and manage application pipelines with interactive analytics.

---

## Core Features

- **CV Workspace**: Upload master resumes in PDF or plain text with dynamic client-side extraction.
- **Smart Job Radar**: Real-time role discovery powered by SerpAPI and Google Jobs with domain-agnostic AI role matching (Product, Sales, IP & Patents, Operations, Finance, etc.).
- **Tailoring & ATS Scorecard**:
  - Context-aware resume tailoring for target roles.
  - **Must-Have vs. Good-to-Have JD Deflator**: Separates rigid recruiter requirements from negotiable wishlists.
  - Keyword density breakdown and transferable skills mapping.
- **Mock Interview Room**:
  - Auto-generated role-specific questions.
  - STAR framework answer evaluations (Situation, Task, Action, Result).
  - Formatted exemplar responses with section headers.
  - Complete session persistence so candidates can pause and resume practice anytime.
- **Job Tracker & Pipeline Analytics**: Visual Kanban pipeline with Sankey conversion flow tracking from applied to offer.
- **Data & Storage Manager**: Client-side privacy-first architecture with live storage meters and 1-click granular deletion.
- **In-App Feedback System**: Built-in modal sending bug reports and feature ideas directly to your inbox via Resend without exposing your email address.

---

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/NGYB/Ascent.git
cd Ascent
```

### 2. Configure Environment Variables & API Keys
Ascent includes a template file with documented configuration settings. Copy the template to create your local `.env` file:

```bash
cp .env.example .env
```

Open the newly created `.env` file in your editor and populate the API keys:

```env
# ==============================================================================
# ASCENT PLATFORM CONFIGURATION & API KEYS
# ==============================================================================

# 1. DATABASE CONNECTION
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ascent?schema=public"

# 2. GOOGLE GEMINI AI (https://aistudio.google.com/)
GEMINI_API_KEY="your_gemini_api_key_here"

# 3. SERPAPI GOOGLE JOBS ENGINE (https://serpapi.com/)
SERPAPI_API_KEY="your_serpapi_api_key_here"

# 4. RESEND EMAIL SERVICE (https://resend.com/)
RESEND_API_KEY="re_your_resend_api_key_here"

# 5. RECIPIENT EMAIL FOR FEEDBACK
FEEDBACK_RECIPIENT_EMAIL="your_email@example.com"
```

---

## API Keys Overview

| Variable | Provider / Signup | Purpose in Ascent |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/) *(Free)* | Powers all AI features: CV parsing, ATS scorecard analysis, JD Deflator, resume rewriting, mock interview evaluation, and role suggestions. |
| `SERPAPI_API_KEY` | [SerpAPI](https://serpapi.com/) *(Free tier)* | Powers the **Smart Job Radar** by querying real-time Google Jobs listings based on title and location. |
| `RESEND_API_KEY` | [Resend](https://resend.com/) *(Free tier: 3,000 emails/mo)* | Powers the in-app **Feedback Form** by securely dispatching user submissions to your inbox. |
| `FEEDBACK_RECIPIENT_EMAIL` | Personal / Admin Email | Destination email for user feedback. Handled strictly on the server (`/api/feedback`) and **never exposed** to the client. |
| `DATABASE_URL` | PostgreSQL | Connection string for Prisma ORM schema migrations and backend storage. |

---

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## Production Deployment (Vercel)

1. Push your repository to GitHub.
2. Import the repository into your [Vercel Dashboard](https://vercel.com).
3. Under **Project Settings** $\rightarrow$ **Environment Variables**, add the keys defined in `.env`:
   - `GEMINI_API_KEY`
   - `SERPAPI_API_KEY`
   - `RESEND_API_KEY`
   - `FEEDBACK_RECIPIENT_EMAIL`
   - `DATABASE_URL` (optional if using local database, or set to your hosted Postgres URL)
4. Click **Deploy**. Vercel will automatically build and publish the app.

---

## Privacy Architecture

- **Private by Design**: Master CVs, tailored resumes, interview transcripts, and application pipelines are saved locally in the candidate's browser (`localStorage`).
- **No Third-Party Resume Retention**: Candidate resumes are never stored in external public databases.
- **Data Deletion**: Users can inspect exact storage usage or wipe their data with one click using the built-in **Data & Storage Manager**.
