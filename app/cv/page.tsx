'use client';

import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Edit3, Save } from 'lucide-react';

export default function CVPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [resumeName, setResumeName] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedText = localStorage.getItem('ascent_master_resume');
    const savedName = localStorage.getItem('ascent_resume_name');
    if (savedText) {
      setResumeText(savedText);
    }
    if (savedName) {
      setResumeName(savedName);
    }
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
        setSuccess('Fantastic start! Your Master CV has been extracted and saved to your session. You can review the parsed text below or edit it anytime.');
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
    setSuccess('Master CV saved successfully to your session.');
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
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Master CV Workspace</h2>
        <p className="text-slate-500 text-base">
          Upload your core CV once. Ascent will reference this document to tailor customized versions for every job description you target.
        </p>
        <div className="p-3.5 bg-indigo-50/40 rounded-lg border border-indigo-100 text-xs text-indigo-700 flex items-start gap-2.5 max-w-2xl">
          <AlertCircle className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
          <span><strong>Privacy First:</strong> Your uploaded CV and parsed text are saved strictly in your browser’s local storage and never saved on our servers.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Column */}
        <div className="md:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 h-fit">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Upload Master CV</h3>
          
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-indigo-500 transition-colors cursor-pointer relative bg-slate-50">
              <input 
                type="file" 
                accept=".pdf" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-slate-400" />
                <span className="text-sm font-semibold text-indigo-600">Choose PDF file</span>
                <span className="text-xs text-slate-400">PDF up to 5MB</span>
              </div>
            </div>

            {file && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-indigo-50 text-indigo-700 text-sm border border-indigo-100 font-medium">
                <FileText className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{file.name}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!file || loading}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
            <div className="p-3 bg-rose-50 text-rose-800 text-sm rounded-lg border border-rose-100 flex gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 text-emerald-800 text-sm rounded-lg border border-emerald-100 flex gap-2 leading-relaxed">
              <CheckCircle className="h-5 w-5 flex-shrink-0 animate-bounce text-emerald-600 mt-0.5" />
              <span>{success}</span>
            </div>
          )}
        </div>

        {/* Preview / Editor Column */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 gap-8">
            <div className="flex items-center gap-2 min-w-0 flex-1 mr-4 relative group">
              <FileText className="h-5 w-5 text-indigo-500 flex-shrink-0" />
              <span className="font-bold text-slate-800 text-base truncate cursor-pointer">
                {resumeName ? `Preview: ${resumeName}` : 'No CV Loaded'}
              </span>
              {resumeName && (
                <div className="absolute left-7 top-8 hidden group-hover:block bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap z-50">
                  Preview: {resumeName}
                </div>
              )}
            </div>
            {resumeText && (
              <div className="flex gap-2">
                {isEditing ? (
                  <button
                    onClick={handleSaveText}
                    className="flex items-center gap-1.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-md shadow-sm transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSaveText}
                      className="flex items-center gap-1.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-md shadow-sm transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save CV</span>
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1 text-sm font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-md border border-indigo-200 transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Edit Raw Text</span>
                    </button>
                  </>
                )}
                
                <button
                  onClick={handleClear}
                  className="text-sm font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-md border border-rose-200 transition-colors"
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
                  className="w-full h-full p-4 border border-slate-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none leading-relaxed"
                />
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100 h-full overflow-y-auto">
                  {resumeText}
                </pre>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
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
