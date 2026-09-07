'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, 
  Sparkles, 
  HelpCircle, 
  ChevronRight, 
  Send, 
  Check,
  CheckCircle, 
  Award, 
  AlertTriangle, 
  BookOpen, 
  ArrowRight, 
  BrainCircuit, 
  Lightbulb,
  Copy,
  RotateCcw,
  Clock,
  Trash2,
  History,
  Eye,
  HardDrive
} from 'lucide-react';

interface TailoredResumeItem {
  id: string;
  jobTitle: string;
  company: string;
  jobDescription?: string;
  tailoredResume: string;
  atsAnalysis: any;
  createdAt: string;
}

interface Question {
  id: string;
  text: string;
  category: 'behavioral' | 'technical';
  hint: string;
}

interface Feedback {
  score: number;
  strengths: string[];
  improvements: string[];
  suggestedAnswer: string;
}

interface InterviewSession {
  id: string;
  selectedResumeId: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
  questions: Question[];
  currentIndex: number;
  feedbacks: Record<string, Feedback>;
  userAnswers: Record<string, string>;
  started: boolean;
  isDone: boolean;
  updatedAt: string;
}

interface CompletedInterviewSession {
  id: string;
  jobTitle: string;
  company: string;
  completedAt: string;
  totalQuestions: number;
  averageScore: number;
  feedbacks: Record<string, Feedback>;
  questions: Question[];
  userAnswers: Record<string, string>;
}

