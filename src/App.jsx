import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useStore from './store/useStore';

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
