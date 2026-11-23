'use client';

import { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { extractTextFromPdf } from '@/lib/pdf';

interface QuickUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (extractedText: string, resumeName: string) => void;
  title?: string;
  subtitle?: string;
}

export default function QuickUploadModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'Score Jobs with Your CV',
  subtitle = 'Upload your CV to calculate instant AI match scores and uncover transferable skill alignments without leaving your search.'
}: QuickUploadModalProps) {
  const [tab, setTab] = useState<'upload' | 'paste'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf' || droppedFile.name.endsWith('.pdf')) {
        setFile(droppedFile);
        setError('');
      } else {
        setError('Please drop a valid PDF file.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleProcessUpload = async () => {
    if (!file) {
      setError('Please choose or drop a PDF file first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const extractedText = await extractTextFromPdf(file);
      const fileName = file.name || 'Master_CV.pdf';

      try {
        localStorage.setItem('ascent_master_resume', extractedText);
        localStorage.setItem('ascent_resume_name', fileName);
        window.dispatchEvent(new Event('ascent-storage-cleared'));
      } catch {}

      onSuccess(extractedText, fileName);
      onClose();
    } catch (err: any) {
      console.error('Quick CV upload error:', err);
      setError(err.message || 'Failed to extract text from PDF. Ensure it is a text-based PDF file.');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPaste = () => {
    const trimmed = pasteText.trim();
    if (!trimmed || trimmed.length < 50) {
      setError('Please paste a reasonably complete resume text (at least 50 characters).');
      return;
    }

    const resumeName = 'Pasted_Resume.txt';
    try {
      localStorage.setItem('ascent_master_resume', trimmed);
      localStorage.setItem('ascent_resume_name', resumeName);
      window.dispatchEvent(new Event('ascent-storage-cleared'));
    } catch {}

    onSuccess(trimmed, resumeName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-upload-title"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 id="quick-upload-title" className="text-lg font-bold text-slate-900">
                {title}
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-100 px-5 pt-3 gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setTab('upload'); setError(''); }}
            className={`pb-2.5 transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
              tab === 'upload' 
                ? 'border-indigo-600 text-indigo-700' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload PDF</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('paste'); setError(''); }}
            className={`pb-2.5 transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
              tab === 'paste' 
                ? 'border-indigo-600 text-indigo-700' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Paste Plain Text</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span className="flex-1">{error}</span>
            </div>
          )}

          {tab === 'upload' ? (
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-indigo-600 bg-indigo-50/60 scale-[0.99]'
                    : file
                    ? 'border-emerald-500 bg-emerald-50/30'
                    : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {file ? (
                  <div className="space-y-2">
                    <div className="h-10 w-10 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 truncate max-w-xs mx-auto">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(file.size / 1024).toFixed(1)} KB • Click or drop another to replace
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="h-10 w-10 mx-auto rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        Click to browse or drag and drop your CV (PDF)
                      </p>
                      <p className="text-xs text-slate-400">
                        Parsed 100% locally in your browser
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={!file || loading}
                onClick={handleProcessUpload}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Extracting CV & Scoring Jobs...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Score All Scanned Jobs</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste your resume or CV text here (work experience, skills, achievements)..."
                rows={8}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none resize-none leading-relaxed text-slate-800 placeholder:text-slate-400"
              />

              <button
                type="button"
                disabled={!pasteText.trim() || loading}
                onClick={handleProcessPaste}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-4 w-4" />
                <span>Save CV & Score Jobs</span>
              </button>
            </div>
          )}

          {/* Privacy badge */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5 font-medium text-indigo-900">
              <ShieldCheck className="h-4 w-4 text-indigo-600 flex-shrink-0" />
              Private by Design • Stored locally in your browser
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
