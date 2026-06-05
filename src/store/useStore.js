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

      // Library State
      books: [],
      addBook: (book) => set((state) => ({ books: [...state.books, book] })),
      removeBook: (bookId) => set((state) => ({ books: state.books.filter(b => b.id !== bookId) })),
      
      // Reading State
      currentBookId: null,
      setCurrentBook: (id) => set({ currentBookId: id }),
      
      // Progress Tracking (bookId -> { chapterIndex, currentTime })
      progress: {},
      updateProgress: (bookId, chapterIndex, currentTime) => set((state) => ({
        progress: {
          ...state.progress,
          [bookId]: { chapterIndex, currentTime }
        }
      })),
      
      // Completed Books
      readBooks: [],
      markBookAsRead: (bookId) => set((state) => ({
        readBooks: state.readBooks.includes(bookId) ? state.readBooks : [...state.readBooks, bookId]
      })),
    }),
    {
      name: 'rowans-library-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localforage),
    }
  )
);

export default useStore;
