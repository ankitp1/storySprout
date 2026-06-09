import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';
import { 
  saveOfflineAudio, 
  deleteOfflineAudio, 
  saveOfflineCover, 
  deleteOfflineCover, 
  checkBookDownloadStatus 
} from '../lib/offlineDb';
import { isFirebaseAvailable, saveProfileToCloud, deleteProfileFromCloud, fetchProfilesFromCloud } from '../services/firebase';

localforage.config({
  name: 'RowansLibraryDB',
  storeName: 'books'
});

let syncTimeout = null;
const triggerCloudSync = (get) => {
  if (!isFirebaseAvailable()) return;
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    const syncProfileToCloud = get().syncProfileToCloud;
    if (syncProfileToCloud) {
      await syncProfileToCloud();
    }
  }, 5000); // Debounce for 5 seconds
};

const normalizeCoverUrl = (url) => {
  if (!url) return url;
  if (url.includes('googleapis.com/drive/v3/files') && url.includes('alt=media')) {
    const match = url.match(/files\/([a-zA-Z0-9_-]+)/);
    if (match) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`;
    }
  }
  return url;
};

const useStore = create(
  persist(
    (set, get) => ({
      // Cloud sync state
      isFirebaseSyncing: false,

      // Admin State
      isAdmin: false,
      adminPin: '1234', // Default for MVP
      setAdminStatus: (status) => set({ isAdmin: status }),

      // Profiles State
      profiles: [],
      activeProfileId: null,
      
      addProfile: (name, avatar, color, pin) => set((state) => {
        const newProfile = { id: Date.now().toString(), name, avatar, color, pin: pin || '', lastUpdated: Date.now() };
        const newState = {
          profiles: [...state.profiles, newProfile]
        };
        // Sync to cloud if available
        if (isFirebaseAvailable()) {
          const fullProfile = {
            ...newProfile,
            progress: {},
            readBooks: [],
            listeningStats: {},
            ratings: {},
            approvedBooks: [],
            points: 0,
            unlockedAvatars: [],
            sessionLimit: 60
          };
          saveProfileToCloud(fullProfile);
        }
        return newState;
      }),
      
      setActiveProfile: (profileId) => set({ 
        activeProfileId: profileId,
        sessionTimeUsed: 0,
        isSessionLocked: false
      }),
      
      updateProfile: (profileId, updates) => set((state) => {
        const updatedProfiles = state.profiles.map(p => p.id === profileId ? { ...p, ...updates, lastUpdated: Date.now() } : p);
        const newState = { profiles: updatedProfiles };
        
        if (isFirebaseAvailable()) {
          const updatedProfile = updatedProfiles.find(p => p.id === profileId);
          if (updatedProfile) {
            const fullProfile = {
              ...updatedProfile,
              progress: state.progress[profileId] || {},
              readBooks: state.readBooks[profileId] || [],
              listeningStats: state.listeningStats[profileId] || {},
              ratings: state.ratings[profileId] || {},
              approvedBooks: state.approvedBooks[profileId] || [],
              points: state.points[profileId] || 0,
              unlockedAvatars: state.unlockedAvatars[profileId] || [],
              sessionLimit: state.sessionLimits[profileId] !== undefined ? state.sessionLimits[profileId] : 60
            };
            saveProfileToCloud(fullProfile);
          }
        }
        return newState;
      }),
      
      removeProfile: (profileId) => set((state) => {
        if (isFirebaseAvailable()) {
          deleteProfileFromCloud(profileId);
        }
        return {
          profiles: state.profiles.filter(p => p.id !== profileId),
          activeProfileId: state.activeProfileId === profileId ? null : state.activeProfileId
        };
      }),

      // Library State
      books: [],
      addBook: (book) => set((state) => {
        // Prevent adding duplicate books
        if (state.books.some(b => b.id === book.id)) {
          return state;
        }
        const normalizedBook = {
          ...book,
          coverUrl: normalizeCoverUrl(book.coverUrl)
        };
        return { books: [...state.books, normalizedBook] };
      }),
      removeBook: (bookId) => set((state) => ({ books: state.books.filter(b => b.id !== bookId) })),
      
      // Reading State
      currentBookId: null,
      setCurrentBook: (id) => set({ currentBookId: id }),
      
      // Progress Tracking (scoped by profile: profileId -> bookId -> { chapterIndex, currentTime })
      progress: {},
      updateProgress: (bookId, chapterIndex, currentTime) => {
        set((state) => {
          if (!state.activeProfileId) return state;
          const profileProgress = state.progress[state.activeProfileId] || {};
          return {
            progress: {
              ...state.progress,
              [state.activeProfileId]: {
                ...profileProgress,
                [bookId]: { chapterIndex, currentTime }
              }
            }
          };
        });
        triggerCloudSync(get);
      },
      
      // Completed Books (scoped by profile)
      readBooks: {},
      markBookAsRead: (bookId) => {
        set((state) => {
          if (!state.activeProfileId) return state;
          const now = new Date().toISOString();
          
          const profileReadBooks = state.readBooks[state.activeProfileId] || [];
          const profileStats = state.listeningStats[state.activeProfileId] || {};
          const bookStats = profileStats[bookId] || {};
          
          return {
            readBooks: {
              ...state.readBooks,
              [state.activeProfileId]: profileReadBooks.includes(bookId) ? profileReadBooks : [...profileReadBooks, bookId]
            },
            listeningStats: {
              ...state.listeningStats,
              [state.activeProfileId]: {
                ...profileStats,
                [bookId]: {
                  ...bookStats,
                  completed: true,
                  completedAt: now
                }
              }
            }
          };
        });
        triggerCloudSync(get);
      },

      // Parental Approvals (scoped by profile)
      approvedBooks: {},
      approveBook: (bookId) => {
        set((state) => {
          if (!state.activeProfileId) return state;
          const profileApproved = state.approvedBooks[state.activeProfileId] || [];
          if (profileApproved.includes(bookId)) return state;
          
          return {
            approvedBooks: {
              ...state.approvedBooks,
              [state.activeProfileId]: [...profileApproved, bookId]
            }
          };
        });
        triggerCloudSync(get);
      },
      resetApprovedBooks: (profileId) => {
        set((state) => ({
          approvedBooks: {
            ...state.approvedBooks,
            [profileId]: []
          }
        }));
        triggerCloudSync(get);
      },

      // Gamification
      points: {},
      addPoints: (amount) => {
        set((state) => {
          if (!state.activeProfileId) return state;
          const currentPoints = state.points[state.activeProfileId] || 0;
          return {
            points: {
              ...state.points,
              [state.activeProfileId]: currentPoints + amount
            }
          };
        });
        triggerCloudSync(get);
      },

      unlockedAvatars: {},
      unlockAvatar: (avatarUrl, cost) => {
        set((state) => {
          if (!state.activeProfileId) return state;
          const currentPoints = state.points[state.activeProfileId] || 0;
          if (currentPoints < cost) return state; // Insufficient points
          
          const unlocked = state.unlockedAvatars[state.activeProfileId] || [];
          if (unlocked.includes(avatarUrl)) return state; // Already unlocked

          return {
            points: {
              ...state.points,
              [state.activeProfileId]: currentPoints - cost
            },
            unlockedAvatars: {
              ...state.unlockedAvatars,
              [state.activeProfileId]: [...unlocked, avatarUrl]
            }
          };
        });
        triggerCloudSync(get);
      },

      // Analytics & Discussion
      listeningStats: {},
      updateListeningStats: (bookId, currentTimeAdded) => {
        set((state) => {
          if (!state.activeProfileId) return state;
          const profileStats = state.listeningStats[state.activeProfileId] || {};
          const currentStats = profileStats[bookId] || { totalTimeSeconds: 0, sessionsCount: 0 };
          return {
            listeningStats: {
              ...state.listeningStats,
              [state.activeProfileId]: {
                ...profileStats,
                [bookId]: {
                  ...currentStats,
                  totalTimeSeconds: currentStats.totalTimeSeconds + currentTimeAdded,
                  lastListenedAt: new Date().toISOString()
                }
              }
            }
          };
        });
        triggerCloudSync(get);
      },
      
      incrementSessionCount: (bookId) => {
        set((state) => {
          if (!state.activeProfileId) return state;
          const profileStats = state.listeningStats[state.activeProfileId] || {};
          const currentStats = profileStats[bookId] || { totalTimeSeconds: 0, sessionsCount: 0 };
          return {
            listeningStats: {
              ...state.listeningStats,
              [state.activeProfileId]: {
                ...profileStats,
                [bookId]: {
                  ...currentStats,
                  sessionsCount: currentStats.sessionsCount + 1
                }
              }
            }
          };
        });
        triggerCloudSync(get);
      },

      ratings: {},
      rateBook: (bookId, rating) => {
        set((state) => {
          if (!state.activeProfileId) return state;
          const profileRatings = state.ratings[state.activeProfileId] || {};
          return {
            ratings: {
              ...state.ratings,
              [state.activeProfileId]: {
                ...profileRatings,
                [bookId]: rating
              }
            }
          };
        });
        triggerCloudSync(get);
      },

      discussionQuestions: [],
      setDiscussionQuestions: (questions) => set({ discussionQuestions: questions }),

      isDarkMode: false,
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

      completedTours: {},
      completeTour: (profileId) => set((state) => ({
        completedTours: {
          ...state.completedTours,
          [profileId]: true
        }
      })),
      resetTour: (profileId) => set((state) => ({
        completedTours: {
          ...state.completedTours,
          [profileId]: false
        }
      })),

      // Offline Support State
      downloadedBooks: {},
      downloadProgress: {},
      
      initDownloads: async (booksList) => {
        const statuses = {};
        for (const book of booksList) {
          const status = await checkBookDownloadStatus(book.id, book.chapters || []);
          if (status) {
            statuses[book.id] = true;
          }
        }
        set({ downloadedBooks: statuses });
      },

      downloadBook: async (book) => {
        const bookId = book.id;
        set((state) => ({
          downloadProgress: {
            ...state.downloadProgress,
            [bookId]: { current: 0, total: book.chapters.length, status: 'starting' }
          }
        }));

        try {
          // Download cover image
          if (book.coverUrl && !book.coverUrl.startsWith('https://placehold.co')) {
            try {
              const coverRes = await fetch(book.coverUrl);
              if (coverRes.ok) {
                const coverBlob = await coverRes.blob();
                await saveOfflineCover(bookId, coverBlob);
              }
            } catch (err) {
              console.error('Failed to download cover:', err);
            }
          }

          // Download chapters
          let count = 0;
          for (const ch of book.chapters) {
            set((state) => ({
              downloadProgress: {
                ...state.downloadProgress,
                [bookId]: { current: count, total: book.chapters.length, status: `Downloading chapter ${count + 1}...` }
              }
            }));

            let success = false;
            let lastErrorMsg = '';
            for (let retry = 0; retry < 3; retry++) {
              try {
                const res = await fetch(ch.url);
                if (!res.ok) {
                  if (res.status === 403) {
                    throw new Error(`Google Drive API limits exceeded or access denied (403) for chapter ${ch.name}`);
                  }
                  throw new Error(`Failed to download chapter ${ch.name} (Status: ${res.status})`);
                }
                const blob = await res.blob();
                await saveOfflineAudio(bookId, ch.id, blob);
                success = true;
                break;
              } catch (e) {
                lastErrorMsg = e.message;
                await new Promise(resolve => setTimeout(resolve, 1000 * (retry + 1))); // exponential backoff
              }
            }

            if (!success) {
              throw new Error(`Failed after retries: ${lastErrorMsg}`);
            }
            
            count++;
            if (count < book.chapters.length) {
              // Throttle downloads to prevent Google Drive API burst rate limits
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }

          set((state) => ({
            downloadedBooks: {
              ...state.downloadedBooks,
              [bookId]: true
            },
            downloadProgress: {
              ...state.downloadProgress,
              [bookId]: null
            }
          }));
        } catch (err) {
          console.error(`Download failed for book ${bookId}:`, err);
          set((state) => ({
            downloadProgress: {
              ...state.downloadProgress,
              [bookId]: { error: err.message || 'Download failed' }
            }
          }));
        }
      },

      removeDownloadedBook: async (book) => {
        const bookId = book.id;
        try {
          for (const ch of book.chapters) {
            await deleteOfflineAudio(bookId, ch.id);
          }
          await deleteOfflineCover(bookId);

          set((state) => ({
            downloadedBooks: {
              ...state.downloadedBooks,
              [bookId]: false
            },
            downloadProgress: {
              ...state.downloadProgress,
              [bookId]: null
            }
          }));
        } catch (err) {
          console.error(`Failed to delete downloaded book ${bookId}:`, err);
        }
      },

      // Session Limits
      sessionLimits: {},
      sessionTimeUsed: 0,
      isSessionLocked: false,

      setSessionLimit: (profileId, minutes) => {
        set((state) => ({
          sessionLimits: {
            ...state.sessionLimits,
            [profileId]: minutes
          }
        }));
        triggerCloudSync(get);
      },

      incrementSessionTime: (seconds) => set((state) => {
        if (!state.activeProfileId) return state;
        const limitMinutes = state.sessionLimits[state.activeProfileId] !== undefined
          ? state.sessionLimits[state.activeProfileId]
          : 60; // Default to 60 minutes if not set
        if (limitMinutes <= 0) return state; // No limit configured

        const limitSeconds = limitMinutes * 60;
        const newTimeUsed = state.sessionTimeUsed + seconds;
        const shouldLock = newTimeUsed >= limitSeconds;

        return {
          sessionTimeUsed: newTimeUsed,
          isSessionLocked: shouldLock
        };
      }),

      unlockSession: () => set({
        sessionTimeUsed: 0,
        isSessionLocked: false
      }),

      // Cloud Actions
      syncProfileToCloud: async (profileId) => {
        if (!isFirebaseAvailable()) return;
        const state = get();
        const targetId = profileId || state.activeProfileId;
        if (!targetId) return;

        // Update local timestamp so it matches/records changes
        const updatedProfiles = state.profiles.map(p => p.id === targetId ? { ...p, lastUpdated: Date.now() } : p);
        set({ profiles: updatedProfiles });

        const profile = updatedProfiles.find(p => p.id === targetId);
        if (!profile) return;

        const fullProfile = {
          id: profile.id,
          name: profile.name,
          avatar: profile.avatar,
          color: profile.color,
          pin: profile.pin || '',
          lastUpdated: profile.lastUpdated || Date.now(),
          progress: get().progress[targetId] || {},
          readBooks: get().readBooks[targetId] || [],
          listeningStats: get().listeningStats[targetId] || {},
          ratings: get().ratings[targetId] || {},
          approvedBooks: get().approvedBooks[targetId] || [],
          points: get().points[targetId] || 0,
          unlockedAvatars: get().unlockedAvatars[targetId] || [],
          sessionLimit: get().sessionLimits[targetId] !== undefined ? get().sessionLimits[targetId] : 60
        };
        await saveProfileToCloud(fullProfile);
      },

      flushCloudSync: async () => {
        if (syncTimeout) clearTimeout(syncTimeout);
        await get().syncProfileToCloud();
      },

      syncWithCloud: async () => {
        if (!isFirebaseAvailable()) return;
        set({ isFirebaseSyncing: true });
        try {
          const cloudProfiles = await fetchProfilesFromCloud();
          const localProfiles = get().profiles;
          
          let profilesUpdated = [...localProfiles];
          let progressUpdated = { ...get().progress };
          let readBooksUpdated = { ...get().readBooks };
          let listeningStatsUpdated = { ...get().listeningStats };
          let ratingsUpdated = { ...get().ratings };
          let approvedBooksUpdated = { ...get().approvedBooks };
          let pointsUpdated = { ...get().points };
          let unlockedAvatarsUpdated = { ...get().unlockedAvatars };
          let sessionLimitsUpdated = { ...get().sessionLimits };
          
          for (const cloudP of cloudProfiles) {
            const localP = localProfiles.find(p => p.id === cloudP.id);
            
            if (!localP || (cloudP.lastUpdated || 0) > (localP.lastUpdated || 0)) {
              // Cloud is newer: Pull cloud data
              if (!localP) {
                profilesUpdated.push({
                  id: cloudP.id,
                  name: cloudP.name,
                  avatar: cloudP.avatar,
                  color: cloudP.color,
                  pin: cloudP.pin || '',
                  lastUpdated: cloudP.lastUpdated || Date.now()
                });
              } else {
                profilesUpdated = profilesUpdated.map(p => p.id === cloudP.id ? {
                  ...p,
                  name: cloudP.name,
                  avatar: cloudP.avatar,
                  color: cloudP.color,
                  pin: cloudP.pin || '',
                  lastUpdated: cloudP.lastUpdated || Date.now()
                } : p);
              }
              
              progressUpdated[cloudP.id] = cloudP.progress || {};
              readBooksUpdated[cloudP.id] = cloudP.readBooks || [];
              listeningStatsUpdated[cloudP.id] = cloudP.listeningStats || {};
              ratingsUpdated[cloudP.id] = cloudP.ratings || {};
              approvedBooksUpdated[cloudP.id] = cloudP.approvedBooks || [];
              pointsUpdated[cloudP.id] = cloudP.points || 0;
              unlockedAvatarsUpdated[cloudP.id] = cloudP.unlockedAvatars || [];
              sessionLimitsUpdated[cloudP.id] = cloudP.sessionLimit !== undefined ? cloudP.sessionLimit : 60;
            } else if (localP && (localP.lastUpdated || 0) > (cloudP.lastUpdated || 0)) {
              // Local is newer: Push local data to cloud
              const fullProfile = {
                id: localP.id,
                name: localP.name,
                avatar: localP.avatar,
                color: localP.color,
                pin: localP.pin || '',
                lastUpdated: localP.lastUpdated || Date.now(),
                progress: get().progress[localP.id] || {},
                readBooks: get().readBooks[localP.id] || [],
                listeningStats: get().listeningStats[localP.id] || {},
                ratings: get().ratings[localP.id] || {},
                approvedBooks: get().approvedBooks[localP.id] || [],
                points: get().points[localP.id] || 0,
                unlockedAvatars: get().unlockedAvatars[localP.id] || [],
                sessionLimit: get().sessionLimits[localP.id] !== undefined ? get().sessionLimits[localP.id] : 60
              };
              await saveProfileToCloud(fullProfile);
            }
          }
          
          // Push local-only profiles that are not in cloud
          for (const localP of localProfiles) {
            if (!cloudProfiles.some(cp => cp.id === localP.id)) {
              const fullProfile = {
                id: localP.id,
                name: localP.name,
                avatar: localP.avatar,
                color: localP.color,
                pin: localP.pin || '',
                lastUpdated: localP.lastUpdated || Date.now(),
                progress: get().progress[localP.id] || {},
                readBooks: get().readBooks[localP.id] || [],
                listeningStats: get().listeningStats[localP.id] || {},
                ratings: get().ratings[localP.id] || {},
                approvedBooks: get().approvedBooks[localP.id] || [],
                points: get().points[localP.id] || 0,
                unlockedAvatars: get().unlockedAvatars[localP.id] || [],
                sessionLimit: get().sessionLimits[localP.id] !== undefined ? get().sessionLimits[localP.id] : 60
              };
              await saveProfileToCloud(fullProfile);
            }
          }
          
          set({
            profiles: profilesUpdated,
            progress: progressUpdated,
            readBooks: readBooksUpdated,
            listeningStats: listeningStatsUpdated,
            ratings: ratingsUpdated,
            approvedBooks: approvedBooksUpdated,
            points: pointsUpdated,
            unlockedAvatars: unlockedAvatarsUpdated,
            sessionLimits: sessionLimitsUpdated
          });
        } catch (error) {
          console.error('Error syncing with cloud:', error);
        } finally {
          set({ isFirebaseSyncing: false });
        }
      },
    }),
    {
      name: 'rowans-library-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localforage),
      version: 4, // Increment version for migration
      migrate: (persistedState, version) => {
        let state = persistedState;
        if (version === 0 || version === 1 || version === undefined) {
          // Migration from global to profile-scoped
          const defaultProfileId = 'profile_default_rowan';
          
          state = {
            ...state,
            profiles: [{ id: defaultProfileId, name: 'Rowan', avatar: '🦊', color: '#FF6B6B' }],
            activeProfileId: defaultProfileId,
            
            // Scope existing progress
            progress: {
              [defaultProfileId]: state.progress || {}
            },
            
            // Scope existing read books
            readBooks: {
              [defaultProfileId]: state.readBooks || []
            },
            
            // Scope existing listening stats
            listeningStats: {
              [defaultProfileId]: state.listeningStats || {}
            },
            
            // Migrate ratings if any exist
            ratings: {
              [defaultProfileId]: state.ratings || {}
            },

            // Ensure approvedBooks exists
            approvedBooks: {
              [defaultProfileId]: state.approvedBooks?.[defaultProfileId] || []
            },

            // Ensure points exists
            points: {
              [defaultProfileId]: state.points?.[defaultProfileId] || 0
            },

            // Ensure unlockedAvatars exists
            unlockedAvatars: {
              [defaultProfileId]: state.unlockedAvatars?.[defaultProfileId] || []
            }
          };
        }
        if (version < 3) {
          state = {
            ...state,
            isDarkMode: !!state.isHighContrast || !!state.isDarkMode,
          };
          delete state.isHighContrast;
          delete state.theme;
        }
        if (version < 4) {
          if (state && Array.isArray(state.books)) {
            state.books = state.books.map(book => ({
              ...book,
              coverUrl: normalizeCoverUrl(book.coverUrl)
            }));
          }
        }
        return state;
      }
    }
  )
);

export default useStore;
