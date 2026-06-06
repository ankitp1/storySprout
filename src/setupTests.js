import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('localforage', () => {
  return {
    default: {
      config: vi.fn(),
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    }
  }
});
