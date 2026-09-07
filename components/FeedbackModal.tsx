'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Check, 
  AlertCircle, 
  Bug, 
  Lightbulb, 
  MessageSquareQuote,
  Sparkles,
  Mail,
  ShieldCheck
} from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FeedbackType = 'bug' | 'feature' | 'general';

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setMessage('');
      setUserEmail('');
      setError('');
      setSuccess(false);
      setLoading(false);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please enter your feedback message.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackType,
          message: message.trim(),
          userEmail: userEmail.trim() || undefined,
          currentPage: typeof window !== 'undefined' ? window.location.pathname : 'App'
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit feedback. Please try again.');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred while sending feedback.');
    } finally {
      setLoading(false);
    }
  };

  const getPlaceholder = () => {
    switch (feedbackType) {
      case 'bug':
        return 'What went wrong? Describe what you were doing, what you expected, and what actually happened...';
      case 'feature':
        return 'What new feature, tool, or workflow would make your job search easier? Tell us your idea...';
      default:
        return 'Share your thoughts, suggestions, or general experience using Ascent...';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div 
        className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <MessageSquareQuote className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                <span>Share Feedback</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                  Ascent Beta
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Help us improve Ascent. Your feedback is sent directly to our team.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        {success ? (
          /* Success Screen */
          <div className="p-8 sm:p-10 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
              <Check className="h-8 w-8 stroke-[2.5]" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-xl font-bold text-slate-800">Thank You for Your Feedback!</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Your message has been delivered directly to our inbox. We review every note to guide our next feature updates.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold block">Unable to send feedback</span>
                  <span className="text-[11px] text-rose-700">{error}</span>
                </div>
              </div>
            )}

            {/* Category Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Feedback Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFeedbackType('general')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    feedbackType === 'general'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs font-bold ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <MessageSquareQuote className="h-3.5 w-3.5" />
                  <span>General</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFeedbackType('feature')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    feedbackType === 'feature'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-800 shadow-2xs font-bold ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  <span>Idea</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFeedbackType('bug')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    feedbackType === 'bug'
                      ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-2xs font-bold ring-2 ring-rose-500/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <Bug className="h-3.5 w-3.5" />
                  <span>Bug</span>
                </button>
              </div>
            </div>

            {/* Message Area */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Your Message <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {message.length} / 2000
                </span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
                rows={5}
                placeholder={getPlaceholder()}
                required
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-y leading-relaxed"
              />
            </div>

            {/* Optional Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Your Email Address</span>
                <span className="text-[11px] font-normal text-slate-400 lowercase">Optional (if you want a response)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-3.5 w-3.5" />
                </div>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Privacy Note */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="h-4 w-4 text-indigo-600 flex-shrink-0" />
              <span>
                Your feedback is private. No CV files or personal passwords are sent.
              </span>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Send Feedback</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
