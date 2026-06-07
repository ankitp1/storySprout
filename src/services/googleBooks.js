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
        if (item.volumeInfo && (item.volumeInfo.description || item.volumeInfo.pageCount)) {
          return {
            description: item.volumeInfo.description || 'No description available for this book.',
            pageCount: item.volumeInfo.pageCount,
            publishedDate: item.volumeInfo.publishedDate,
            authors: item.volumeInfo.authors
          };
        }
      }
      // Return metadata of the first matching item as fallback
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
    return null;
  } catch (err) {
    console.error('Failed to fetch book details:', err);
    return null;
  }
};
