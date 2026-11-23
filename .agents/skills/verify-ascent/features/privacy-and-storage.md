# Feature: Privacy, Storage & FAQ

Privacy policies, AI data-usage guarantees, and client-side storage management with granular 1-click deletion.

* **Route**: `/faq`
* **Status**: `unverified: static code audit (no live server driven)`

---

## How to Reach

1. Click **Privacy & FAQ** in the desktop sidebar (`components/Sidebar.tsx`).
2. Or click the **Storage Manager** icon (`HardDrive`) in the top global header (`components/Header.tsx`).
3. Or click **Privacy & AI FAQ →** in the callout box on the home dashboard (`/`).

---

## How to Drive

### 1. Search FAQ Articles
* Type into the search input: `input[placeholder*="Search questions"]`.
* Click category filter buttons:
  * `"All"`
  * `"Privacy"`
  * `"AI Models"`
  * `"Data Storage"`
  * `"Features"`
  * `"Support"`
* Click any FAQ card header to expand or collapse the full explanation.

### 2. Inspect Storage Quota
* Click button labeled **"Manage Local Storage"** on the FAQ page, or click the `HardDrive` icon in the top header.
* The `StorageManagerModal` opens (`role="dialog"`).
* Review breakdown meters:
  * **Master Resume**: KB count.
  * **Tailored Resumes**: KB count and record count.
  * **Applications Pipeline**: KB count and application count.
  * **Interview History**: KB count and completed session count.
  * **Total Stored**: Aggregate byte usage against standard 5 MB browser quota.

### 3. Granular or Total Storage Deletion
* To clear a single category, click the trash icon next to that specific row (e.g. "Clear Tailored Resumes").
* To perform a total reset, click the destructive button labeled **"Wipe All Data"**.
* Confirm the confirmation modal.

---

## Expected Observable Result

* **Storage Recalculation**:
  * Meters immediately reset to `0.0 KB`.
  * Window event `ascent-storage-cleared` fires, updating all other views in real time.
* **Storage Eradication**:
  * Clears `ascent_master_resume`, `ascent_resume_name`, `ascent_tailored_resumes`, `ascent_applications`, `ascent_interview_session`, and `ascent_interview_history`.

---

## Gotchas & Failure Modes

* **Browser Privacy Mode**: In Private Browsing or Incognito mode, browser localStorage may have lower quotas or be wiped upon tab closure.
