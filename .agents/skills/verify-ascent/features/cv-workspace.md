# Feature: CV Workspace

Central client-side document ingestion portal to upload, extract, preview, and edit the candidate's core Master CV.

* **Route**: `/cv`
* **Status**: `unverified: static code audit (no live server driven)`

---

## How to Reach

1. Click **CV Workspace** in the desktop sidebar (`components/Sidebar.tsx`).
2. Or tap **CV** in the mobile bottom bar (`components/BottomNav.tsx`).
3. Or click **Go to Workspace** from Card 2 on the dashboard (`/`).

---

## How to Drive

### 1. Upload Master CV (PDF)
* Locate file input: `input[type="file"][accept=".pdf"]`.
* Select a valid text-based PDF file.
* Click button labeled **"Parse & Upload Master CV"**.

### 2. Live Text Review & Manual Editing
* After extraction, the right panel displays the parsed text.
* Click button labeled **"Edit Text"** (icon: `Edit3`).
* Edit the raw text inside the `textarea`.
* Click button labeled **"Save Changes"** (icon: `Save`).

### 3. Clear Stored CV
* Click button labeled **"Clear"** at the top right of the master profile card.
* Confirm browser alert prompt to delete local copy.

---

## Expected Observable Result

* **Extraction Success**:
  * Success alert banner appears: *"Master CV uploaded and saved! Head to Smart Job Radar to scan target roles..."*.
  * The raw text preview renders with character/word count meters.
  * Extracted social links (LinkedIn, GitHub, Portfolio) are parsed into Markdown links (`[LinkedIn](url)`).
* **Storage Writes**:
  * `localStorage.getItem('ascent_master_resume')`: Raw string of parsed CV.
  * `localStorage.getItem('ascent_resume_name')`: File name (e.g. `My_Resume.pdf`).
  * Dispatches `ascent-storage-cleared` event to synchronize other open tabs.

---

## Gotchas & Failure Modes

* **Scanned/Image PDFs**: PDFs without a native text layer (scanned images) will fail client-side parsing with error: *"PDF file appears to be empty or contains scanned/image-only text"*.
* **CDN Offline Risk**: `lib/pdf.ts` dynamically fetches PDF.js from Cloudflare CDN (`cdnjs.cloudflare.com`). Network-isolated environments will fail to load PDF.js.
