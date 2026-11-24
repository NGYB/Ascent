---
name: verify-ascent
description: Verification skill for Ascent (AI Career Accelerator). Contains recipes to reach, drive, and verify all user-facing features across web UI, client-side storage, and API flows.
---

# Verify Ascent

Verification map and regression verification recipes for the Ascent platform.
Any agent making UI, API, or logic changes in this repository should consult this skill to verify their changes without guessing routes or selectors.

## Status Summary

* **Harness**: Web (Next.js App Router, React 19, Tailwind CSS v4)
* **Mode**: Static Code Audit (Initial baseline)
* **Features Cataloged**: 7

| Feature | Route | Status | File |
| :--- | :--- | :--- | :--- |
| **Smart Job Radar** | `/radar` | `unverified: static code audit` | [`features/smart-job-radar.md`](features/smart-job-radar.md) |
| **CV Workspace** | `/cv` | `unverified: static code audit` | [`features/cv-workspace.md`](features/cv-workspace.md) |
| **Tailoring & ATS** | `/tailor` | `unverified: static code audit` | [`features/tailoring-and-ats.md`](features/tailoring-and-ats.md) |
| **Mock Interview Room** | `/interview` | `unverified: static code audit` | [`features/mock-interview-room.md`](features/mock-interview-room.md) |
| **Application Pipeline Tracker** | `/tracker` | `unverified: static code audit` | [`features/application-tracker.md`](features/application-tracker.md) |
| **Privacy, Storage & FAQ** | `/faq` | `unverified: static code audit` | [`features/privacy-and-storage.md`](features/privacy-and-storage.md) |
| **Feedback System** | Global Modal | `unverified: static code audit` | [`features/feedback-system.md`](features/feedback-system.md) |

---

## Verification Loop for Agents

When making changes to Ascent:
1. **Identify Affected Features**: Check the table above for the features impacted by your changes.
2. **Review Feature Recipe**: Read the corresponding `features/<feature>.md` file to understand the expected user journey, drive steps, and observable results.
3. **Verify Locally**:
   - Ensure development server runs with `npm run dev`.
   - Execute the driving steps specified in the feature file.
   - Inspect local browser storage (`localStorage`) to confirm expected schema writes.
4. **Update Feature Entries**: If your changes introduce new controls, routes, or behaviors, update the corresponding feature file.

---

## Environment & Storage Configuration

Ascent is privacy-first and stores candidate data locally in browser `localStorage`:

| Storage Key | Purpose | Schema / Content |
| :--- | :--- | :--- |
| `ascent_master_resume` | Core Master CV text | Plain string extracted from PDF or pasted |
| `ascent_resume_name` | Original filename | String (e.g. `resume.pdf`) |
| `ascent_tailored_resumes` | Versioned tailored resumes | JSON array of `{ id, jobTitle, company, tailoredResume, atsAnalysis, ... }` |
| `ascent_tailor_active_draft` | Active in-progress tailoring session | JSON object of `{ jobTitle, company, jobDescription, result, saved, ... }` |
| `ascent_applications` | Kanban applications | JSON array of `{ id, jobTitle, company, status, applyUrl, ... }` |
| `ascent_interview_session` | Active practice session | JSON object of active 5-question interview session |
| `ascent_interview_history` | Completed interview logs | JSON array of completed interview sessions |
| `ascent_colorblind_mode` | Accessibility flag | Boolean string (`"true"` / `"false"`) |
| `ascent_sidebar_collapsed` | Desktop sidebar state | Boolean string (`"true"` / `"false"`) |

### External API Keys (`.env`)
* `GEMINI_API_KEY`: Powers AI CV parsing, ATS scorecard scoring, and mock interview questions/evaluations.
* `SERPAPI_API_KEY`: Queries Google Jobs on `/radar` (falls back to mock/demo listings if unconfigured).
* `RESEND_API_KEY` & `FEEDBACK_RECIPIENT_EMAIL`: Dispatches user feedback emails.

---

## Findings & Agent Verification Backlog

Gaps identified during static code audit that would improve automated agent driving:
1. **Missing `data-testid` on Primary Buttons**:
   - `/radar`: Action buttons ("Score with My CV", "Scan Radar", "Tailor CV for this Role") currently rely on text matching rather than dedicated `data-testid` attributes.
   - `/tailor`: Tab switcher buttons rely on text matching ("JD Deflator", "Tailored CV").
2. **Dynamic Client-Side PDF.js Dependency**:
   - `/cv` and `QuickUploadModal` load PDF.js from Cloudflare CDN (`cdnjs.cloudflare.com`). In offline sandbox environments, PDF parsing will fail unless PDF.js is locally bundled or mocked.
