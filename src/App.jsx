import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useStore from './store/useStore';
import { fetchBooksFromDrive } from './services/googleDrive';
import { fetchBookCover } from './services/googleBooks';
import { getDriveCache, setDriveCache } from './lib/driveCache';
import { loadDiscussionQuestions } from './lib/discussionQuestions';

// Pages
import Library from './pages/Library/Library';
import Player from './pages/Player/Player';
import AdminLogin from './pages/Admin/Login';
import BookCelebration from './pages/BookCelebration/BookCelebration';
import AdminDashboard from './pages/Admin/Dashboard';
import ProfileSelection from './pages/ProfileSelection/ProfileSelection';

// Protected Route Component for Admin
const ProtectedAdminRoute = ({ children }) => {
  const isAdmin = useStore((state) => state.isAdmin);
  return isAdmin ? children : <Navigate to="/admin/login" replace />;
};

// Protected Route Component for Profile
const ProtectedProfileRoute = ({ children }) => {
  const activeProfileId = useStore((state) => state.activeProfileId);
  return activeProfileId ? children : <Navigate to="/profiles" replace />;
};

function App() {
  const { books, addBook, setDiscussionQuestions } = useStore();

  React.useEffect(() => {
    const initData = async () => {
      const questions = await loadDiscussionQuestions();
      setDiscussionQuestions(questions);
    };
    initData();
  }, [setDiscussionQuestions]);

  const removeBook = useStore((state) => state.removeBook);

  React.useEffect(() => {
    const autoSync = async () => {
      // Auto-sync for new users sharing the link
      if (books.length === 0) {
        try {
          // Check Cache First
          const cachedBooks = await getDriveCache();
          if (cachedBooks && cachedBooks.length > 0) {
            for (const book of cachedBooks) {
              addBook(book);
            }
            return;
          }

          const fetchedBooks = await fetchBooksFromDrive();
          for (const book of fetchedBooks) {
            if (!book.hasCustomCover) {
              const coverUrl = await fetchBookCover(book.title);
              if (coverUrl) book.coverUrl = coverUrl;
            }
            addBook(book);
          }
          
          // Save to Cache
          setDriveCache(fetchedBooks);
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
        <Routes>
          <Route path="/profiles" element={<ProfileSelection />} />
          
          {/* Kid Mode */}
          <Route path="/" element={<ProtectedProfileRoute><Library /></ProtectedProfileRoute>} />
          <Route path="/read/:bookId" element={<ProtectedProfileRoute><Player /></ProtectedProfileRoute>} />
          <Route path="/book-celebration/:bookId" element={<ProtectedProfileRoute><BookCelebration /></ProtectedProfileRoute>} />
          
          {/* Admin Mode */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
