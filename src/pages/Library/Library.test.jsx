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
});
