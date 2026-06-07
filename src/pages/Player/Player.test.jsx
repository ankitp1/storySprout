import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import Player from './Player';
import useStore from '../../store/useStore';

// Mock zustand store
vi.mock('../../store/useStore', () => {
  let state = {
    books: [{
      id: 'test-book',
      title: 'Test Book',
      coverUrl: 'http://example.com/cover.jpg',
      chapters: [{ url: 'http://example.com/audio.mp3', name: 'Chapter 1' }]
    }],
    activeProfileId: 'profile1',
    progress: {
      profile1: {
        'test-book': { chapterIndex: 0, currentTime: 0 }
      }
    },
    updateProgress: vi.fn(),
    markBookAsRead: vi.fn(),
    updateListeningStats: vi.fn(),
    incrementSessionCount: vi.fn(),
    addPoints: vi.fn(),
    flushCloudSync: vi.fn(),
    isSessionLocked: false,
    incrementSessionTime: vi.fn()
  };
  return {
    default: vi.fn((selector) => selector ? selector(state) : state)
  };
});

describe('Player Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders navigation controls successfully', () => {
    render(
      <MemoryRouter initialEntries={['/read/test-book']}>
        <Routes>
          <Route path="/read/:bookId" element={<Player />} />
        </Routes>
      </MemoryRouter>
    );
    
    // Check for the presence of navigation buttons using their titles
    expect(screen.getByTitle('Rewind 15 Seconds')).toBeInTheDocument();
    expect(screen.getByTitle('Previous Chapter')).toBeInTheDocument();
    expect(screen.getByTitle('Next Chapter')).toBeInTheDocument();
  });
});
