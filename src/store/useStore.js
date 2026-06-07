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

localforage.config({
  name: 'RowansLibraryDB',
  storeName: 'books'
});

const useStore = create(
  persist(
    (set) => ({
      // Admin State
      isAdmin: false,
      adminPin: '1234', // Default for MVP
      setAdminStatus: (status) => set({ isAdmin: status }),

      // Profiles State
      profiles: [],
      activeProfileId: null,
      
      addProfile: (name, avatar, color) => set((state) => ({
        profiles: [...state.profiles, { id: Date.now().toString(), name, avatar, color }]
      })),
      
      setActiveProfile: (profileId) => set({ 
        activeProfileId: profileId,
        sessionTimeUsed: 0,
        isSessionLocked: false
      }),
      
      updateProfile: (profileId, updates) => set((state) => ({
        profiles: state.profiles.map(p => p.id === profileId ? { ...p, ...updates } : p)
      })),
      
      removeProfile: (profileId) => set((state) => {
        // Need to clean up scoped data for this profile if we wanted, but keeping it simple for now
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
        return { books: [...state.books, book] };
      }),
      removeBook: (bookId) => set((state) => ({ books: state.books.filter(b => b.id !== bookId) })),
      
      // Reading State
      currentBookId: null,
      setCurrentBook: (id) => set({ currentBookId: id }),
      
      // Progress Tracking (scoped by profile: profileId -> bookId -> { chapterIndex, currentTime })
      progress: {},
      updateProgress: (bookId, chapterIndex, currentTime) => set((state) => {
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
      }),
      
      // Completed Books (scoped by profile)
      readBooks: {},
      markBookAsRead: (bookId) => set((state) => {
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
      }),

      // Parental Approvals (scoped by profile)
      approvedBooks: {},
      approveBook: (bookId) => set((state) => {
        if (!state.activeProfileId) return state;
        const profileApproved = state.approvedBooks[state.activeProfileId] || [];
        if (profileApproved.includes(bookId)) return state;
        
        return {
          approvedBooks: {
            ...state.approvedBooks,
            [state.activeProfileId]: [...profileApproved, bookId]
          }
        };
      }),
      resetApprovedBooks: (profileId) => set((state) => ({
        approvedBooks: {
          ...state.approvedBooks,
          [profileId]: []
        }
      })),

      // Gamification
      points: {},
      addPoints: (amount) => set((state) => {
        if (!state.activeProfileId) return state;
        const currentPoints = state.points[state.activeProfileId] || 0;
        return {
          points: {
            ...state.points,
            [state.activeProfileId]: currentPoints + amount
          }
        };
      }),

      unlockedAvatars: {},
      unlockAvatar: (avatarUrl, cost) => set((state) => {
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
      }),

      // Analytics & Discussion
      // Analytics & Discussion (scoped by profile)
      listeningStats: {},
      updateListeningStats: (bookId, currentTimeAdded) => set((state) => {
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
      }),
      
      incrementSessionCount: (bookId) => set((state) => {
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
      }),

      ratings: {},
      rateBook: (bookId, rating) => set((state) => {
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
      }),

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

            const res = await fetch(ch.url);
            if (!res.ok) throw new Error(`Failed to download chapter ${ch.name}`);
            const blob = await res.blob();
            await saveOfflineAudio(bookId, ch.id, blob);
            count++;
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

      setSessionLimit: (profileId, minutes) => set((state) => ({
        sessionLimits: {
          ...state.sessionLimits,
          [profileId]: minutes
        }
      })),

      incrementSessionTime: (seconds) => set((state) => {
        if (!state.activeProfileId) return state;
        const limitMinutes = state.sessionLimits[state.activeProfileId] || 0;
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
    }),
    {
      name: 'rowans-library-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localforage),
      version: 3, // Increment version for migration
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
        return state;
      }
    }
  )
);

export default useStore;
