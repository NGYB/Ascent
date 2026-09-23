'use client';

import { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  HelpCircle, 
  ChevronDown, 
  HardDrive, 
  Search,
  MessageSquare,
  EyeOff,
  X,
  Coffee,
  HeartHandshake,
  ExternalLink
} from 'lucide-react';
import StorageManagerModal from '@/components/StorageManagerModal';
import FeedbackModal from '@/components/FeedbackModal';

interface FAQItem {
  id: string;
  category: 'privacy' | 'ai' | 'storage' | 'features' | 'support';
  question: string;
  shortAnswer: string;
  keywords: string[];
  fullAnswer: React.ReactNode;
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'privacy' | 'ai' | 'storage' | 'features' | 'support'>('all');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'gemini-memory': true,
    'gemini-training': true,
    'support-me': true
  });
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const faqs: FAQItem[] = useMemo(() => [
    {
      id: 'gemini-memory',
      category: 'privacy',
      question: 'Can the developer retrieve my CV details from Gemini using their API key?',
      shortAnswer: 'No, absolutely not. The Gemini API is 100% stateless with zero prompt history.',
      keywords: [
        'gemini memory',
        'gemini',
        'memory',
        'retrieve',
        'developer',
        'api key',
        'prompt history',
        'retrieval',
        'stateless',
        'database',
        'access',
        'see my cv',
        'read my cv',
        'snoop'
      ],
      fullAnswer: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>
            <strong>No, absolutely not.</strong> Neither the developer nor anyone else can retrieve or view your past CV details from Gemini. Here is why:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li>
              <strong>The Gemini API is completely stateless:</strong> Unlike the consumer ChatGPT or Gemini chat web apps (which have a conversation history sidebar), the developer API has no &ldquo;inbox&rdquo;, prompt history, or persistent memory. Each tailoring request is an isolated, independent computation. Once the AI generates your tailored CV, the session memory is immediately destroyed.
            </li>
            <li>
              <strong>No prompt history endpoint exists:</strong> Google AI Studio and the Gemini SDK do not provide any dashboard or API endpoint where an API key holder can view, download, or query past prompts.
            </li>
            <li>
              <strong>No server database:</strong> Ascent&rsquo;s backend server acts solely as a transient pass-through proxy. It receives your CV text in memory for a few seconds to call Gemini, returns the tailored response to your browser, and discards it. Your CV is <em>never</em> written to a database, log file, or cloud disk.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'gemini-training',
      category: 'ai',
      question: 'Does Google Gemini \u201Cremember\u201D my CV or train its AI models on it?',
      shortAnswer: 'No. API calls are stateless and enterprise API terms prohibit model training on customer data.',
      keywords: [
        'gemini training',
        'training',
        'train',
        'gemini',
        'ai models',
        'learning',
        'google',
        'privacy',
        'commercial',
        'data logging',
        'human review',
        'retention'
      ],
      fullAnswer: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>
            When you use Ascent, Google Gemini evaluates your CV in temporary RAM strictly to fulfill the specific prompt (e.g. ATS scoring, JD deflator analysis, or mock interview questions) and returns the output.
          </p>
          <p>
            Under Google&rsquo;s commercial and developer terms for paid/pay-as-you-go API services, <strong>Google does not use Customer Data (your prompts and responses) to train or improve Gemini models</strong>, nor is customer data sampled for human review.
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <span className="font-bold text-slate-800">Key takeaway:</span>
            <p className="text-slate-600">
              Gemini does not build a profile on you, does not &ldquo;remember&rdquo; your name or past positions across queries, and does not incorporate your resume into its global training weights.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'local-storage',
      category: 'storage',
      question: 'Where is my resume, tailored versions, and job pipeline actually stored?',
      shortAnswer: '100% inside your own device\u2019s browser via localStorage. Nothing is stored in the cloud.',
      keywords: [
        'local storage',
        'localstorage',
        'where is cv stored',
        'where is data stored',
        'storage',
        'cloud',
        'device',
        'offline',
        'browser',
        'database',
        'server'
      ],
      fullAnswer: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>
            All of your personal data lives strictly inside your browser&rsquo;s <strong><code>localStorage</code></strong>. This includes:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>Your uploaded Master CV text</li>
            <li>Your saved Tailored CVs and ATS scorecards</li>
            <li>Your Mock Interview questions and practice transcripts</li>
            <li>Your Kanban Job Tracker pipeline</li>
            <li>Your Smart Job Radar search preferences</li>
          </ul>
          <p>
            Because this data never leaves your browser, if you open Ascent in a private/incognito window or on a different device, your data will not appear there. You own and control 100% of your data.
          </p>
        </div>
      )
    },
    {
      id: 'other-users',
      category: 'privacy',
      question: 'Can other users on Ascent see my CV or job applications?',
      shortAnswer: 'No. Each user\u2019s browser storage is completely sandboxed and private.',
      keywords: [
        'other users',
        'see my cv',
        'view my cv',
        'leak',
        'share',
        'sandbox',
        'isolation',
        'privacy',
        'cross user'
      ],
      fullAnswer: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>
            <strong>No.</strong> Because Ascent does not use a shared centralized database or cloud file storage for user resumes, there is no shared repository. 
          </p>
          <p>
            Web browser security policies enforce a strict &ldquo;Same-Origin&rdquo; sandbox. The <code>localStorage</code> on your laptop or phone can only be accessed by your physical browser session. No other user can query or inspect your records.
          </p>
        </div>
      )
    },
    {
      id: 'delete-data',
      category: 'storage',
      question: 'How do I inspect or permanently delete all my data?',
      shortAnswer: 'Click "Storage" in the top header anytime to inspect byte sizes or wipe data with 1 click.',
      keywords: [
        'delete data',
        'delete',
        'data',
        'wipe',
        'reset',
        'clear',
        'purge',
        'storage manager',
        'remove',
        'erase',
        'all data'
      ],
      fullAnswer: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>
            You have full self-service control over your data at any moment:
          </p>
          <ol className="list-decimal pl-5 space-y-1 text-slate-600">
            <li>Click the <strong>Storage</strong> button in the top navigation header (or use the button below).</li>
            <li>Inspect the exact byte size and item count stored for each category.</li>
            <li>Click the red trash icon next to any individual module to clear just that category (e.g. clearing Radar cache while keeping your Master CV).</li>
            <li>Or click <strong>&ldquo;Reset All Ascent Data&rdquo;</strong> to instantly wipe every trace of Ascent data from your device.</li>
          </ol>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsStorageModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <HardDrive className="h-3.5 w-3.5" />
              <span>Open Storage Manager Now</span>
            </button>
          </div>
        </div>
      )
    },
    {
      id: 'no-login',
      category: 'privacy',
      question: 'Why doesn\u2019t Ascent require an account, email, or password?',
      shortAnswer: 'Designed intentionally for confidentiality during sensitive mid-career job transitions.',
      keywords: [
        'no login',
        'why no login',
        'login',
        'account',
        'sign in',
        'signup',
        'password',
        'email',
        'why no account',
        'confidentiality',
        'anonymous'
      ],
      fullAnswer: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>
            Career transitions—especially for currently employed professionals—are sensitive and require utmost confidentiality.
          </p>
          <p>
            By adopting a <strong>zero-footprint, account-free architecture</strong>:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>We do not collect your real name, email address, password, or employer details.</li>
            <li>There are no user accounts that could ever be compromised in a credential leak.</li>
            <li>You can research, tailor, and prepare for new roles without leaving a trace on external servers.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'pdf-security',
      category: 'features',
      question: 'How does client-side PDF parsing protect my CV?',
      shortAnswer: 'PDF text extraction happens entirely inside your browser, never uploading the file to S3 or cloud buckets.',
      keywords: [
        'pdf security',
        'pdf',
        'upload',
        'parsing',
        's3',
        'bucket',
        'extract',
        'file',
        'client side',
        'document'
      ],
      fullAnswer: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>
            When you upload a CV in the CV Workspace:
          </p>
          <p>
            The PDF document is decoded and parsed <strong>locally inside your browser</strong> using client-side JavaScript. Your original <code>.pdf</code> or document file is never uploaded to an Amazon S3, Google Cloud Storage, or external file bucket.
          </p>
          <p>
            Only the extracted plain text is saved into your local browser storage for tailoring.
          </p>
        </div>
      )
    },
    {
      id: 'radar-privacy',
      category: 'features',
      question: 'Does the Smart Job Radar track or expose my job searches?',
      shortAnswer: 'No. Searches query public Google Jobs listings in real-time without user tracking.',
      keywords: [
        'radar privacy',
        'radar',
        'job radar',
        'search',
        'jobs',
        'tracking',
        'anonymous',
        'google jobs',
        'serpapi',
        'job search'
      ],
      fullAnswer: (
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>
            When you search for roles in the Smart Job Radar:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>Ascent queries live, public Google Jobs postings via SerpApi based strictly on the job title and location you type.</li>
            <li>Your search history and cached job opportunities are kept in your browser&rsquo;s local <code>sessionStorage</code> and <code>localStorage</code>.</li>
            <li>Your searches are never linked to your personal identity, resume, or employer on any remote server.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'support-me',
      category: 'support',
      question: 'How can I support you and the Ascent project?',
      shortAnswer: 'Buy me a coffee or share your story through feedback—I would love to meet for coffee!',
      keywords: [
        'how to support me',
        'support',
        'support me',
        'how to support',
        'buy me a coffee',
        'buymeacoffee',
        'coffee',
        'donate',
        'donation',
        'contribution',
        'share feedback',
        'feedback',
        'story',
        'meet for coffee',
        'meet'
      ],
      fullAnswer: (
        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <p>
            Ascent was built as a passion project to help mid-career professionals navigate career transitions with confidence and zero privacy compromises. If Ascent has helped you in your journey, there are 2 wonderful ways you can support me:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Option 1: Buy me a coffee */}
            <div className="p-4 sm:p-5 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-3.5 flex flex-col justify-between shadow-2xs">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                  <Coffee className="h-4 w-4 text-amber-600" />
                  <span>Option 1: Buy Me a Coffee</span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">Fuel Development & API Costs</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Support the project directly to help cover Gemini AI compute and server infrastructure, keeping Ascent free and accessible for all job seekers.
                </p>
              </div>

              <a
                href="https://buymeacoffee.com/ngyibin"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all shadow-xs group cursor-pointer"
              >
                <Coffee className="h-4 w-4" />
                <span>buymeacoffee.com/ngyibin</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>

            {/* Option 2: Share Feedback & Meet for Coffee */}
            <div className="p-4 sm:p-5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl space-y-3.5 flex flex-col justify-between shadow-2xs">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs uppercase tracking-wider">
                  <HeartHandshake className="h-4 w-4 text-indigo-600" />
                  <span>Option 2: Share Your Story</span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">Send Feedback & Connect</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Go to <strong>Share Feedback</strong> and send me a message on how the app has helped you. I would love to meet you for coffee and hear all about your story!
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsFeedbackModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Open Share Feedback</span>
              </button>
            </div>
          </div>
        </div>
      )
    }
  ], []);

  // Smart tokenized search matching with punctuation normalization
  const searchTerms = useMemo(() => {
    return searchQuery
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(Boolean);
  }, [searchQuery]);

  const matchesSearch = (item: FAQItem) => {
    if (searchTerms.length === 0) return true;
    const rawCorpus = [
      item.question,
      item.shortAnswer,
      item.category,
      item.id.replace(/-/g, ' '),
      ...(item.keywords || [])
    ].join(' ');

    const normalizedCorpus = rawCorpus
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ');

    return searchTerms.every(term => normalizedCorpus.includes(term));
  };

  const filteredFaqs = faqs.filter(item => {
    const inCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return inCategory && matchesSearch(item);
  });

  // Count matches across ALL categories for helpful UI guidance
  const totalMatchesAcrossAll = useMemo(() => {
    if (searchTerms.length === 0) return faqs.length;
    return faqs.filter(matchesSearch).length;
  }, [faqs, searchTerms]);

  const popularChips = [
    'Gemini memory',
    'How to support me',
    'Delete data',
    'Local storage',
    'Why no login',
    'Google training',
    'Radar privacy'
  ];

  return (
    <div className="max-w-4xl w-full mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
            <span>Privacy & AI Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Ascent is engineered from the ground up with a privacy-first, zero-knowledge architecture. Here is transparently how your data and AI processing work.
          </p>
        </div>
      </div>

      {/* 3 Core Trust Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Lock className="h-5 w-5" />
          </div>
          <h2 className="font-bold text-slate-800 text-sm">Stateless AI Calls</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Gemini processes prompts in-memory and immediately frees context. There is no prompt history or memory archive accessible to API key holders.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <HardDrive className="h-5 w-5" />
          </div>
          <h2 className="font-bold text-slate-800 text-sm">100% Local Storage</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your master resume, tailored CV versions, and Kanban applications live exclusively in your device&rsquo;s browser sandbox.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="h-10 w-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <EyeOff className="h-5 w-5" />
          </div>
          <h2 className="font-bold text-slate-800 text-sm">Zero Server Database</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            We operate no cloud database storing user resumes, accounts, or tracking data. No login is required.
          </p>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions (e.g., 'Gemini memory', 'delete data', 'storage')..."
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500 pt-0.5">
          <span className="font-medium text-slate-400">Try searching:</span>
          {popularChips.map(chip => (
            <button
              key={chip}
              type="button"
              onClick={() => {
                setSearchQuery(chip);
                setSelectedCategory('all');
              }}
              className="px-2.5 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-full border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs pt-1">
          {[
            { id: 'all', label: 'All Questions' },
            { id: 'support', label: 'Support Me ☕' },
            { id: 'privacy', label: 'Privacy & Security' },
            { id: 'ai', label: 'AI & Gemini' },
            { id: 'storage', label: 'Local Storage' },
            { id: 'features', label: 'Features & Radar' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                selectedCategory === tab.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-6 space-y-3">
            <HelpCircle className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              No questions found for &ldquo;{searchQuery}&rdquo; {selectedCategory !== 'all' && `in this category`}.
            </p>
            {selectedCategory !== 'all' && totalMatchesAcrossAll > 0 ? (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                >
                  View {totalMatchesAcrossAll} matching {totalMatchesAcrossAll === 1 ? 'question' : 'questions'} across All Categories
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Try one of the suggested search tags above or view all questions.</p>
            )}
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            // Auto-expand when actively searching so the answer is immediately visible!
            const isOpen = searchTerms.length > 0 ? true : Boolean(openItems[faq.id]);
            return (
              <div 
                key={faq.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl overflow-hidden transition-all shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(faq.id)}
                  className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer select-none"
                  aria-expanded={isOpen}
                >
                  <div className="space-y-1">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>{faq.question}</span>
                    </h2>
                    {!isOpen && (
                      <p className="text-xs text-slate-500 line-clamp-1">{faq.shortAnswer}</p>
                    )}
                  </div>
                  <div className={`p-1.5 rounded-lg bg-slate-50 text-slate-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180 text-indigo-600 bg-indigo-50' : ''}`}>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 border-t border-slate-100 pt-4 animate-in fade-in duration-150">
                    {faq.fullAnswer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Action / Help Footer */}
      <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-sm font-bold text-slate-900">Still have a question or concern?</h2>
          <p className="text-xs text-slate-600">
            You can manage your stored data or send our team feedback directly.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsStorageModalOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
          >
            <HardDrive className="h-3.5 w-3.5 text-slate-500" />
            <span>Manage Storage</span>
          </button>
          <button
            type="button"
            onClick={() => setIsFeedbackModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Send Feedback</span>
          </button>
        </div>
      </div>

      <StorageManagerModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
      />

      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </div>
  );
}
