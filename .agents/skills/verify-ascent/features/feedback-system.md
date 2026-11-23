# Feature: User Feedback System

In-app feedback modal dispatching user bug reports, feature suggestions, and general notes directly to admin email via Resend without exposing recipient credentials.

* **Route**: Global Modal (Accessible on any page)
* **Status**: `unverified: static code audit (no live server driven)`

---

## How to Reach

1. Click the **Feedback** icon (`MessageSquarePlus`) in the top global header (`components/Header.tsx`).
2. Or click the **Send Feedback** button on the FAQ page (`/faq`).

---

## How to Drive

### 1. Open Feedback Modal
* Click `button[title="Send feedback or report a bug"]` in the header.
* `FeedbackModal` opens (`role="dialog"`).

### 2. Configure & Type Submission
* **Select Feedback Type**: Click one of the three category buttons:
  * `"Bug Report"`
  * `"Feature Idea"`
  * `"General Feedback"`
* **Message**: Enter description in the `textarea` (must be non-empty).
* **Contact Email (Optional)**: Enter user email into `input[type="email"]`.

### 3. Submit
* Click button labeled **"Send Feedback"** (icon: `Send`).
* Sends `POST /api/feedback` payload:
  ```json
  {
    "feedbackType": "bug" | "feature" | "general",
    "message": "...",
    "userEmail": "user@example.com",
    "currentPage": "/radar",
    "appVersion": "0.2.1"
  }
  ```

---

## Expected Observable Result

* **Feedback Dispatch**:
  * Button shows sending state: `Sending...`.
  * Success screen renders: *"Thank you! Your feedback has been sent..."*.
  * Modal automatically dismisses after success confirmation.

---

## Gotchas & Failure Modes

* **Missing Resend Credentials**: If `RESEND_API_KEY` or `FEEDBACK_RECIPIENT_EMAIL` is missing in `.env`, the endpoint responds with HTTP 503: *"Feedback delivery is temporarily unavailable because RESEND_API_KEY is not configured yet"*.
* **Validation**: Submitting whitespace or empty messages is blocked with a client-side validation error.
