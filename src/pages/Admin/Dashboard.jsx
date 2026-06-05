import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { LogOut, RefreshCw, Trash2, BookOpen, Key, Link } from 'lucide-react';
import { fetchBooksFromDrive } from '../../services/googleDrive';
import { fetchBookCover } from '../../services/googleBooks';

export default function Dashboard() {
  const { books, addBook, removeBook, setAdminStatus } = useStore();
  const navigate = useNavigate();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleLogout = () => {
    navigate('/');
    setTimeout(() => {
      setAdminStatus(false);
    }, 100);
  };

  const handleSyncDrive = async (e) => {
    e.preventDefault();
    
    setIsProcessing(true);
    setStatusMsg('Connecting to Google Drive...');

    try {
      const fetchedBooks = await fetchBooksFromDrive();
      
      if (fetchedBooks.length === 0) {
        setStatusMsg('No audiobooks found. Make sure the folder contains subfolders with audio files.');
        setIsProcessing(false);
        return;
      }

      setStatusMsg(`Found ${fetchedBooks.length} books. Fetching cover images...`);

      // Fetch covers and add to library
      for (const book of fetchedBooks) {
        if (!book.hasCustomCover) {
          const coverUrl = await fetchBookCover(book.title);
          if (coverUrl) {
            book.coverUrl = coverUrl;
          }
        }
        
        // Remove existing book if it has same ID to prevent duplicates
        if (books.find(b => b.id === book.id)) {
          removeBook(book.id);
        }
        
        addBook(book);
      }

      setStatusMsg(`Success! Synced ${fetchedBooks.length} books to the library.`);
    } catch (err) {
      console.error(err);
      setStatusMsg(err.message || 'Failed to sync with Google Drive.');
    }
    
    setIsProcessing(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ margin: 0, textAlign: 'left' }}>Parent Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage Rowan's library here</p>
        </div>
        <button onClick={handleLogout} className="btn-icon" style={{ width: '48px', height: '48px', color: 'var(--text-main)' }}>
          <LogOut size={24} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '3rem' }}>
        {/* Drive Sync Form */}
        <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
          <h3>Google Drive Sync</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Sync your audiobook folder directly from the hardcoded backend configuration.
          </p>
          
          <form onSubmit={handleSyncDrive} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button type="submit" disabled={isProcessing} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', opacity: isProcessing ? 0.5 : 1 }}>
              <RefreshCw size={20} className={isProcessing ? "spin" : ""} /> 
              {isProcessing ? 'Syncing Library...' : 'Sync Now'}
            </button>
            
            {statusMsg && (
              <div style={{ 
                padding: '0.75rem', 
                marginTop: '1rem', 
                borderRadius: '8px', 
                fontSize: '0.85rem',
                background: statusMsg.includes('Failed') ? '#ffebee' : 'var(--bg-color)',
                color: statusMsg.includes('Failed') ? '#c62828' : 'var(--text-main)'
              }}>
                {statusMsg}
              </div>
            )}
          </form>
        </div>

        {/* Manage Books */}
        <div>
          <h3>Current Library ({books.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
            {books.length === 0 ? (
              <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-md)' }}>
                <BookOpen size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--text-muted)' }}>Library is empty. Sync from Google Drive!</p>
              </div>
            ) : (
              books.map(book => (
                <div key={book.id} className="glass" style={{ display: 'flex', alignItems: 'center', padding: '1rem', borderRadius: 'var(--radius-md)', gap: '1rem' }}>
                  <img src={book.coverUrl} alt={book.title} style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
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
                        fontWeight: 'bold',
                        marginTop: '4px',
                        marginBottom: '4px'
                      }}>
                        Series: {book.series}
                      </div>
                    )}
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                      {book.chapters?.length || 0} audio tracks
                    </p>
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

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  background: 'var(--surface-color)',
  color: 'var(--text-main)',
  fontFamily: 'var(--font-sans)'
};
