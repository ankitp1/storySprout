import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { Play, Settings, Users, Eye, Search, Filter } from 'lucide-react';
const formatTime = (timeInSeconds) => {
  if (!timeInSeconds) return '0:00';
  const m = Math.floor(timeInSeconds / 60);
  const s = Math.floor(timeInSeconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const BookCard = ({ book, progress, readBooks, navigate, isGrid = false, ratings }) => (
  <div 
    onClick={() => navigate(`/read/${book.id}`)}
    style={{
      background: 'var(--surface-color)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      boxShadow: 'var(--shadow-md)',
      cursor: 'pointer',
      transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
      width: isGrid ? '100%' : '250px',
      flexShrink: 0
    }}
    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)'}
    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
  >
    <div style={{ 
      width: '100%', 
      aspectRatio: '3/4', 
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
      marginBottom: '1.5rem',
      position: 'relative'
    }}>
      <img 
        src={book.coverUrl} 
        alt={book.title} 
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      {/* Play Button Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0,
        transition: 'opacity 0.2s',
      }}
      className="play-overlay"
      >
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'var(--primary)', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(255, 107, 107, 0.5)'
        }}>
          <Play size={32} fill="currentColor" style={{ marginLeft: '4px' }} />
        </div>
      </div>

      {readBooks.includes(book.id) ? (
        <div style={{
          position: 'absolute', top: '10px', right: '10px',
          background: '#4caf50', color: 'white', padding: '4px 12px',
          borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}>
          ⭐ Finished!
        </div>
      ) : progress[book.id] && progress[book.id].currentTime > 0 ? (
        <div style={{
          position: 'absolute', top: '10px', right: '10px',
          background: 'var(--primary)', color: 'white', padding: '4px 12px',
          borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}>
          ▶ Resume at {formatTime(progress[book.id].currentTime)}
        </div>
      ) : null}

      {/* Ratings Badge */}
      {ratings[book.id] && (
        <div style={{
          position: 'absolute', bottom: '10px', right: '10px',
          background: 'white', color: '#FFD700', padding: '4px 8px',
          borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: '4px'
        }}>
          ⭐ {ratings[book.id]}/5
        </div>
      )}
    </div>
    <h3 style={{ margin: 0, textAlign: 'center', fontSize: '1.5rem', width: '100%', wordWrap: 'break-word', lineHeight: '1.2' }}>{book.title}</h3>
    
    <style>{`
      div:hover > .play-overlay {
        opacity: 1 !important;
      }
    `}</style>
  </div>
);

export default function Library() {
  const books = useStore(state => state.books);
  const activeProfileId = useStore(state => state.activeProfileId);
  const profiles = useStore(state => state.profiles);
  const progress = useStore(state => state.progress[state.activeProfileId] || {});
  const readBooks = useStore(state => state.readBooks[state.activeProfileId] || []);
  const ratings = useStore(state => state.ratings?.[state.activeProfileId] || {});
  const listeningStats = useStore(state => state.listeningStats[state.activeProfileId] || {});
  const isHighContrast = useStore(state => state.isHighContrast);
  const toggleHighContrast = useStore(state => state.toggleHighContrast);
  const navigate = useNavigate();
  
  const activeProfile = profiles.find(p => p.id === activeProfileId);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All'); // 'All', 'Completed', 'Favorites', 'Series'
  const [sortBy, setSortBy] = useState('Title'); // 'Title', 'Last Played'

  const handleAdminClick = () => {
    navigate('/admin/login');
  };

  const handleSwitchProfile = () => {
    useStore.getState().setActiveProfile(null);
    navigate('/profiles');
  };

  // Filter & Sort Logic
  const processedBooks = books
    .filter(book => {
      // 1. Search Query
      if (searchQuery && !book.title.toLowerCase().includes(searchQuery.toLowerCase()) && !book.author?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // 2. Filters
      if (activeFilter === 'Completed' && !readBooks.includes(book.id)) return false;
      if (activeFilter === 'Favorites' && (ratings[book.id] || 0) < 3) return false;
      if (activeFilter === 'Series' && !book.seriesName) return false;
      
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'Title') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'Last Played') {
        const timeA = listeningStats[a.id]?.lastListenedAt ? new Date(listeningStats[a.id].lastListenedAt).getTime() : 0;
        const timeB = listeningStats[b.id]?.lastListenedAt ? new Date(listeningStats[b.id].lastListenedAt).getTime() : 0;
        return timeB - timeA; // Descending
      }
      return 0;
    });

  // Grouping
  const seriesGroups = processedBooks.reduce((acc, book) => {
    if (book.seriesName) {
      if (!acc[book.seriesName]) acc[book.seriesName] = [];
      acc[book.seriesName].push(book);
    }
    return acc;
  }, {});

  const standaloneBooks = processedBooks.filter(b => !b.seriesName);
  const isFiltering = searchQuery !== '' || activeFilter !== 'All' || sortBy !== 'Title';

  return (
    <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '3rem', color: 'var(--primary)', textShadow: '2px 2px 0px rgba(0,0,0,0.1)', margin: 0 }}>
            {activeProfile ? `${activeProfile.name}'s Library` : 'StorySprout 🌱'}
          </h1>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          {/* High Contrast Button */}
          <button 
            className="btn-icon" 
            onClick={toggleHighContrast}
            title="Toggle High Contrast Mode"
            style={{ 
              background: isHighContrast ? 'var(--primary)' : 'white',
              color: isHighContrast ? 'white' : 'var(--text-main)'
            }}
          >
            <Eye size={24} />
          </button>
          
          {/* Switch Profile Button */}
          <button 
            onClick={handleSwitchProfile}
            style={{ color: 'var(--text-muted)', opacity: 0.5, padding: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}
            title="Switch Profile"
          >
            <Users size={24} />
          </button>
          
          {/* Admin Button */}
          <button 
            onClick={handleAdminClick}
            style={{ color: 'var(--text-muted)', opacity: 0.5, padding: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}
            title="Admin"
          >
            <Settings size={24} />
          </button>
        </div>
      </div>

      {/* Discovery & Filters Toolbar */}
      <div style={{ marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Search & Sort Row */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
            <Search size={24} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search books or authors..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem 1rem 1rem 3.5rem',
                borderRadius: '16px',
                border: '2px solid var(--border)',
                fontSize: '1.1rem',
                background: 'var(--surface-color)',
                color: 'var(--text-main)'
              }}
            />
          </div>
          
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '1rem',
              borderRadius: '16px',
              border: '2px solid var(--border)',
              fontSize: '1.1rem',
              background: 'var(--surface-color)',
              color: 'var(--text-main)',
              cursor: 'pointer'
            }}
          >
            <option value="Title">Sort A-Z</option>
            <option value="Last Played">Last Played</option>
          </select>
        </div>

        {/* Filter Pills Row */}
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {['All', 'Completed', 'Favorites', 'Series'].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '24px',
                border: 'none',
                background: activeFilter === filter ? 'var(--primary)' : 'var(--surface-color)',
                color: activeFilter === filter ? 'white' : 'var(--text-main)',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background 0.2s',
                boxShadow: activeFilter === filter ? 'var(--shadow-sm)' : 'none'
              }}
            >
              {filter === 'Favorites' && '⭐ '}
              {filter}
            </button>
          ))}
        </div>
      </div>

      {books.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <img src="https://illustrations.popsy.co/amber/reading.svg" alt="Reading" style={{ width: '300px', opacity: 0.5 }} />
          <h2 style={{ color: 'var(--text-muted)', marginTop: '2rem' }}>No books yet! Ask a parent to add some.</h2>
        </div>
      ) : (
        <div style={{ paddingBottom: '4rem' }}>
          
          {/* If filtering/searching, show flat grid */}
          {isFiltering ? (
            <div>
              <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>
                Results ({processedBooks.length})
              </h2>
              {processedBooks.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>No books found.</p>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '2.5rem'
                }}>
                  {processedBooks.map(book => (
                    <BookCard key={book.id} book={book} progress={progress} readBooks={readBooks} ratings={ratings} navigate={navigate} isGrid={true} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Normal grouped view */
            <>
              {Object.entries(seriesGroups).map(([seriesName, seriesBooks]) => (
                <div key={seriesName} style={{ marginBottom: '3rem' }}>
                  <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>{seriesName}</h2>
                  <div style={{ 
                    display: 'flex', 
                    gap: '2rem', 
                    overflowX: 'auto', 
                    paddingBottom: '2rem',
                    paddingTop: '1rem',
                    scrollSnapType: 'x mandatory'
                  }}>
                    {seriesBooks.map(book => (
                      <div key={book.id} style={{ scrollSnapAlign: 'start' }}>
                        <BookCard book={book} progress={progress} readBooks={readBooks} ratings={ratings} navigate={navigate} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {standaloneBooks.length > 0 && (
                <div>
                  <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>More Books</h2>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '2.5rem'
                  }}>
                    {standaloneBooks.map(book => (
                      <BookCard key={book.id} book={book} progress={progress} readBooks={readBooks} ratings={ratings} navigate={navigate} isGrid={true} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      )}
    </div>
  );
}