export default function InterviewPage() {
  const [tailoredList, setTailoredList] = useState<TailoredResumeItem[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Interview state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);
  
  // Feedback log
  const [feedbacks, setFeedbacks] = useState<Record<string, Feedback>>({});
  const [isDone, setIsDone] = useState(false);

  // Persistence state
  const [savedSession, setSavedSession] = useState<InterviewSession | null>(null);
  const [pastSessions, setPastSessions] = useState<CompletedInterviewSession[]>([]);
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const [sessionSavedNotice, setSessionSavedNotice] = useState(false);

  const loadStoredData = () => {
    try {
      // 1. Load tailored resumes from localStorage
      const list: TailoredResumeItem[] = JSON.parse(localStorage.getItem('ascent_tailored_resumes') || '[]');
      setTailoredList(list);
      if (list.length > 0) {
        setSelectedResumeId(prev => prev || list[0].id);
      } else {
        setSelectedResumeId('');
      }

      // 2. Load ongoing session if exists
      const saved = localStorage.getItem('ascent_interview_session');
      if (saved) {
        const parsed: InterviewSession = JSON.parse(saved);
        if (parsed && parsed.questions && parsed.questions.length > 0) {
          setSavedSession(parsed);
        } else {
          setSavedSession(null);
        }
      } else {
        setSavedSession(null);
      }

      // 3. Load completed session history
      const history: CompletedInterviewSession[] = JSON.parse(localStorage.getItem('ascent_interview_history') || '[]');
      setPastSessions(history);
    } catch (err) {
      console.error('Error loading stored interview data:', err);
    }
  };

  useEffect(() => {
    loadStoredData();
    window.addEventListener('ascent-storage-cleared', loadStoredData);
    return () => window.removeEventListener('ascent-storage-cleared', loadStoredData);
  }, []);

  // Sync jobDescription with the selected profile
  useEffect(() => {
    const selected = tailoredList.find(r => r.id === selectedResumeId);
    if (selected) {
      setJobDescription(selected.jobDescription || '');
    }
  }, [selectedResumeId, tailoredList]);

  // Helper to persist current session state to localStorage
  const saveSessionState = (updatedFields: Partial<InterviewSession>) => {
    try {
      const selected = tailoredList.find(r => r.id === (updatedFields.selectedResumeId || selectedResumeId));
      const updatedSession: InterviewSession = {
        id: savedSession?.id || crypto.randomUUID(),
        selectedResumeId: updatedFields.selectedResumeId || selectedResumeId,
        jobTitle: updatedFields.jobTitle || selected?.jobTitle || savedSession?.jobTitle || 'Target Role',
        company: updatedFields.company || selected?.company || savedSession?.company || 'Target Company',
        jobDescription: updatedFields.jobDescription !== undefined ? updatedFields.jobDescription : (jobDescription || savedSession?.jobDescription || ''),
        questions: updatedFields.questions || questions,
        currentIndex: updatedFields.currentIndex !== undefined ? updatedFields.currentIndex : currentIndex,
        feedbacks: updatedFields.feedbacks || feedbacks,
        userAnswers: updatedFields.userAnswers || userAnswers,
        started: updatedFields.started !== undefined ? updatedFields.started : started,
        isDone: updatedFields.isDone !== undefined ? updatedFields.isDone : isDone,
        updatedAt: new Date().toISOString(),
        ...updatedFields
      };

      localStorage.setItem('ascent_interview_session', JSON.stringify(updatedSession));
      setSavedSession(updatedSession);
      setSessionSavedNotice(true);
      setTimeout(() => setSessionSavedNotice(false), 2200);
    } catch (err) {
      console.error('Failed to save session state:', err);
    }
  };

  const handleStartInterview = async () => {
    setError('');
    
    let resumeText = '';
    let targetJobDesc = '';

    if (selectedResumeId) {
      const selected = tailoredList.find(r => r.id === selectedResumeId);
      if (selected) {
        resumeText = selected.tailoredResume;
        targetJobDesc = jobDescription || 'General Job Position matching CV';
      }
    } else {
      setError('Please select a tailored CV to prepare for.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/interview/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tailoredResumeText: resumeText, jobDescription: targetJobDesc }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to generate questions');
      }

      const data = await res.json();
      const newQuestions: Question[] = data.questions || [];

      setQuestions(newQuestions);
      setCurrentIndex(0);
      setFeedbacks({});
      setUserAnswers({});
      setUserAnswer('');
      setStarted(true);
      setIsDone(false);

      const selected = tailoredList.find(r => r.id === selectedResumeId);
      saveSessionState({
        id: crypto.randomUUID(),
        selectedResumeId,
        jobTitle: selected?.jobTitle || 'Target Role',
        company: selected?.company || 'Target Company',
        jobDescription: targetJobDesc,
        questions: newQuestions,
        currentIndex: 0,
        feedbacks: {},
        userAnswers: {},
        started: true,
        isDone: false
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to start interview prep. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSession = (sessionToResume?: InterviewSession) => {
    const session = sessionToResume || savedSession;
    if (!session || !session.questions || session.questions.length === 0) return;

    setQuestions(session.questions);
    setCurrentIndex(session.currentIndex || 0);
    setFeedbacks(session.feedbacks || {});
    setUserAnswers(session.userAnswers || {});
    setSelectedResumeId(session.selectedResumeId || '');
    setJobDescription(session.jobDescription || '');
    setStarted(true);
    setIsDone(session.isDone || false);

    const activeQId = session.questions[session.currentIndex || 0]?.id;
    setUserAnswer(session.userAnswers?.[activeQId] || '');
    setShowHint(false);
  };

  const handleClearSavedSession = () => {
    if (confirm('Are you sure you want to discard this in-progress session? Your saved feedback will be cleared.')) {
      localStorage.removeItem('ascent_interview_session');
      setSavedSession(null);
      setStarted(false);
      setIsDone(false);
      setQuestions([]);
      setCurrentIndex(0);
      setFeedbacks({});
      setUserAnswers({});
      setUserAnswer('');
    }
  };

  const handlePauseAndExit = () => {
    // Save current draft before pausing
    const currentQ = questions[currentIndex];
    let updatedAnswers = userAnswers;
    if (currentQ && userAnswer) {
      updatedAnswers = { ...userAnswers, [currentQ.id]: userAnswer };
      setUserAnswers(updatedAnswers);
    }
    saveSessionState({ userAnswers: updatedAnswers, started: false });
    setStarted(false);
  };

  const handleSelectQuestion = (idx: number) => {
    if (idx === currentIndex) return;

    // Save draft for current question if typed
    const currentQ = questions[currentIndex];
    let updatedAnswers = userAnswers;
    if (currentQ && userAnswer && !feedbacks[currentQ.id]) {
      updatedAnswers = { ...userAnswers, [currentQ.id]: userAnswer };
      setUserAnswers(updatedAnswers);
    }

    setCurrentIndex(idx);
    const targetQ = questions[idx];
    setUserAnswer(updatedAnswers[targetQ?.id] || '');
    setShowHint(false);

    saveSessionState({
      currentIndex: idx,
      userAnswers: updatedAnswers
    });
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) return;

    setSubmittingAnswer(true);
    setError('');

    const question = questions[currentIndex];
    const selected = tailoredList.find(r => r.id === selectedResumeId);
    const resumeText = selected?.tailoredResume || '';
    const targetJobDesc = jobDescription || 'General Job Position';

    try {
      const res = await fetch('/api/interview/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: question.text, 
          userAnswer, 
          jobDescription: targetJobDesc,
          tailoredResumeText: resumeText
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit answer');
      }

      const data: Feedback = await res.json();
      
      const updatedFeedbacks = {
        ...feedbacks,
        [question.id]: data
      };
      const updatedAnswers = {
        ...userAnswers,
        [question.id]: userAnswer
      };

      setFeedbacks(updatedFeedbacks);
      setUserAnswers(updatedAnswers);

      saveSessionState({
        feedbacks: updatedFeedbacks,
        userAnswers: updatedAnswers
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to score answer. Please try again.');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleNext = () => {
    setShowHint(false);
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      const nextQ = questions[nextIdx];
      setUserAnswer(userAnswers[nextQ?.id] || '');
      saveSessionState({ currentIndex: nextIdx });
    } else {
      setIsDone(true);
      saveSessionState({ isDone: true });

      // Save to completed history
      try {
        const history: CompletedInterviewSession[] = JSON.parse(localStorage.getItem('ascent_interview_history') || '[]');
        const selected = tailoredList.find(r => r.id === selectedResumeId);
        const scores = Object.values(feedbacks).map(f => f.score);
        const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

        const newHistoryItem: CompletedInterviewSession = {
          id: savedSession?.id || crypto.randomUUID(),
          jobTitle: selected?.jobTitle || savedSession?.jobTitle || 'Target Role',
          company: selected?.company || savedSession?.company || 'Target Company',
          completedAt: new Date().toISOString(),
          totalQuestions: questions.length,
          averageScore: avg,
          feedbacks,
          questions,
          userAnswers
        };

        const updatedHistory = [newHistoryItem, ...history.filter(h => h.id !== newHistoryItem.id)].slice(0, 10);
        localStorage.setItem('ascent_interview_history', JSON.stringify(updatedHistory));
        setPastSessions(updatedHistory);
      } catch (err) {
        console.error('Failed to save to interview history:', err);
      }
    }
  };

  const handleRestart = () => {
    localStorage.removeItem('ascent_interview_session');
    setSavedSession(null);
    setStarted(false);
    setIsDone(false);
    setQuestions([]);
    setCurrentIndex(0);
    setFeedbacks({});
    setUserAnswers({});
    setUserAnswer('');
  };

  const handleCopyAnswer = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedAnswer(true);
    setTimeout(() => setCopiedAnswer(false), 2000);
  };

  // Compute average score
  const getAverageScore = () => {
    const scores = Object.values(feedbacks).map(f => f.score);
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  return (
    <div className="max-w-5xl w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              Mock Interview Room
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              STAR Evaluation & AI Coach
            </span>
          </div>
          <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
            Practice role-specific interview answers tailored to your target application. Automatically saved to your session so you can pause and revisit anytime.
          </p>
        </div>

        {started && (
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {sessionSavedNotice ? (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 inline-flex items-center gap-1.5 shadow-2xs animate-in fade-in">
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>Progress Saved</span>
              </span>
            ) : (
              <span className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>Auto-saved</span>
              </span>
            )}
            <button
              type="button"
              onClick={handlePauseAndExit}
              className="text-xs font-semibold text-slate-700 hover:text-indigo-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              Save & Exit
            </button>
          </div>
        )}
      </div>

      {!started ? (
        /* Configuration Screen */
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* Resume Ongoing Session Banner (if saved session exists) */}
          {savedSession && savedSession.questions && savedSession.questions.length > 0 && (
            <div className="bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/60 p-5 rounded-2xl border border-indigo-200/80 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
                      {savedSession.isDone ? 'Completed Prep Session' : 'Session in Progress'}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      Saved {new Date(savedSession.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-base sm:text-lg">
                    {savedSession.jobTitle} {savedSession.company ? `at ${savedSession.company}` : ''}
                  </h4>
                  <p className="text-xs text-slate-600 flex items-center gap-2">
                    <span>
                      <strong>{Object.keys(savedSession.feedbacks || {}).length}</strong> of <strong>{savedSession.questions.length}</strong> questions answered
                    </span>
                    {Object.keys(savedSession.feedbacks || {}).length > 0 && (
                      <span className="font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded">
                        Avg Score: {Math.round(Object.values(savedSession.feedbacks).map(f => f.score).reduce((a, b) => a + b, 0) / Object.keys(savedSession.feedbacks).length)}%
                      </span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearSavedSession}
                  title="Discard saved session"
                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleResumeSession()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>{savedSession.isDone ? 'Review Session Answers' : 'Resume Interview Room'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearSavedSession}
                  className="px-3.5 py-2.5 text-slate-600 hover:text-slate-900 text-xs font-semibold hover:bg-white/80 rounded-lg transition-colors cursor-pointer"
                >
                  Start Fresh
                </button>
              </div>
            </div>
          )}

          {/* New Session Configuration Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span>Configure New Mock Interview</span>
            </h3>

            {tailoredList.length === 0 ? (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-sm space-y-3">
                <p className="font-semibold">No tailored CVs found.</p>
                <p>You need to generate a tailored CV version first so the mock interview questions can be customized to your specific role and achievements.</p>
                <Link href="/tailor" className="inline-flex items-center gap-1 font-bold underline mt-1">
                  <span>Go Tailor CV</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Select Target Profile</label>
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    {tailoredList.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.jobTitle} - {item.company} ({new Date(item.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Associated Job Description</span>
                  <p className="text-xs text-slate-600 font-mono line-clamp-3 leading-relaxed mt-1 whitespace-pre-wrap">
                    {jobDescription || 'No job description text was saved with this tailored version.'}
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-lg border border-rose-100">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleStartInterview}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Generating Custom Questions with AI...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate & Start Mock Interview</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Past Completed Sessions Drawer */}
          {pastSessions.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <History className="h-4 w-4 text-indigo-600" />
                  <span>Previous Practice Sessions ({pastSessions.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Delete all past completed interview sessions? This action cannot be undone.')) {
                      localStorage.removeItem('ascent_interview_history');
                      setPastSessions([]);
                    }
                  }}
                  className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Clear past practice history"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Clear All History</span>
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {pastSessions.map((session) => (
                  <div key={session.id} className="py-3 flex items-center justify-between gap-3 first:pt-1 last:pb-1">
                    <div className="space-y-0.5">
                      <div className="text-sm font-bold text-slate-800">
                        {session.jobTitle} {session.company ? `at ${session.company}` : ''}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span>{new Date(session.completedAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="font-semibold text-indigo-600">Average: {session.averageScore}%</span>
                        <span>•</span>
                        <span>{session.totalQuestions} questions</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleResumeSession({
                          id: session.id,
                          selectedResumeId: '',
                          jobTitle: session.jobTitle,
                          company: session.company,
                          jobDescription: '',
                          questions: session.questions,
                          currentIndex: 0,
                          feedbacks: session.feedbacks,
                          userAnswers: session.userAnswers,
                          started: true,
                          isDone: true,
                          updatedAt: session.completedAt
                        })}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Review</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete this session for ${session.jobTitle}?`)) {
                            const updated = pastSessions.filter(s => s.id !== session.id);
                            localStorage.setItem('ascent_interview_history', JSON.stringify(updated));
                            setPastSessions(updated);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete this session"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Local Storage Quick Control Bar */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-2 py-1">
            <span className="flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5 text-slate-400" />
              <span>Interview data is kept in your private browser storage</span>
            </span>
            {(savedSession || pastSessions.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Delete all active and past interview prep data from this browser?')) {
                    localStorage.removeItem('ascent_interview_session');
                    localStorage.removeItem('ascent_interview_history');
                    setSavedSession(null);
                    setPastSessions([]);
                    setStarted(false);
                    setIsDone(false);
                    setQuestions([]);
                    setCurrentIndex(0);
                    setFeedbacks({});
                    setUserAnswers({});
                    setUserAnswer('');
                  }
                }}
                className="font-semibold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer underline"
              >
                Clear Interview Storage
              </button>
            )}
          </div>
        </div>
      ) : isDone ? (
        /* Final Scorecard Screen */
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto text-center space-y-6">
          <div className="mx-auto h-20 w-20 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Award className="h-12 w-12 stroke-[1.5]" />
          </div>

          <div className="space-y-2">
            <h3 className="text-3xl font-black text-slate-800">Prep Session Complete!</h3>
            <p className="text-slate-500 text-sm">
              Great job practicing. Consistent preparation builds muscle memory and interview confidence. All questions and exemplar responses are saved in your session history.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center max-w-xs mx-auto">
            <span className="text-5xl font-black text-slate-800">{getAverageScore()}</span>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-1">Average Score</span>
          </div>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setIsDone(false);
                setCurrentIndex(0);
                const q0 = questions[0];
                setUserAnswer(userAnswers[q0?.id] || '');
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer shadow-sm flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              <span>Review All Questions & Feedback</span>
            </button>
            <button
              type="button"
              onClick={handleRestart}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
            >
              Start New Session
            </button>
          </div>
        </div>
      ) : (
        /* Active Interview Screen */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Progress / Sidebar */}
          <div className="lg:col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4 h-fit">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Question List</h4>
              <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {Object.keys(feedbacks).length}/{questions.length} done
              </span>
            </div>

            <div className="space-y-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = !!feedbacks[q.id];
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleSelectQuestion(idx)}
                    className={`w-full p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2.5 text-left transition-all cursor-pointer ${
                      isCurrent
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold ring-1 ring-indigo-500/20 shadow-xs'
                        : isAnswered
                        ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100/80'
                        : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200 hover:text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${
                        isAnswered ? 'bg-emerald-500' : isCurrent ? 'bg-indigo-600 animate-pulse' : 'bg-slate-300'
                      }`} />
                      <span className="truncate">Q{idx + 1}: {q.category === 'behavioral' ? 'Behavioral' : 'Technical'}</span>
                    </div>
                    {isAnswered && (
                      <span className="font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px] border border-indigo-100 flex-shrink-0">
                        {feedbacks[q.id].score}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <button
                type="button"
                onClick={handlePauseAndExit}
                className="w-full text-xs font-semibold text-slate-700 hover:text-indigo-700 bg-slate-50 hover:bg-slate-100 p-2 rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>Save & Pause Session</span>
              </button>
              <button
                type="button"
                onClick={handleRestart}
                className="w-full text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-2 rounded-lg border border-rose-200 transition-colors cursor-pointer"
              >
                Quit / Discard Session
              </button>
            </div>
          </div>

          {/* Active Question Simulator */}
          <div className="lg:col-span-3 space-y-6">
            {/* Question Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md bg-indigo-100 text-indigo-800">
                  {questions[currentIndex].category} Question
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  Question {currentIndex + 1} of {questions.length}
                </span>
              </div>

              <h3 className="text-lg font-extrabold text-slate-800 leading-snug">
                {questions[currentIndex].text}
              </h3>

              {/* Hint accordion */}
              <div className="border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
                >
                  <Lightbulb className="h-4 w-4" />
                  <span>{showHint ? 'Hide Recruiter Tip' : 'Show Recruiter Tip'}</span>
                </button>
                {showHint && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2 leading-relaxed italic">
                    {questions[currentIndex].hint}
                  </p>
                )}
              </div>
            </div>

            {/* Answer Input or Feedback display */}
            {feedbacks[questions[currentIndex].id] ? (
              /* Answer Feedback Card */
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
                <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-indigo-500" />
                      <span>AI Feedback Report</span>
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-medium">Evaluation Score:</span>
                      <div className="px-3 py-1 rounded-md bg-indigo-600 text-white font-black text-sm shadow-xs">
                        {feedbacks[questions[currentIndex].id].score} / 100
                      </div>
                    </div>
                  </div>

                  {/* Candidate's submitted answer review */}
                  {userAnswers[questions[currentIndex].id] && (
                    <div className="p-3.5 bg-slate-50/80 rounded-lg border border-slate-200 space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Your Response</span>
                      <p className="text-xs text-slate-700 leading-relaxed italic whitespace-pre-wrap">
                        "{userAnswers[questions[currentIndex].id]}"
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" />
                        <span>Strengths</span>
                      </span>
                      <ul className="space-y-1.5">
                        {feedbacks[questions[currentIndex].id].strengths.map((s, idx) => (
                          <li key={idx} className="text-xs text-slate-700 flex gap-2 leading-relaxed">
                            <span className="text-emerald-500 font-bold">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-amber-700 uppercase tracking-widest flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>Suggested Improvements</span>
                      </span>
                      <ul className="space-y-1.5">
                        {feedbacks[questions[currentIndex].id].improvements.map((imp, idx) => (
                          <li key={idx} className="text-xs text-slate-700 flex gap-2 leading-relaxed">
                            <span className="text-amber-500 font-bold">•</span>
                            <span>{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Polished Answer Sample with Rich Markdown Formatting */}
                <div className="p-6 bg-slate-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4 text-indigo-600" />
                        <span>Polished Answer Sample</span>
                      </span>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                        STAR Framework
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyAnswer(feedbacks[questions[currentIndex].id].suggestedAnswer)}
                      className="text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-white hover:bg-indigo-50/60 border border-slate-200 rounded-md px-2.5 py-1 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      {copiedAnswer ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-slate-500" />
                          <span>Copy Answer</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
                    <MarkdownAnswerView content={feedbacks[questions[currentIndex].id].suggestedAnswer} />
                  </div>
                </div>

                <div className="p-5 flex justify-between items-center bg-white rounded-b-xl">
                  {currentIndex > 0 ? (
                    <button
                      type="button"
                      onClick={() => handleSelectQuestion(currentIndex - 1)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      ← Previous Question
                    </button>
                  ) : <div />}

                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    <span>{currentIndex === questions.length - 1 ? 'Finish Prep Session' : 'Next Question'}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Typing Answer Screen */
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Your Response</label>
                    <span className="text-[11px] text-slate-400">
                      Tip: Use STAR (Situation, Task, Action, Result)
                    </span>
                  </div>
                  <textarea
                    value={userAnswer}
                    disabled={submittingAnswer}
                    onChange={(e) => {
                      setUserAnswer(e.target.value);
                      // Update active answer draft in state
                      const qId = questions[currentIndex]?.id;
                      if (qId) {
                        setUserAnswers(prev => ({ ...prev, [qId]: e.target.value }));
                      }
                    }}
                    placeholder="Type your answer to this question. Outline your situation, specific actions taken, and measurable business outcomes..."
                    rows={9}
                    className="w-full p-4 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none leading-relaxed"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-lg border border-rose-100">
                    {error}
                  </div>
                )}

                <div className="flex justify-between items-center pt-1">
                  {currentIndex > 0 ? (
                    <button
                      type="button"
                      onClick={() => handleSelectQuestion(currentIndex - 1)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      ← Previous Question
                    </button>
                  ) : <div />}

                  <button
                    type="button"
                    onClick={handleSubmitAnswer}
                    disabled={!userAnswer.trim() || submittingAnswer}
                    className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    {submittingAnswer ? (
                      <>
                        <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Evaluating Response with AI...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Response</span>
                        <Send className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Rich Markdown View for Polished Exemplar Answers with Section Headers and Separate Paragraphs
function MarkdownAnswerView({ content }: { content: string }) {
  if (!content) return null;

  // Split content into blocks by double newlines or headers
  const rawSections = content.split(/\n{2,}|\n(?=###?\s)/);

  return (
    <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-slate-700">
      {rawSections.map((section, sIdx) => {
        const trimmed = section.trim();
        if (!trimmed) return null;

        // Check if block begins with markdown header: ### Header or ## Header
        const headerMatch = trimmed.match(/^(###?|##)\s*(.+)/);
        if (headerMatch) {
          const headerText = headerMatch[2].trim();
          const bodyText = trimmed.replace(/^(###?|##)\s*.+\n?/, '').trim();

          return (
            <div key={sIdx} className="space-y-2 pt-1.5 first:pt-0">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold tracking-wide uppercase bg-indigo-50 text-indigo-800 border border-indigo-200/80 inline-flex items-center gap-1.5 shadow-2xs">
                  <Sparkles className="h-3 w-3 text-indigo-600" />
                  {headerText}
                </span>
              </div>
              {bodyText && (
                <div className="space-y-2 pl-0.5 text-slate-700 leading-relaxed">
                  {renderParagraphsAndLists(bodyText)}
                </div>
              )}
            </div>
          );
        }

        // Check if block begins with bold header: **Header:** or **Header**
        const boldHeaderMatch = trimmed.match(/^\*\*([^*]+)\*\*[:\s]*([\s\S]*)/);
        if (boldHeaderMatch) {
          const boldTitle = boldHeaderMatch[1].trim();
          const restOfText = boldHeaderMatch[2].trim();

          return (
            <div key={sIdx} className="space-y-2 pt-1.5 first:pt-0">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold tracking-wide uppercase bg-indigo-50 text-indigo-800 border border-indigo-200/80 inline-flex items-center gap-1.5 shadow-2xs">
                  <Sparkles className="h-3 w-3 text-indigo-600" />
                  {boldTitle}
                </span>
              </div>
              {restOfText && (
                <div className="space-y-2 pl-0.5 text-slate-700 leading-relaxed">
                  {renderParagraphsAndLists(restOfText)}
                </div>
              )}
            </div>
          );
        }

        // Regular paragraph or list block
        return (
          <div key={sIdx} className="space-y-2 text-slate-700 leading-relaxed">
            {renderParagraphsAndLists(trimmed)}
          </div>
        );
      })}
    </div>
  );
}

function renderParagraphsAndLists(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="space-y-1.5 my-2 pl-4 list-disc list-outside text-slate-700">
          {currentList.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {formatInlineText(item)}
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, lIdx) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    if (/^[-*•]\s+/.test(trimmedLine)) {
      currentList.push(trimmedLine.replace(/^[-*•]\s+/, ''));
    } else if (/^\d+\.\s+/.test(trimmedLine)) {
      currentList.push(trimmedLine.replace(/^\d+\.\s+/, ''));
    } else {
      flushList();
      elements.push(
        <p key={lIdx} className="leading-relaxed text-slate-700">
          {formatInlineText(trimmedLine)}
        </p>
      );
    }
  });

  flushList();
  return elements;
}

function formatInlineText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} className="italic text-slate-800">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}
