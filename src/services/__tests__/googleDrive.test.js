import { describe, it, expect, vi } from 'vitest';
import { fetchBooksFromDrive } from '../googleDrive';

// Mock the global fetch
global.fetch = vi.fn();

describe('googleDrive sync logic', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('skips fetching subfolders if the book already exists locally', async () => {
    // Set up mock environment variables
    import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID = 'mock-folder-id';
    import.meta.env.VITE_GOOGLE_API_KEY = 'mock-api-key';

    // Mock the root folder response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        files: [
          {
            id: 'series-id-1',
            name: 'My Series',
            mimeType: 'application/vnd.google-apps.folder',
          },
          {
            id: 'book-id-2',
            name: 'Standalone Book',
            mimeType: 'application/vnd.google-apps.folder',
          }
        ]
      })
    });

    // We pass an existing book array with book-id-2
    // It should skip making a fetch call for book-id-2
    const existingBooks = [
      { id: 'book-id-2', title: 'Standalone Book', chapters: [] }
    ];

    // Mock the fetch for the series folder
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        files: [
          {
            id: 'book-id-3',
            name: 'Series Book 1',
            mimeType: 'application/vnd.google-apps.folder',
          }
        ]
      })
    });

    // Mock the fetch for the series book contents
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        files: [
          { id: 'audio-1', name: 'Ch 1.mp3', mimeType: 'audio/mp3' }
        ]
      })
    });

    const result = await fetchBooksFromDrive(existingBooks);

    // Assert that we did NOT call fetch for book-id-2's contents
    // fetch calls should be: 
    // 1. root folder
    // 2. series-id-1 folder
    // 3. book-id-3 folder
    expect(global.fetch).toHaveBeenCalledTimes(3);
    
    // Check that our existing book was preserved
    expect(result.some(b => b.id === 'book-id-2')).toBe(true);
    // Check that our new book was added
    expect(result.some(b => b.id === 'book-id-3')).toBe(true);
  });
});
