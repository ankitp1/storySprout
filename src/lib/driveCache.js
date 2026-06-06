import localforage from 'localforage';

const CACHE_KEY = 'storysprout_drive_cache';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export const getDriveCache = async () => {
  try {
    const cached = await localforage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = cached;
    if (Date.now() - timestamp > CACHE_TTL_MS) {
      console.log('Drive cache expired');
      return null;
    }

    console.log('Loaded books from drive cache');
    return data;
  } catch (err) {
    console.error('Failed to read drive cache:', err);
    return null;
  }
};

export const setDriveCache = async (books) => {
  try {
    await localforage.setItem(CACHE_KEY, {
      data: books,
      timestamp: Date.now()
    });
    console.log('Saved books to drive cache');
  } catch (err) {
    console.error('Failed to write drive cache:', err);
  }
};

export const clearDriveCache = async () => {
  try {
    await localforage.removeItem(CACHE_KEY);
    console.log('Cleared drive cache');
  } catch (err) {
    console.error('Failed to clear drive cache:', err);
  }
};
