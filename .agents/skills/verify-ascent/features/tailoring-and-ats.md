# Feature: Tailoring & ATS Scorecard

Context-aware resume optimizer rewriting experience bullets, evaluating keyword match percentages, and deflating rigid recruiter requirements into Must-Have vs. Good-to-Have lists.

* **Route**: `/tailor`
* **Status**: `unverified: static code audit (no live server driven)`

---

## How to Reach

1. Click **Tailoring & ATS** in the desktop sidebar (`components/Sidebar.tsx`).
2. Or tap **Tailor** in the mobile bottom bar (`components/BottomNav.tsx`).
3. Or click **Tailor CV for this Role** on any card in Smart Job Radar (`/radar`).

---

## How to Drive

### 1. Form Inputs
* **Target Job Title**: `input` labeled "Target Job Title".
* **Company Name**: `input` labeled "Company Name (Optional)".
* **Application Link**: `input[type="url"]` labeled "Application Link / URL (Optional)".
* **Job Description**: `textarea` labeled "Job Description" (paste JD text).

### 2. Pre-CV Unlock
* If no CV is uploaded yet, clicking **"Upload Master CV"** in the top banner or clicking **"Upload CV & Tailor"** at the bottom of the form will open `QuickUploadModal`.
* Uploading a PDF or pasting resume text automatically unlocks the form and starts tailoring.

### 3. Generate Tailored Resume & Analysis
* Click primary button labeled **"Tailor & Score CV"** (or "Upload CV & Tailor").
* Spinner displays: `Tailoring CV...`.

### 4. Inspect Output Tabs
* **JD Deflator**: Click tab labeled **"JD Deflator"** to review recruiter "Must-Have" requirements vs. negotiable "Good-to-Have" wishlists.
* **Tailored CV**: Click tab labeled **"Tailored Resume"** to inspect defensible bullet points.
* **Keyword Breakdown**: Click tab labeled **"ATS Analysis"** to see matching keywords, missing keywords, and recommended learning actions.
* **Transferable Skills**: Click tab labeled **"Transferable Skills"** to view methodology mapping.

### 5. Downstream Actions
* Click **"Copy Markdown"** to copy the tailored text to clipboard.
* Click **"Mark as Applied"** to push this application directly into the Kanban pipeline (`ascent_applications`).
* Click **"Practice Interview for this Role"** to transfer the tailored resume and JD into `/interview`.

---

## Expected Observable Result

* **Scorecard Display**:
  * Before vs. After ATS match score ring updates (e.g., 55% $\rightarrow$ 88%).
  * Categorized keyword tags render in emerald (matching) and rose (missing).
* **Storage Writes**:
  * `localStorage.getItem('ascent_tailored_resumes')`: Appends new tailored version record with unique UUID.
  * Right history rail updates with the newly tailored version.

---

## Gotchas & Failure Modes

* **Gemini API Key Required**: Requires a valid `GEMINI_API_KEY` in `.env`. Returns 500 error if missing or invalid.
* **Timeout Buffer**: Tailoring uses Gemini 2.5 Flash with structured schema extraction. Processing typically takes 6–12 seconds (`maxDuration = 60`).
* **Probe Standard Guardrail**: Strict system prompt prevents hallucinated company titles or fake domain claims to preserve interview defensibility.
