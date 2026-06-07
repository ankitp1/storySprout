import localforage from 'localforage';

const lf = localforage.default || localforage;

// Offline Audio DB
export const offlineAudioDB = lf.createInstance({
  name: 'StorySproutOfflineDB',
  storeName: 'audio_blobs'
});

// Offline Covers DB
export const offlineCoverDB = lf.createInstance({
  name: 'StorySproutOfflineDB',
  storeName: 'cover_blobs'
});

export const saveOfflineAudio = async (bookId, chapterId, blob) => {
  const key = `${bookId}_${chapterId}`;
  await offlineAudioDB.setItem(key, blob);
};

export const getOfflineAudio = async (bookId, chapterId) => {
  const key = `${bookId}_${chapterId}`;
  return await offlineAudioDB.getItem(key);
};

export const deleteOfflineAudio = async (bookId, chapterId) => {
  const key = `${bookId}_${chapterId}`;
  await offlineAudioDB.removeItem(key);
};

export const saveOfflineCover = async (bookId, blob) => {
  await offlineCoverDB.setItem(bookId, blob);
};

export const getOfflineCover = async (bookId) => {
  return await offlineCoverDB.getItem(bookId);
};

export const deleteOfflineCover = async (bookId) => {
  await offlineCoverDB.removeItem(bookId);
};

export const checkBookDownloadStatus = async (bookId, chapters) => {
  try {
    for (const ch of chapters) {
      const audioBlob = await getOfflineAudio(bookId, ch.id);
      if (!audioBlob) return false;
    }
    return true;
  } catch (err) {
    console.error('Error checking download status:', err);
    return false;
  }
};
