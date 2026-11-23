// Utility to load PDF.js dynamically and extract structured text from a PDF file

export const loadPdfJs = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('PDF.js can only be loaded in browser environment'));
      return;
    }
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
    script.onerror = () => reject(new Error('Failed to load PDF parsing library. Check your internet connection.'));
    document.head.appendChild(script);
  });
};

export const extractTextFromPdf = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
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

          const mappingRules = [
            { domain: 'linkedin.com', label: 'LinkedIn', regex: /\b(LinkedIn)\b(?!\])/gi },
            { domain: 'github.com', label: 'GitHub', regex: /\b(GitHub)\b(?!\])/gi },
            { domain: 'scholar.google', label: 'Google Scholar', regex: /\b(Google Scholar)\b(?!\])/gi },
            { domain: 'medium.com', label: 'Blog', regex: /\b(Blog)\b(?!\])/gi }
          ];

          for (const link of uniqueLinks) {
            const url = link.url;
            let matched = false;

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

        resolve(cleanedText);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read PDF file'));
    };

    reader.readAsArrayBuffer(file);
  });
};
