/**
 * Blocklist of known fraudulent, phishing, or scam job boards,
 * spam scrapers, and ghost job networks that harvest user data.
 */
export const BLOCKED_JOB_PROVIDERS = [
  'trabajo.org',
] as const;

export interface JobFilterCandidate {
  title?: string;
  company_name?: string;
  company?: string;
  via?: string;
  description?: string;
  applyLink?: string;
  apply_options?: Array<{ title?: string; link?: string }>;
  related_links?: Array<{ link?: string; text?: string }>;
}

/**
 * Checks whether a job posting originates from, links to, or represents
 * a blocked scam / data-harvesting company or aggregator.
 */
export function isBlockedJob(job: JobFilterCandidate | null | undefined): boolean {
  if (!job) return false;

  const company = (job.company || job.company_name || '').toLowerCase().trim();
  const via = (job.via || '').toLowerCase().trim();
  const title = (job.title || '').toLowerCase().trim();
  const desc = (job.description || '').toLowerCase();
  const applyLink = (job.applyLink || '').toLowerCase().trim();

  for (const blocked of BLOCKED_JOB_PROVIDERS) {
    // 1. Company name matches or contains blocked domain (e.g. "trabajo.org", "Trabajo.org", "trabajo")
    if (company.includes(blocked) || company === 'trabajo') {
      return true;
    }
    // 2. Aggregator label (e.g. "via trabajo.org", "via Trabajo.org")
    if (via.includes(blocked)) {
      return true;
    }
    // 3. Primary apply URL points to or contains the blocked domain
    if (applyLink.includes(blocked)) {
      return true;
    }
    // 4. Any apply option link in Google Jobs contains the blocked domain
    if (job.apply_options?.some(opt => (opt.link || '').toLowerCase().includes(blocked))) {
      return true;
    }
    // 5. Any related link points to the blocked domain
    if (job.related_links?.some(rel => (rel.link || '').toLowerCase().includes(blocked))) {
      return true;
    }
    // 6. Title or description explicitly mentions or redirects to the scam site
    if (title.includes(blocked) || desc.includes(blocked)) {
      return true;
    }
  }

  return false;
}
