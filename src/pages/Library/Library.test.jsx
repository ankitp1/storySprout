import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import Library from './Library';

describe('Library Component', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <Library />
      </BrowserRouter>
    );
    expect(screen.getByText(/StorySprout/i)).toBeInTheDocument();
  });

  it('hides the Points feature from the UI to preserve layout', () => {
    render(
      <BrowserRouter>
        <Library />
      </BrowserRouter>
    );
    // Ensure "Pts" button is not in the document
    expect(screen.queryByText(/Pts/i)).not.toBeInTheDocument();
  });

  it('hides the Sort dropdown to save vertical real estate', () => {
    render(
      <BrowserRouter>
        <Library />
      </BrowserRouter>
    );
    expect(screen.queryByText(/Sort A-Z/i)).not.toBeInTheDocument();
  });

  it('renders a collapsible Search bar that defaults to icon-only', async () => {
    render(
      <BrowserRouter>
        <Library />
      </BrowserRouter>
    );
    
    // The search input should NOT be visible by default
    expect(screen.queryByPlaceholderText(/Search books/i)).not.toBeInTheDocument();

    // The search button (icon) SHOULD be visible
    const searchButton = screen.getByTitle('Search Books');
    expect(searchButton).toBeInTheDocument();
  });
});
