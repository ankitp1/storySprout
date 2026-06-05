import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useStore from './store/useStore';
import { fetchBooksFromDrive } from './services/googleDrive';
import { fetchBookCover } from './services/googleBooks';

// Pages
import Library from './pages/Library/Library';
import Player from './pages/Player/Player';
import AdminLogin from './pages/Admin/Login';
import AdminDashboard from './pages/Admin/Dashboard';

// Protected Route Component for Admin
const AdminRoute = ({ children }) => {
  const isAdmin = useStore((state) => state.isAdmin);
  return isAdmin ? children : <Navigate to="/admin/login" />;
};

function App() {
  const books = useStore((state) => state.books);
  const addBook = useStore((state) => state.addBook);
  const removeBook = useStore((state) => state.removeBook);

  React.useEffect(() => {
    const autoSync = async () => {
      // Auto-sync for new users sharing the link
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
        <Routes>
          {/* Kid Mode */}
          <Route path="/" element={<Library />} />
          <Route path="/read/:bookId" element={<Player />} />
          
          {/* Admin Mode */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
