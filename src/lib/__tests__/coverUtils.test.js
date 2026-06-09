import { describe, it, expect } from 'vitest';
import { getFallbackCover } from '../coverUtils';

describe('coverUtils', () => {
  describe('getFallbackCover', () => {
    it('returns a valid data URI', () => {
      const uri = getFallbackCover('My Book');
      expect(uri).toMatch(/^data:image\/svg\+xml,/);
    });

    it('does NOT contain foreignObject', () => {
      // Browsers block foreignObject inside img tags, so this ensures we never regress
      const uri = getFallbackCover('My Book');
      const decoded = decodeURIComponent(uri.split(',')[1]);
      expect(decoded).not.toContain('<foreignObject');
    });

    it('uses standard text tags for wrapping', () => {
      const uri = getFallbackCover('A very long title that should be wrapped');
      const decoded = decodeURIComponent(uri.split(',')[1]);
      expect(decoded).toContain('<text ');
    });

    it('safely escapes HTML characters', () => {
      const uri = getFallbackCover('<script>alert("hi")</script>');
      const decoded = decodeURIComponent(uri.split(',')[1]);
      expect(decoded).not.toContain('<script>');
      expect(decoded).toContain('&lt;script&gt;');
    });
  });
});
