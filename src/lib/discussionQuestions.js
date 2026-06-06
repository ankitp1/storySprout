import localforage from 'localforage';

const CACHE_KEY = 'storysprout_discussion_questions';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function loadDiscussionQuestions() {
  // Check cache
  try {
    const cached = await localforage.getItem(CACHE_KEY);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      console.log('Loaded discussion questions from cache');
      return cached.data;
    }
  } catch (err) {
    console.error('Cache read error:', err);
  }

  // Fetch from Google Sheets CSV export
  const SHEET_URL = `https://docs.google.com/spreadsheets/d/e/2PACX-1vSYvZc2rfWcIf2S9pDgyYCUgB3y1ioMW8A_jXAhwQDwQa3W_MwUY1_eoEODMes6u0CKBkS4wh-OgQBp/pub?output=csv`;
  
  try {
    const response = await fetch(SHEET_URL);
    if (!response.ok) throw new Error('Failed to fetch sheet');
    
    const csv = await response.text();
    const questions = parseCSV(csv);
    
    // Save to cache
    await localforage.setItem(CACHE_KEY, {
      data: questions,
      timestamp: Date.now()
    });
    
    console.log('Fetched and cached discussion questions from Sheets');
    return questions;
  } catch (error) {
    console.warn('Could not load discussion questions:', error);
    return [];
  }
}

// Very basic CSV parser assuming first row is headers
// Expects: Book Title, Author, ISBN, Age Range, Discussion Questions, Themes, Related Books
function parseCSV(csvText) {
  if (!csvText) return [];
  
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];
  
  const headers = parseCSVLine(lines[0]);
  const results = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const obj = {};
    headers.forEach((header, index) => {
      obj[header.trim()] = values[index] ? values[index].trim() : '';
    });
    results.push(obj);
  }
  
  return results;
}

// Handles simple CSV quotes
function parseCSVLine(line) {
  const result = [];
  let inQuotes = false;
  let currentValue = "";
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i+1] === '"') {
        currentValue += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(currentValue);
      currentValue = "";
    } else {
      currentValue += char;
    }
  }
  result.push(currentValue);
  return result;
}

export function getQuestionsForBook(questionsData, bookTitle) {
  if (!questionsData || !bookTitle) return null;
  
  const book = questionsData.find(b => 
    b['Book Title']?.toLowerCase().includes(bookTitle.toLowerCase())
  );
  
  if (!book || !book['Discussion Questions']) return null;
  
  try {
    return JSON.parse(book['Discussion Questions']);
  } catch (err) {
    console.error('Failed to parse discussion questions JSON for', bookTitle, err);
    return null;
  }
}
