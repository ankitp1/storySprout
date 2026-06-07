import '@testing-library/jest-dom';
import { vi } from 'vitest';
vi.mock('localforage', () => {
  const store = {};
  const mockInstance = {
    config: vi.fn(),
    setItem: vi.fn((key, value) => { store[key] = value; return Promise.resolve(value); }),
    getItem: vi.fn((key) => Promise.resolve(store[key] || null)),
    removeItem: vi.fn((key) => { delete store[key]; return Promise.resolve(); }),
    clear: vi.fn(() => { for (const k in store) delete store[k]; return Promise.resolve(); }),
  };
  return {
    default: {
      ...mockInstance,
      createInstance: vi.fn(() => mockInstance)
    }
  };
});
