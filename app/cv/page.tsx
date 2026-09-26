'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Edit3, 
  Save,
  Radar,
  ArrowRight,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function CVPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [resumeName, setResumeName] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const loadStoredCV = () => {
    const savedText = localStorage.getItem('ascent_master_resume');
    const savedName = localStorage.getItem('ascent_resume_name');
    setResumeText(savedText || '');
    setResumeName(savedName || '');
  };

  // Load from localStorage on mount
  useEffect(() => {
    loadStoredCV();
    window.addEventListener('ascent-storage-cleared', loadStoredCV);
    return () => window.removeEventListener('ascent-storage-cleared', loadStoredCV);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setSuccess('');
    }
  };

  // Load PDF.js dynamically from CDN
  const loadPdfJs = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        const pdfjs = (window as any).pdfjsLib;
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(pdfjs);
      };
      script.onerror = (err) => reject(new Error('Failed to load PDF parsing library. Check your internet connection.'));
      document.head.appendChild(script);
    });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const typedarray = new Uint8Array(event.target?.result as ArrayBuffer);
        const pdfjs = await loadPdfJs();
        const pdf = await pdfjs.getDocument({ data: typedarray }).promise;
        
        let text = '';
        const allLinks: { url: string; title?: string }[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          
          // 1. Extract text content
          const content = await page.getTextContent();
          let lastY = -1;
          let pageText = '';
          
          for (const item of content.items as any[]) {
            if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 5) {
              pageText += '\n';
            } else if (pageText !== '' && !pageText.endsWith('\n') && !pageText.endsWith(' ')) {
              pageText += ' ';
            }
            pageText += item.str;
            lastY = item.transform[5];
          }
          text += pageText + '\n\n';

          // 2. Extract link annotations
          try {
            const annotations = await page.getAnnotations();
            for (const ann of annotations) {
              if (ann.subtype === 'Link' || ann.annotationType === 3) {
                const url = ann.url || ann.unsafeUrl;
                if (url) {
                  allLinks.push({ url, title: ann.title });
                }
              }
            }
          } catch (annError) {
            console.warn('Failed to extract page annotations:', annError);
          }
        }

        let cleanedText = text.trim();
        if (!cleanedText) {
          throw new Error('PDF file appears to be empty or contains scanned/image-only text.');
        }

        // Deduplicate extracted URLs
        const uniqueLinksMap = new Map<string, string>();
        for (const link of allLinks) {
          uniqueLinksMap.set(link.url, link.title || '');
        }
        const uniqueLinks = Array.from(uniqueLinksMap.entries()).map(([url, title]) => ({ url, title }));

        if (uniqueLinks.length > 0) {
          const embeddedUrls = new Set<string>();
          
          // Define mappings for common social/professional websites
          const mappingRules = [
            {
              domain: 'linkedin.com',
              label: 'LinkedIn',
              regex: /\b(LinkedIn)\b(?!\])/gi
            },
            {
              domain: 'github.com',
              label: 'GitHub',
              regex: /\b(GitHub)\b(?!\])/gi
            },
            {
              domain: 'scholar.google',
              label: 'Google Scholar',
              regex: /\b(Google Scholar)\b(?!\])/gi
            },
            {
              domain: 'medium.com',
              label: 'Blog',
              regex: /\b(Blog)\b(?!\])/gi
            }
          ];

          for (const link of uniqueLinks) {
            const url = link.url;
            let matched = false;

            // 1. Try to match predefined rules
            for (const rule of mappingRules) {
              if (url.includes(rule.domain)) {
                if (rule.regex.test(cleanedText)) {
                  cleanedText = cleanedText.replace(rule.regex, `[${rule.label}](${url})`);
                  embeddedUrls.add(url);
                  matched = true;
                  break;
                }
              }
            }

            if (matched) continue;

            // 2. Handle email mailto links specifically
            if (url.startsWith('mailto:')) {
              const email = url.replace('mailto:', '');
              const emailRegex = new RegExp(`\\b(${email})\\b(?!\\\])`, 'gi');
              if (emailRegex.test(cleanedText)) {
                cleanedText = cleanedText.replace(emailRegex, `[Email](${url})`);
                embeddedUrls.add(url);
                continue;
              }
              const textRegex = /\b(Email)\b(?!\])/gi;
              if (textRegex.test(cleanedText)) {
                cleanedText = cleanedText.replace(textRegex, `[Email](${url})`);
                embeddedUrls.add(url);
                continue;
              }
            }
          }

          // Prepend any remaining links (e.g. portfolios, personal websites) to the top contact line
          const remainingLinks = uniqueLinks.filter(l => !embeddedUrls.has(l.url));
          if (remainingLinks.length > 0) {
            let linksHeader = '';
            remainingLinks.forEach(link => {
              let label = link.title;
              if (!label) {
                if (link.url.includes('linkedin.com')) label = 'LinkedIn';
                else if (link.url.includes('github.com')) label = 'GitHub';
                else if (link.url.includes('scholar.google')) label = 'Google Scholar';
                else if (link.url.includes('medium.com')) label = 'Blog';
                else label = 'Website';
              }
              linksHeader += `[${label}](${link.url}) | `;
            });
            if (linksHeader.endsWith(' | ')) {
              linksHeader = linksHeader.slice(0, -3);
            }
            cleanedText = linksHeader + '\n\n' + cleanedText;
          }
        }

        setResumeText(cleanedText);
        setResumeName(file.name);
        try {
          localStorage.setItem('ascent_master_resume', cleanedText);
          localStorage.setItem('ascent_resume_name', file.name);
        } catch {}
        setSuccess('Master CV uploaded and saved! Head to Smart Job Radar to scan target roles, or review your parsed text on the right.');
        setFile(null);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An error occurred while parsing the PDF. Ensure it is a valid, text-based PDF file.');
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Failed to read PDF file.');
      setLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleSaveText = () => {
    localStorage.setItem('ascent_master_resume', resumeText);
    localStorage.setItem('ascent_resume_name', resumeName);
    setSuccess('Master CV saved successfully! Head to Smart Job Radar to discover matching opportunities.');
    setIsEditing(false);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear your master CV? This will delete your local copy.')) {
      localStorage.removeItem('ascent_master_resume');
      localStorage.removeItem('ascent_resume_name');
      setResumeText('');
      setResumeName('');
      setSuccess('');
      setError('');
      setIsEditing(false);
    }
  };

  return (
    <div className="max-w-6xl w-full mx-auto space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold text-ink-900 tracking-tight">Master CV Workspace</h2>
        <p className="text-ink-500 text-base">
          Upload your core CV once. Ascent will reference this document to tailor customized versions for every job description you target.
        </p>
        <div className="p-3.5 bg-pine-50/70 rounded-xl border border-pine-200/80 text-xs text-pine-900 flex items-start gap-2.5 max-w-2xl shadow-2xs">
          <AlertCircle className="h-4 w-4 text-pine-700 flex-shrink-0 mt-0.5" />
          <span><strong>Privacy First:</strong> Your uploaded CV and parsed text are saved strictly in your browser’s local storage and never saved on our servers.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Column */}
        <div className="md:col-span-1 space-y-5 h-fit">
          <div className="bg-white p-6 rounded-2xl border border-sand-200 shadow-2xs space-y-6">
            <h3 className="font-bold text-ink-900 text-sm uppercase tracking-wider">Upload Master CV</h3>
            
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="border-2 border-dashed border-sand-300 rounded-xl p-4 text-center hover:border-terracotta-500 transition-colors cursor-pointer relative bg-sand-50/50">
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-ink-400" />
                  <span className="text-sm font-semibold text-terracotta-600">Choose PDF file</span>
                  <span className="text-xs text-ink-400">PDF up to 5MB</span>
                </div>
              </div>

              {file && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-sand-100 text-ink-800 text-sm border border-sand-200 font-medium">
                  <FileText className="h-5 w-5 flex-shrink-0 text-pine-700" />
                  <span className="truncate">{file.name}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!file || loading}
                className="w-full py-2.5 px-4 bg-terracotta-600 hover:bg-terracotta-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Parsing Document...</span>
                  </>
                ) : (
                  'Upload & Extract'
                )}
              </button>
            </form>

            {/* Feedback alerts */}
            {error && (
              <div className="p-3 bg-rose-50 text-rose-800 text-sm rounded-xl border border-rose-100 flex gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3.5 bg-blue-50 text-blue-950 text-sm rounded-xl border border-blue-200 flex gap-2 leading-relaxed font-medium">
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-blue-700 mt-0.5" />
                <span>{success}</span>
              </div>
            )}
          </div>

          {/* Next Step Guidance Card */}
          {resumeText && (
            <div className="p-5 bg-sand-100/70 rounded-2xl border border-sand-200 shadow-2xs space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-ink-900 font-bold text-xs uppercase tracking-wider">
                  <span className="p-1.5 bg-terracotta-600 text-white rounded-lg shadow-2xs">
                    <Radar className="h-3.5 w-3.5" />
                  </span>
                  <span>Next Step</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-terracotta-50 text-terracotta-700 border border-terracotta-200">
                  CV Ready
                </span>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-extrabold text-ink-900 text-sm">
                  Find Target Roles on Smart Job Radar
                </h4>
                <p className="text-xs text-ink-600 leading-relaxed">
                  Your Master CV is saved! Head over to the Smart Job Radar to scan live job listings across LinkedIn and Google Jobs, and view AI fit scores matched to your profile.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <Link
                  href="/radar"
                  className="w-full py-2.5 px-3.5 bg-terracotta-600 hover:bg-terracotta-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-between group cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-sand-100" />
                    <span>Go to Smart Job Radar</span>
                  </span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  href="/tailor"
                  className="w-full py-2 px-3 bg-white hover:bg-sand-100 text-ink-700 border border-sand-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>Already have a Job Description? Tailor CV</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Preview / Editor Column */}
        <div className="md:col-span-2 bg-white rounded-xl border border-sand-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
          <div className="px-6 py-4 border-b border-sand-200 flex items-center justify-between bg-sand-50/50 gap-8">
            <div className="flex items-center gap-2 min-w-0 flex-1 mr-4 relative group">
              <FileText className="h-5 w-5 text-terracotta-600 flex-shrink-0" />
              <span className="font-bold text-ink-900 text-base truncate cursor-pointer">
                {resumeName ? `Preview: ${resumeName}` : 'No CV Loaded'}
              </span>
              {resumeName && (
                <div className="absolute left-7 top-8 hidden group-hover:block bg-pine-950 text-sand-50 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap z-50">
                  Preview: {resumeName}
                </div>
              )}
            </div>
            {resumeText && (
              <div className="flex gap-2">
                {isEditing ? (
                  <button
                    onClick={handleSaveText}
                    className="flex items-center gap-1.5 text-sm font-bold bg-terracotta-600 hover:bg-terracotta-700 text-white px-4 py-1.5 rounded-md shadow-xs transition-colors cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSaveText}
                      className="flex items-center gap-1.5 text-sm font-bold bg-terracotta-600 hover:bg-terracotta-700 text-white px-4 py-1.5 rounded-md shadow-xs transition-colors cursor-pointer"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save CV</span>
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1 text-sm font-semibold bg-sand-100 text-ink-800 hover:bg-sand-200 px-3 py-1.5 rounded-md border border-sand-300 transition-colors cursor-pointer"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Edit Raw Text</span>
                    </button>
                  </>
                )}
                
                <button
                  onClick={handleClear}
                  className="text-sm font-semibold bg-white hover:bg-sand-100 text-ink-600 px-3 py-1.5 rounded-md border border-sand-200 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {resumeText ? (
              isEditing ? (
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="w-full h-full p-4 border border-sand-300 rounded-lg font-mono text-sm text-ink-900 focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500 outline-none resize-none leading-relaxed"
                />
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-sm text-ink-800 leading-relaxed bg-sand-50/70 p-4 rounded-lg border border-sand-200 h-full overflow-y-auto">
                  {resumeText}
                </pre>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-ink-400 gap-3">
                <FileText className="h-12 w-12 stroke-[1.5]" />
                <p className="text-sm font-semibold text-center max-w-xs leading-relaxed">
                  Your master CV text will appear here once parsed. You can edit the text manually to adjust parsing issues.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
