import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { LogOut, RefreshCw, Trash2, BookOpen, Key, Link, ArrowLeft } from 'lucide-react';
import { fetchBooksFromDrive } from '../../services/googleDrive';
import { fetchBookCover } from '../../services/googleBooks';
import { clearDriveCache, setDriveCache } from '../../lib/driveCache';
import PINEntry from '../../components/ParentDashboard/PINEntry';
import DashboardOverview from '../../components/ParentDashboard/DashboardOverview';
import ListeningStats from '../../components/ParentDashboard/ListeningStats';

export default function Dashboard() {
  const { books, addBook, removeBook, setAdminStatus } = useStore();
  const navigate = useNavigate();
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <PINEntry onSuccess={() => setIsAuthenticated(true)} />;
  }

  const syncLibrary = async () => {
    setIsSyncing(true);
    setStatusMsg('Connecting to Google Drive...');
    try {
      await clearDriveCache();
      const fetchedBooks = await fetchBooksFromDrive();
      if (fetchedBooks.length === 0) {
        setStatusMsg('No audiobooks found.');
        setIsSyncing(false);
        return;
      }
      setStatusMsg(`Found ${fetchedBooks.length} books. Fetching cover images...`);
      for (const book of fetchedBooks) {
        if (!book.hasCustomCover) {
          const coverUrl = await fetchBookCover(book.title);
          if (coverUrl) book.coverUrl = coverUrl;
        }
        if (books.find(b => b.id === book.id)) removeBook(book.id);
        addBook(book);
      }
      await setDriveCache(fetchedBooks);
      setStatusMsg(`Success! Synced ${fetchedBooks.length} books.`);
    } catch (err) {
      console.error(err);
      setStatusMsg(err.message || 'Failed to sync.');
    }
    setIsSyncing(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ margin: 0, textAlign: 'left' }}>Parent Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage Rowan's library here</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn-secondary"
            onClick={syncLibrary}
            disabled={isSyncing}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={20} className={isSyncing ? 'spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync Library'}
          </button>
          <button 
            className="btn-icon" 
            onClick={() => {
              setIsAuthenticated(false);
              navigate('/');
            }} 
            title="Logout"
          >
            <LogOut size={24} />
          </button>
        </div>
      </div>

      {statusMsg && (
        <div style={{ 
          padding: '1rem', 
          background: 'var(--primary)', 
          color: 'white', 
          borderRadius: '12px',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          {statusMsg}
        </div>
      )}

      <DashboardOverview />
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        <ListeningStats />

        <div style={{ background: 'var(--surface-color)', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0 }}>Library Details ({books.length} Books)</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {books.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Library is empty.</p>
            ) : (
              books.map(book => (
                <div key={book.id} style={{ display: 'flex', alignItems: 'center', padding: '1rem', borderRadius: 'var(--radius-md)', gap: '1rem', border: '1px solid var(--border)' }}>
                  <img src={book.coverUrl} alt={book.title} style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0 }}>{book.title}</h4>
                    {book.series && (
                      <div style={{ 
                        display: 'inline-block',
                        background: 'rgba(255, 107, 107, 0.1)', 
                        color: 'var(--primary)', 
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}>
                        Series: {book.series}
                      </div>
                    )}
                  </div>
                  <button onClick={() => removeBook(book.id)} style={{ color: 'var(--primary)', padding: '0.5rem' }}>
                    <Trash2 size={24} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
