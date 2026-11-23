# Feature: Application Pipeline Tracker

Visual Kanban board and conversion funnel analytics tracking job applications from initial draft to final offer.

* **Route**: `/tracker`
* **Status**: `unverified: static code audit (no live server driven)`

---

## How to Reach

1. Click **Job Tracker** in the desktop sidebar (`components/Sidebar.tsx`).
2. Or tap **Tracker** in the mobile bottom bar (`components/BottomNav.tsx`).

---

## How to Drive

### 1. Manual Application Creation
* Click button labeled **"+ Add Application"** at top right.
* In the creation modal, enter:
  * **Job Title**: `input` labeled "Job Title" (required).
  * **Company Name**: `input` labeled "Company Name" (defaults to "Not Provided" if blank).
  * **Apply URL**: `input[type="url"]` (optional).
  * **Linked Tailored Resume**: Select from dropdown of saved versions.
  * **Initial Stage**: Select from `DRAFT`, `APPLIED`, `INTERVIEWING`, `OFFER`, or `REJECTED`.
* Click **"Save Application"**.

### 2. Transition Applications Across Stages
* On any application card, use the stage-shifting buttons:
  * Click right arrow (`MoveRight`) to advance (e.g. `DRAFT` $\rightarrow$ `APPLIED` $\rightarrow$ `INTERVIEWING` $\rightarrow$ `OFFER`).
  * Click left arrow (`MoveLeft`) to move backwards.
  * Click **"Reject"** (`ArchiveX`) to mark as rejected. Records `rejectedFromStage` for analytics.

### 3. Inspect Conversion Funnel Analytics
* Scroll to the **Pipeline Conversion Analytics** section.
* The interactive Sankey diagram (`components/SankeyChart.tsx`) displays application volume, progression percentages, and drop-off rates at each stage.

### 4. Delete Application
* Click the trash icon (`Trash2`) on any application card.

---

## Expected Observable Result

* **Kanban Columns**: Card appears in the designated column (`Drafts`, `Applied`, `Interviewing`, `Offers`, `Archived / Rejected`).
* **Sankey Chart**: Dynamic SVG flow lines recalculate conversion and drop-off percentages in real time.
* **Storage Writes**: `localStorage.getItem('ascent_applications')` updates with the array of application records.

---

## Gotchas & Failure Modes

* **Empty Pipeline**: If no applications exist, the Sankey chart renders an informational empty state prompt.
* **External Link Sanity**: Application URLs without `http://` or `https://` prefix are automatically normalized.
