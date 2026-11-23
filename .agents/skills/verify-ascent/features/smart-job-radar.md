# Feature: Smart Job Radar

Live job opportunity scanner integrating SerpAPI Google Jobs, spam filtering, and instant AI fit scoring against candidate CVs.

* **Route**: `/radar`
* **Status**: `unverified: static code audit (no live server driven)`

---

## How to Reach

1. Click **Smart Job Radar** in the desktop sidebar (`components/Sidebar.tsx`).
2. Or tap **Radar** in the mobile bottom bar (`components/BottomNav.tsx`).
3. Or click **Scan Radar First** on the landing dashboard (`/`).

---

## How to Drive

### 1. Zero-State & Role Search
* **Target Role Input**: `input#radar-role-input` (type role query, e.g. "Product Manager").
* **Location Input**: `input#radar-location-input` (defaults to "Singapore", clearable with `button[aria-label="Clear location input"]`).
* **Remote-Only Filter**: Toggle checkbox `input[type="checkbox"]` ("Remote / Flexible only").
* **Quick Role Chips**: Click any pill matching:
  * `"Product Manager"`
  * `"Data Scientist"`
  * `"AI Engineer"`
  * `"Operations Director"`
  * `"Sales Director"`
* **Submit Search**: Click `button[type="submit"]` (labeled "Scan Radar") or press Enter in either input.

### 2. Pre-CV "Score After" Flow
* When viewing jobs without a Master CV loaded in `localStorage`:
  * Click button labeled **"Score with My CV"** on any job card, or click **"Upload CV & Score"** in the top callout banner.
  * A modal (`QuickUploadModal`) appears with `role="dialog"`.
  * Upload a test PDF file via file input `input[type="file"][accept=".pdf"]` or switch to "Paste Plain Text" tab and enter resume text into `textarea`.
  * Click **"Score All Scanned Jobs"** (or "Save CV & Score Jobs").

### 3. Transfer to Tailoring Engine
* On any job card, click the primary action button labeled **"Tailor CV for this Role"**.

---

## Expected Observable Result

* **Search Results**:
  * Results counter text updates: `Showing X active opportunities for "<role>" in <location>`.
  * Job cards appear with title, company name, location, and source platform badge.
* **Match Scoring**:
  * With CV loaded: Badge displays `{score}% Match • {High Fit|Good Fit|Transferable}` in blue/indigo/amber.
  * Without CV loaded: Badge displays interactive "Score with My CV" button.
* **Storage Writes**:
  * `localStorage.getItem('ascent_radar_last_role')` stores last searched role.
  * `localStorage.getItem('ascent_radar_cached_jobs')` stores returned job array.
  * Clicking "Tailor CV for this Role" sets `sessionStorage.getItem('ascent_import_job')` with `{ jobTitle, company, jobDescription, applyLink }` and navigates to `/tailor?import=radar`.

---

## Gotchas & Failure Modes

* **Missing API Key**: If `SERPAPI_API_KEY` is missing in `.env`, the endpoint returns a sample demo dataset and displays a yellow demo warning banner (`#hasApiKey`).
* **Scam Filter**: Listings from flagged data-harvesting aggregators (e.g., `trabajo.org`) are automatically stripped by `lib/job-blocklist.ts`.
* **Rate Limits**: Google Jobs via SerpAPI can take 2–5 seconds; expect a spinner on `Radar className="animate-spin"`.
