import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';

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
      
      setActiveProfile: (profileId) => set({ activeProfileId: profileId }),
      
      removeProfile: (profileId) => set((state) => {
        // Need to clean up scoped data for this profile if we wanted, but keeping it simple for now
        return {
          profiles: state.profiles.filter(p => p.id !== profileId),
          activeProfileId: state.activeProfileId === profileId ? null : state.activeProfileId
        };
      }),

      // Library State
      books: [],
      addBook: (book) => set((state) => ({ books: [...state.books, book] })),
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
    }),
    {
      name: 'rowans-library-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localforage),
      version: 2, // Increment version for migration
      migrate: (persistedState, version) => {
        if (version === 0 || version === 1 || version === undefined) {
          // Migration from global to profile-scoped
          const defaultProfileId = 'profile_default_rowan';
          
          return {
            ...persistedState,
            profiles: [{ id: defaultProfileId, name: 'Rowan', avatar: '🦊', color: '#FF6B6B' }],
            activeProfileId: defaultProfileId,
            
            // Scope existing progress
            progress: {
              [defaultProfileId]: persistedState.progress || {}
            },
            
            // Scope existing read books
            readBooks: {
              [defaultProfileId]: persistedState.readBooks || []
            },
            
            // Scope existing listening stats
            listeningStats: {
              [defaultProfileId]: persistedState.listeningStats || {}
            },
            
            // Migrate ratings if any exist
            ratings: {
              [defaultProfileId]: persistedState.ratings || {}
            }
          };
        }
        return persistedState;
      }
    }
  )
);

export default useStore;
