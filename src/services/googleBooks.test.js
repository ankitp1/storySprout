import { describe, it, expect } from 'vitest';
import { getCleanBookTitleForSearch, parseTitleAndAuthor, fetchBookDetails } from './googleBooks';

describe('Google Books Title Cleaning', () => {
  it('should clean repeating title patterns from folder names', () => {
    const rawTitle = 'Diary of a Wimpy Kid 01 - Diary of a Wimpy Kid';
    const cleaned = getCleanBookTitleForSearch(rawTitle);
    expect(cleaned).toBe('Diary of a Wimpy Kid');
  });

  it('should remove bracketed and parenthetical details', () => {
    const rawTitle = 'The Hobbit (J.R.R. Tolkien) [Unabridged]';
    const cleaned = getCleanBookTitleForSearch(rawTitle);
    expect(cleaned).toBe('The Hobbit');
  });

  it('should strip leading numbers and common separators', () => {
    const rawTitle = '02 - Harry Potter';
    const cleaned = getCleanBookTitleForSearch(rawTitle);
    expect(cleaned).toBe('Harry Potter');
  });

  it('should strip Book/Vol prefix and chapter indicators', () => {
    const rawTitle = 'Book 1 - Percy Jackson';
    const cleaned = getCleanBookTitleForSearch(rawTitle);
    expect(cleaned).toBe('Percy Jackson');
  });

  it('should remove trailing numbers', () => {
    const rawTitle = 'The Hunger Games 3';
    const cleaned = getCleanBookTitleForSearch(rawTitle);
    expect(cleaned).toBe('The Hunger Games');
  });

  it('should correctly parse title and author parts', () => {
    const cleanTitle = 'The Lord of the Rings - J.R.R. Tolkien';
    const parsed = parseTitleAndAuthor(cleanTitle);
    expect(parsed.title).toBe('The Lord of the Rings');
    expect(parsed.author).toBe('J.R.R. Tolkien');
  });

  it('should return empty author if no separator is present', () => {
    const cleanTitle = 'Charlotte\'s Web';
    const parsed = parseTitleAndAuthor(cleanTitle);
    expect(parsed.title).toBe('Charlotte\'s Web');
    expect(parsed.author).toBe('');
  });
});

describe('Google Books Fallback', () => {
  it('should return fallback local details if API requests fail or are rate-limited', async () => {
    const originalFetch = global.fetch;
    global.fetch = () => Promise.reject(new Error('Network failure'));
    
    try {
      const details = await fetchBookDetails('Random Story Name');
      expect(details).toBeDefined();
      expect(details.description).toContain('Welcome to Random Story Name');
      expect(details.authors).toContain('Unknown Author');
      expect(details.recommendations).toBe('Recommended for all young readers.');
      expect(details.safetyConcerns).toBe('No safety or content warnings.');
    } finally {
      global.fetch = originalFetch;
    }
  });
});
