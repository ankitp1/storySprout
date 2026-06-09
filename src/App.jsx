import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useStore from './store/useStore';
import { fetchBooksFromDrive } from './services/googleDrive';
import { fetchBookCover } from './services/googleBooks';
import { loadDiscussionQuestions } from './lib/discussionQuestions';

// Pages
import Library from './pages/Library/Library';
import Player from './pages/Player/Player';
import BookCelebration from './pages/BookCelebration/BookCelebration';
import AdminDashboard from './pages/Admin/Dashboard';
import ProfileSelection from './pages/ProfileSelection/ProfileSelection';
import SessionLockOverlay from './components/ParentalControl/SessionLockOverlay';



// Protected Route Component for Profile
const ProtectedProfileRoute = ({ children }) => {
  const activeProfileId = useStore((state) => state.activeProfileId);
  return activeProfileId ? children : <Navigate to="/profiles" replace />;
};

function App() {
  const { books, addBook, setDiscussionQuestions, syncWithCloud } = useStore();
  const isDarkMode = useStore(state => state.isDarkMode);

  React.useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.remove('dark-mode');
      document.body.classList.add('light-mode');
    }
  }, [isDarkMode]);

  React.useEffect(() => {
    // Cloud Sync and Discussion Questions Init
    const initData = async () => {
      syncWithCloud();
      const questions = await loadDiscussionQuestions();
      setDiscussionQuestions(questions);
    };
    initData();
  }, [setDiscussionQuestions, syncWithCloud]);

  const removeBook = useStore((state) => state.removeBook);

  React.useEffect(() => {
    const autoSync = async () => {
      if (books.length === 0) {
        try {
          const fetchedBooks = await fetchBooksFromDrive();
          for (const book of fetchedBooks) {
            if (!book.hasCustomCover) {
              const coverUrl = await fetchBookCover(book.title);
              if (coverUrl) book.coverUrl = coverUrl;
            }
            addBook(book);
          }
        } catch (err) {
          console.error("Auto-sync failed:", err);
        }
      }
    };
    autoSync();
  }, [books.length]); // Intentionally only relying on length to prevent loops

  return (
    <Router>
      <div className="app-container">
        <SessionLockOverlay />
        <div className="app-main">
          <Routes>
            <Route path="/profiles" element={<ProfileSelection />} />
            
            {/* Kid Mode */}
            <Route path="/" element={<ProtectedProfileRoute><Library /></ProtectedProfileRoute>} />
            <Route path="/read/:bookId" element={<ProtectedProfileRoute><Player /></ProtectedProfileRoute>} />
            <Route path="/book-celebration/:bookId" element={<ProtectedProfileRoute><BookCelebration /></ProtectedProfileRoute>} />
            
            {/* Admin Mode */}
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
