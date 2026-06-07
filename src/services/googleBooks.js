let isGeminiDisabled = false;

export const getCleanBookTitleForSearch = (title) => {
  if (!title) return '';
  let clean = title;
  
  // 1. Remove content in brackets or parentheses (e.g. [Unabridged], (Binaural))
  clean = clean.replace(/\[.*?\]|\(.*?\)/g, '');
  
  // 2. Remove repeating title parts (e.g. "Diary of a Wimpy Kid 01 - Diary of a Wimpy Kid")
  const separatorMatch = clean.match(/(.*?)\s+(?:-|–|—|:|\bby\b)\s+(.*)/i);
  if (separatorMatch) {
    const part1 = separatorMatch[1].trim();
    const part2 = separatorMatch[2].trim();
    
    const norm1 = part1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const norm2 = part2.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (norm1 && norm2) {
      if (norm1.includes(norm2) || norm2.includes(norm1)) {
        clean = part1.length >= part2.length ? part1 : part2;
      }
    }
  }
  
  // 3. Remove leading digits followed by separator characters, e.g. "01 - ", "01. ", "01 ", "12. "
  clean = clean.replace(/^\s*\d+\s*[\-._\s]\s*/, '');
  
  // 4. Remove "Book X" or "Vol X" prefixes/suffixes if they are followed by common separators, e.g., "Book 1 - ", "Vol. 2 "
  clean = clean.replace(/^(book|vol|volume|part|ch|chapter)\s*\d+\s*[\-._\s]*/i, '');
  
  // 5. Remove trailing digits (e.g. "Diary of a Wimpy Kid 01" -> "Diary of a Wimpy Kid")
  clean = clean.replace(/\s+\d+\s*$/, '');
  
  return clean.trim();
};

export const parseTitleAndAuthor = (cleanTitle) => {
  const match = cleanTitle.match(/(.*?)\s+(?:-|–|—|\bby\b)\s+(.*)/i);
  if (match) {
    return {
      title: match[1].trim(),
      author: match[2].trim()
    };
  }
  return {
    title: cleanTitle,
    author: ''
  };
};

const fetchWithRetry = async (url, retries = 3, delay = 500) => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        console.warn(`Rate limit (429) hit for ${url}. Retrying in ${delay * (i + 1) * 2}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1) * 2));
        continue;
      }
      return res;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  return null;
};

export const fetchBookCover = async (bookTitle) => {
  try {
    const cleanTitle = getCleanBookTitleForSearch(bookTitle);
    const parsed = parseTitleAndAuthor(cleanTitle);
    
    // First attempt: try with intitle:
    let query = `intitle:${encodeURIComponent(parsed.title)}`;
    if (parsed.author) {
      query += `+inauthor:${encodeURIComponent(parsed.author)}`;
    }
    
    let res = await fetchWithRetry(`https://www.googleapis.com/books/v1/volumes?q=${query}`);
    let data = res && res.ok ? await res.json() : null;
    
    // Second attempt fallback: general query search
    if (!data || !data.items || data.items.length === 0) {
      res = await fetchWithRetry(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(parsed.title)}`);
      data = res && res.ok ? await res.json() : null;
    }
    
    if (data && data.items && data.items.length > 0) {
      for (const item of data.items) {
        if (item.volumeInfo && item.volumeInfo.imageLinks && item.volumeInfo.imageLinks.thumbnail) {
          return item.volumeInfo.imageLinks.thumbnail.replace('http:', 'https:').replace('&edge=curl', '');
        }
      }
    }
    return null;
  } catch (err) {
    console.error('Failed to fetch book cover:', err);
    return null;
  }
};

export const fetchBookDetails = async (bookTitle) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY;
  const cleanTitle = getCleanBookTitleForSearch(bookTitle);
  const parsed = parseTitleAndAuthor(cleanTitle);

  // Try Gemini first (if not disabled by a prior 403 Forbidden)
  if (apiKey && !isGeminiDisabled) {
    try {
      const promptText = `Provide children's book details for title: "${parsed.title}"${parsed.author ? ` and author: "${parsed.author}"` : ''}.
Return a kid-friendly description summarizing the book plot and themes/lessons taught. Also return estimated page count, publication date/year, and authors.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: promptText
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                description: { type: "STRING" },
                pageCount: { type: "INTEGER" },
                publishedDate: { type: "STRING" },
                authors: {
                  type: "ARRAY",
                  items: { type: "STRING" }
                }
              },
              required: ["description"]
            }
          }
        })
      });

      if (response.status === 403) {
        console.warn('Gemini API returned status 403 (Forbidden). Disabling Gemini for this session to prevent repeated requests.');
        isGeminiDisabled = true;
      } else if (response.ok) {
        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsedGemini = JSON.parse(text);
          return {
            description: parsedGemini.description,
            pageCount: parsedGemini.pageCount || null,
            publishedDate: parsedGemini.publishedDate || null,
            authors: parsedGemini.authors || (parsed.author ? [parsed.author] : null)
          };
        }
      } else {
        console.warn(`Gemini API returned status ${response.status}. Falling back to Google Books API.`);
      }
    } catch (geminiErr) {
      console.warn("Failed to fetch details from Gemini, falling back to Google Books:", geminiErr);
    }
  }

  // Fallback to Google Books API
  try {
    let query = `intitle:${encodeURIComponent(parsed.title)}`;
    if (parsed.author) {
      query += `+inauthor:${encodeURIComponent(parsed.author)}`;
    }
    
    let res = await fetchWithRetry(`https://www.googleapis.com/books/v1/volumes?q=${query}`);
    let data = res && res.ok ? await res.json() : null;
    
    if (!data || !data.items || data.items.length === 0) {
      res = await fetchWithRetry(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(parsed.title)}`);
      data = res && res.ok ? await res.json() : null;
    }
    
    if (data && data.items && data.items.length > 0) {
      for (const item of data.items) {
        if (item.volumeInfo && (item.volumeInfo.description || item.volumeInfo.pageCount)) {
          return {
            description: item.volumeInfo.description || 'No description available for this book.',
            pageCount: item.volumeInfo.pageCount,
            publishedDate: item.volumeInfo.publishedDate,
            authors: item.volumeInfo.authors
          };
        }
      }
      const firstItem = data.items[0];
      if (firstItem.volumeInfo) {
        return {
          description: firstItem.volumeInfo.description || 'No description available for this book.',
          pageCount: firstItem.volumeInfo.pageCount,
          publishedDate: firstItem.volumeInfo.publishedDate,
          authors: firstItem.volumeInfo.authors
        };
      }
    }
  } catch (err) {
    console.error('Failed to fetch book details from Google Books:', err);
  }

  // Final fallback: Local placeholder details to avoid crashes or infinite network loops
  console.log(`Failed to fetch details from APIs for ${parsed.title}. Generating local placeholder details.`);
  return {
    description: `Welcome to ${parsed.title}! Press play to listen to the chapters and follow along with the story.`,
    pageCount: null,
    publishedDate: new Date().getFullYear().toString(),
    authors: parsed.author ? [parsed.author] : ['Unknown Author']
  };
};
