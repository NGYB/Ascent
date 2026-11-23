# Feature: Mock Interview Simulator

Interactive practice room generating customized behavioral and domain-specific questions, scoring user answers using the STAR method, and rendering formatted exemplar responses.

* **Route**: `/interview`
* **Status**: `unverified: static code audit (no live server driven)`

---

## How to Reach

1. Click **Interview Prep** in the desktop sidebar (`components/Sidebar.tsx`).
2. Or tap **Prep** in the mobile bottom bar (`components/BottomNav.tsx`).
3. Or click **Practice Interview for this Role** from the Tailoring workspace (`/tailor`).

---

## How to Drive

### 1. Select Role & Generate Questions
* **Option A (Saved Tailored CV)**: Select a role from the dropdown menu of previously tailored CVs.
* **Option B (Custom Specs)**: Enter target job title, company, and paste the job description.
* Click button labeled **"Generate Interview Questions"** (icon: `Sparkles`).
* `/api/interview/generate` produces exactly 5 role-specific questions with recruiter coaching hints.

### 2. Practice Answering
* View the current question card (Question 1 of 5).
* Click **"Show Recruiter Hint"** to view framing advice.
* Enter practice response into the answer `textarea`.
* Click button labeled **"Submit Answer for AI Feedback"** (icon: `Send`).

### 3. Review Feedback & Progress
* `/api/interview/feedback` returns:
  * Numerical score (0–100).
  * Bulleted **Strengths** (in emerald).
  * Constructive **Areas for Improvement** (in amber).
  * Formatted **Exemplar Answer** modeling the STAR framework (Situation, Task, Action, Result).
* Click button labeled **"Next Question"** to proceed to question 2 through 5.
* At the final question, click **"Complete Interview Session"**.

### 4. Review Past Practice History
* Click **"Interview History"** tab to view logged past sessions, scores, and questions.

---

## Expected Observable Result

* **Interactive Flow**:
  * Step indicator progresses across all 5 questions.
  * STAR evaluation cards render with detailed actionable feedback.
* **Storage Writes**:
  * `localStorage.getItem('ascent_interview_session')`: Persists active in-progress session so candidates can refresh without losing progress.
  * `localStorage.getItem('ascent_interview_history')`: Appends completed interview logs.

---

## Gotchas & Failure Modes

* **Empty Answers**: Submitting an empty or near-empty answer triggers a validation error.
* **Gemini Dependency**: Requires `GEMINI_API_KEY` in `.env`.
