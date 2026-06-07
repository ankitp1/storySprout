import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { LogOut, RefreshCw, Trash2, Info, BookOpen, Key, Link, ArrowLeft, ExternalLink } from 'lucide-react';
import { fetchBooksFromDrive } from '../../services/googleDrive';
import { fetchBookCover, fetchBookDetails } from '../../services/googleBooks';
import { clearDriveCache, setDriveCache } from '../../lib/driveCache';
import PINEntry from '../../components/ParentDashboard/PINEntry';
import DashboardOverview from '../../components/ParentDashboard/DashboardOverview';
import ListeningStats from '../../components/ParentDashboard/ListeningStats';

const getCleanSearchQuery = (title) => {
  if (!title) return '';
  // Replace modifier letters (like exotic colons) and regular colons/dashes with spaces
  let clean = title.replace(/[:\-꞉]/g, ' ');
  // Remove content in brackets or parentheses (e.g., [Unabridged], (Binaural))
  clean = clean.replace(/\[.*?\]|\(.*?\)/g, '');
  // Normalize extra spaces
  return clean.replace(/\s+/g, ' ').trim();
};

export default function Dashboard() {
  const { books, addBook, removeBook, isAdmin, setAdminStatus, profiles, activeProfileId, resetApprovedBooks, sessionLimits, setSessionLimit } = useStore();
  const navigate = useNavigate();
  const [isSyncing, setIsSyncing] = useState(false);
  const [imgError, setImgError] = useState({});
  const [statusMsg, setStatusMsg] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState(activeProfileId || (profiles[0]?.id || null));
  
  // Book Insights State
  const [selectedBookInfo, setSelectedBookInfo] = useState(null);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);

  // Use the global isAdmin state, and if not admin, use PINEntry to set it
  if (!isAdmin) {
    return <PINEntry onSuccess={() => setAdminStatus(true)} />;
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

  const openBookInsights = async (book) => {
    setIsFetchingInfo(true);
    setSelectedBookInfo({ ...book, loading: true });
    try {
      const details = await fetchBookDetails(book.title);
      setSelectedBookInfo({ ...book, details, loading: false });
    } catch (err) {
      console.error(err);
      setSelectedBookInfo({ ...book, error: 'Failed to load details', loading: false });
    }
    setIsFetchingInfo(false);
  };

  return (
    <div className="admin-container" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ margin: 0, textAlign: 'left' }}>Parent Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your StorySprout library here</p>
        </div>
        <div className="admin-header-controls" style={{ display: 'flex', gap: '1rem' }}>
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
              setAdminStatus(false);
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
          color: 'var(--btn-text-color, white)', 
          borderRadius: '12px',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          {statusMsg}
        </div>
      )}

      {profiles.length > 0 && (
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0 }}>Viewing Stats For:</h3>
          <select 
            value={selectedProfileId} 
            onChange={(e) => setSelectedProfileId(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '2px solid var(--border)',
              background: 'var(--surface-color)',
              color: 'var(--text-main)',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {profiles.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          
          {selectedProfileId && (
            <button
              onClick={() => {
                const profile = profiles.find(p => p.id === selectedProfileId);
                if (window.confirm(`Are you sure you want to reset all book approvals/permissions for ${profile ? profile.name : 'this profile'}? They will need a parent to approve books again.`)) {
                  resetApprovedBooks(selectedProfileId);
                  alert(`All approvals reset for ${profile ? profile.name : 'this profile'}.`);
                }
              }}
              className="btn-secondary"
              style={{ 
                borderColor: 'var(--primary)', 
                color: 'var(--primary)', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                fontSize: '0.9rem',
                padding: '0.5rem 1.25rem',
                height: '44px'
              }}
            >
              <Key size={16} />
              Reset Book Approvals
            </button>
          )}
        </div>
      )}

      {selectedProfileId && (
        <div style={{ 
          marginBottom: '2rem', 
          background: 'var(--surface-color)', 
          padding: '1.5rem', 
          borderRadius: '16px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Session Time Limit ⏳</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Limit how long books can be read in a single session before requiring the parent PIN.
            </p>
          </div>
          <select
            value={sessionLimits[selectedProfileId] || 0}
            onChange={(e) => setSessionLimit(selectedProfileId, parseInt(e.target.value, 10))}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '2px solid var(--border)',
              background: 'var(--bg-color)',
              color: 'var(--text-main)',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              minWidth: '160px'
            }}
          >
            <option value={0}>No Limit</option>
            <option value={1}>1 Minute (Testing)</option>
            <option value={15}>15 Minutes</option>
            <option value={30}>30 Minutes</option>
            <option value={45}>45 Minutes</option>
            <option value={60}>60 Minutes</option>
          </select>
        </div>
      )}

      <DashboardOverview profileId={selectedProfileId} />
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        <ListeningStats profileId={selectedProfileId} />

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
                  <img 
                    src={imgError[book.id] ? `https://placehold.co/60x80/e2e8f0/475569?text=Cover` : book.coverUrl} 
                    alt={book.title} 
                    onError={() => setImgError(prev => ({ ...prev, [book.id]: true }))}
                    style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} 
                  />
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
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => openBookInsights(book)} 
                      className="btn-icon"
                      title="Book Insights"
                      style={{ color: 'var(--text-main)', background: 'var(--bg-color)', padding: '0.5rem', borderRadius: '8px' }}
                    >
                      <Info size={20} />
                    </button>
                    <button onClick={() => removeBook(book.id)} style={{ color: 'var(--primary)', padding: '0.5rem' }}>
                      <Trash2 size={24} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Book Insights Modal */}
      {selectedBookInfo && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--surface-color)',
            padding: '2rem',
            borderRadius: '16px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            <button 
              onClick={() => setSelectedBookInfo(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              ×
            </button>
            
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
              <img 
                src={imgError['selected'] ? `https://placehold.co/80x120/e2e8f0/475569?text=Cover` : selectedBookInfo.coverUrl} 
                alt="Cover" 
                onError={() => setImgError(prev => ({ ...prev, selected: true }))}
                style={{ width: '80px', borderRadius: '8px' }} 
              />
              <div>
                <h2 style={{ margin: '0 0 0.5rem 0' }}>{selectedBookInfo.title}</h2>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>{selectedBookInfo.author}</p>
              </div>
            </div>

            {selectedBookInfo.loading ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading insights...</p>
            ) : selectedBookInfo.details ? (
              <div style={{ marginBottom: '2rem' }}>
                <p style={{ lineHeight: 1.6, fontSize: '1.1rem', color: 'var(--text-main)' }}>
                  {selectedBookInfo.details.description || 'No description available for this book.'}
                </p>
                <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {selectedBookInfo.details.pageCount && <span>Pages: {selectedBookInfo.details.pageCount}</span>}
                  {selectedBookInfo.details.publishedDate && <span>Published: {selectedBookInfo.details.publishedDate}</span>}
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--primary)' }}>{selectedBookInfo.error || 'Could not find details for this book.'}</p>
            )}

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Check Appropriateness & Reviews</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <a 
                  href={`https://www.amazon.com/s?k=${encodeURIComponent(getCleanSearchQuery(selectedBookInfo.title) + ' book review')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none' }}
                >
                  Search Amazon Reviews
                  <ExternalLink size={18} />
                </a>
                
                <a 
                  href={`https://www.commonsensemedia.org/search/${encodeURIComponent(getCleanSearchQuery(selectedBookInfo.title))}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none' }}
                >
                  Check Common Sense Media
                  <ExternalLink size={18} />
                </a>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
