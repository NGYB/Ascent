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
  Lightbulb
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
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);
  
  // Feedback log
  const [feedbacks, setFeedbacks] = useState<Record<string, Feedback>>({});
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // Load tailored resumes from localStorage
    try {
      const list = JSON.parse(localStorage.getItem('ascent_tailored_resumes') || '[]');
      setTailoredList(list);
      if (list.length > 0) {
        setSelectedResumeId(list[0].id);
      }
    } catch {}
  }, []);

  // Sync jobDescription with the selected profile
  useEffect(() => {
    const selected = tailoredList.find(r => r.id === selectedResumeId);
    if (selected) {
      setJobDescription(selected.jobDescription || '');
    }
  }, [selectedResumeId, tailoredList]);

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
      setQuestions(data.questions || []);
      setCurrentIndex(0);
      setFeedbacks({});
      setStarted(true);
      setIsDone(false);
      setUserAnswer('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to start interview prep. Try again.');
    } finally {
      setLoading(false);
    }
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

      const data = await res.json();
      
      setFeedbacks(prev => ({
        ...prev,
        [question.id]: data
      }));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to score answer. Please try again.');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleNext = () => {
    setUserAnswer('');
    setShowHint(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsDone(true);
    }
  };

  const handleRestart = () => {
    setStarted(false);
    setIsDone(false);
    setQuestions([]);
    setCurrentIndex(0);
    setFeedbacks({});
  };

  // Compute average score
  const getAverageScore = () => {
    const scores = Object.values(feedbacks).map(f => f.score);
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Mock Interview Room</h2>
        <p className="text-slate-500 text-base">
          Practice answers tailored to your selected application profile. Get evaluated by AI on metrics, structure (STAR model), and relevance.
        </p>
      </div>

      {!started ? (
        /* Configuration Screen */
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-6">
          <h3 className="font-bold text-slate-800 text-base uppercase tracking-wider flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-indigo-600 animate-pulse" />
            <span>Configure Simulator</span>
          </h3>

          {tailoredList.length === 0 ? (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-sm space-y-3">
              <p className="font-semibold">No tailored CVs found.</p>
              <p>You need to generate a tailored CV version first so the mock interview questions can be customized to your specific role and achievements.</p>
              <Link href="/tailor" className="inline-flex items-center gap-1 font-bold underline mt-1">
                <span>Go Tailor CV</span>
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-600">Select Target Profile</label>
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-base bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  {tailoredList.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.jobTitle} - {item.company} ({new Date(item.createdAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Associated Job Description</span>
                <p className="text-sm text-slate-600 font-mono line-clamp-3 leading-relaxed mt-1 whitespace-pre-wrap">
                  {jobDescription || 'No job description text was saved with this tailored version.'}
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 text-rose-800 text-sm rounded-lg border border-rose-100">
                  {error}
                </div>
              )}

              <button
                onClick={handleStartInterview}
                disabled={loading}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-base font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Generating Questions...</span>
                  </>
                ) : (
                  <>
                    <span>Generate & Start Mock Interview</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : isDone ? (
        /* Final Scorecard Screen */
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm max-w-2xl mx-auto text-center space-y-6">
          <div className="mx-auto h-20 w-20 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Award className="h-12 w-12 stroke-[1.5]" />
          </div>

          <div className="space-y-2">
            <h3 className="text-3xl font-black text-slate-800">Prep Session Complete!</h3>
            <p className="text-slate-500 text-base">
              Great job practicing. Consistent preparation builds muscle memory and interview confidence.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center max-w-xs mx-auto">
            <span className="text-5xl font-black text-slate-800">{getAverageScore()}</span>
            <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest mt-1">Average Score</span>
          </div>

          <button
            onClick={handleRestart}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            Start New Session
          </button>
        </div>
      ) : (
        /* Active Interview Screen */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Progress / Sidebar */}
          <div className="lg:col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4 h-fit">
            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Question List</h4>
            <div className="space-y-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = !!feedbacks[q.id];
                return (
                  <div
                    key={q.id}
                    className={`p-3 rounded-lg border text-sm flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'border-indigo-600 bg-indigo-50/20 text-indigo-900 font-bold'
                        : isAnswered
                        ? 'border-slate-200 bg-slate-50 text-slate-500'
                        : 'border-slate-100 bg-white text-slate-400'
                    }`}
                  >
                    <span className="truncate">Question {idx + 1} ({q.category})</span>
                    {isAnswered && (
                      <span className="font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-xs">
                        {feedbacks[q.id].score}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            
            <button
              onClick={handleRestart}
              className="w-full text-sm font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-2.5 rounded-lg border border-rose-200 transition-colors mt-2"
            >
              Quit Session
            </button>
          </div>

          {/* Active Question Simulator */}
          <div className="lg:col-span-3 space-y-6">
            {/* Question Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md bg-indigo-100 text-indigo-800">
                  {questions[currentIndex].category} Question
                </span>
                <span className="text-sm text-slate-400 font-medium">
                  {currentIndex + 1} of {questions.length}
                </span>
              </div>

              <h3 className="text-lg font-extrabold text-slate-800 leading-snug">
                {questions[currentIndex].text}
              </h3>

              {/* Hint accordion */}
              <div className="border-t border-slate-100 pt-3">
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  <Lightbulb className="h-4 w-4" />
                  <span>{showHint ? 'Hide Tip' : 'Show Tip'}</span>
                </button>
                {showHint && (
                  <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2 leading-relaxed italic">
                    {questions[currentIndex].hint}
                  </p>
                )}
              </div>
            </div>

            {/* Answer Input or Feedback display */}
            {feedbacks[questions[currentIndex].id] ? (
              /* Answer Feedback Card */
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-indigo-500 animate-bounce" />
                      <span>AI Feedback Report</span>
                    </h4>
                    <div className="px-3 py-1 rounded bg-indigo-600 text-white font-black text-sm">
                      {feedbacks[questions[currentIndex].id].score}/100
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" />
                        <span>Strengths</span>
                      </span>
                      <ul className="space-y-1.5">
                        {feedbacks[questions[currentIndex].id].strengths.map((s, idx) => (
                          <li key={idx} className="text-sm text-slate-600 flex gap-2">
                            <span className="text-emerald-500">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>Suggested Improvements</span>
                      </span>
                      <ul className="space-y-1.5">
                        {feedbacks[questions[currentIndex].id].improvements.map((imp, idx) => (
                          <li key={idx} className="text-sm text-slate-600 flex gap-2">
                            <span className="text-amber-500">•</span>
                            <span>{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50/50 space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>Polished Answer Sample</span>
                  </span>
                  <p className="text-sm text-slate-700 bg-white border border-slate-200 rounded-lg p-3 leading-relaxed">
                    {feedbacks[questions[currentIndex].id].suggestedAnswer}
                  </p>
                </div>

                <div className="p-6 flex justify-end">
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    <span>{currentIndex === questions.length - 1 ? 'Finish Prep' : 'Next Question'}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Typing Answer Screen */
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-600">Your Response</label>
                  <textarea
                    value={userAnswer}
                    disabled={submittingAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your response to the question. Use structural frameworks like STAR (Situation, Task, Action, Result) if applicable..."
                    rows={8}
                    className="w-full p-4 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none leading-relaxed"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 text-rose-800 text-sm rounded-lg border border-rose-100">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!userAnswer.trim() || submittingAnswer}
                    className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
                  >
                    {submittingAnswer ? (
                      <>
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Evaluating response...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Response</span>
                        <Send className="h-4 w-4" />
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
