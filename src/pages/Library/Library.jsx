import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { Play, Settings, Users, Search, Lock, Unlock, HelpCircle, Sun, Moon, Download, Trash2, X } from 'lucide-react';
import { getFallbackCover } from '../../lib/coverUtils';
import PINEntry from '../../components/ParentDashboard/PINEntry';
import OnboardingTour from '../../components/OnboardingTour';

const PREMIUM_AVATARS = [
  { emoji: '👑', color: '#FFD700', cost: 100, name: 'King' },
  { emoji: '🤖', color: '#9E9E9E', cost: 100, name: 'Robot' },
  { emoji: '🐉', color: '#4CAF50', cost: 100, name: 'Dragon' },
  { emoji: '👸', color: '#E91E63', cost: 100, name: 'Princess' },
  { emoji: '🧙‍♂️', color: '#673AB7', cost: 100, name: 'Wizard' },
  { emoji: '👽', color: '#00BCD4', cost: 100, name: 'Alien' },
  { emoji: '🦁', color: '#FF9800', cost: 200, name: 'Lion' },
  { emoji: '🦄', color: '#FF4081', cost: 200, name: 'Unicorn' }
];
const formatTime = (timeInSeconds) => {
  if (!timeInSeconds) return '0:00';
  const m = Math.floor(timeInSeconds / 60);
  const s = Math.floor(timeInSeconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const BookCard = ({ 
  book, 
  progress, 
  readBooks, 
  onBookClick, 
  isGrid = false, 
  ratings, 
  ratio = '2/3', 
  dataTour,
  isDownloaded,
  isDownloading,
  downloadProgress,
  downloadBook,
  removeDownloadedBook
}) => {
  const [imgError, setImgError] = useState(false);
  const [offlineCoverUrl, setOfflineCoverUrl] = useState(null);

  React.useEffect(() => {
    let active = true;
    let objectUrl = null;
    const loadOfflineCover = async () => {
      if (isDownloaded) {
        try {
          const { getOfflineCover } = await import('../../lib/offlineDb');
          const blob = await getOfflineCover(book.id);
          if (blob && active) {
            objectUrl = URL.createObjectURL(blob);
            setOfflineCoverUrl(objectUrl);
          }
        } catch (e) {
          console.error('Error loading offline cover:', e);
        }
      } else {
        setOfflineCoverUrl(null);
      }
    };
    loadOfflineCover();
    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [isDownloaded, book.id]);

  const coverSrc = offlineCoverUrl || ((imgError || !book.coverUrl) ? getFallbackCover(book.title, 400, 600) : book.coverUrl);

  return (
    <div 
      onClick={() => onBookClick(book)}
      data-tour={dataTour}
      className="book-card"
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
        aspectRatio: ratio, 
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '1.5rem',
        position: 'relative'
      }}>
        <img 
          src={coverSrc} 
          alt={book.title} 
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        
        {/* Download Button Overlay */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            if (isDownloaded) {
              if (window.confirm(`Remove offline download for "${book.title}"?`)) {
                removeDownloadedBook(book);
              }
            } else if (!isDownloading) {
              downloadBook(book);
            }
          }}
          style={{
            position: 'absolute', top: '10px', left: '10px',
            background: isDownloaded ? 'rgba(76, 175, 80, 0.95)' : isDownloading ? 'var(--primary)' : 'rgba(0,0,0,0.5)',
            color: 'white', width: '36px', height: '36px',
            borderRadius: '50%', fontSize: '0.8rem', fontWeight: 'bold',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10,
            cursor: 'pointer',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title={isDownloaded ? "Delete offline download" : isDownloading ? `Downloading: ${downloadProgress?.status || ''}` : "Download for offline listening"}
        >
          {isDownloading ? (
            <span style={{ fontSize: '0.7rem' }}>
              {Math.round((downloadProgress.current / downloadProgress.total) * 100)}%
            </span>
          ) : isDownloaded ? (
            <Trash2 size={16} />
          ) : (
            <Download size={16} />
          )}
        </div>

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
            background: 'var(--primary)', color: 'var(--btn-text-color, white)',
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
            background: 'var(--primary)', color: 'var(--btn-text-color, white)', padding: '4px 12px',
            borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
          }}>
            ▶ Resume {formatTime(progress[book.id].currentTime)}
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
};

export default function Library() {
  const books = useStore(state => state.books);
  const activeProfileId = useStore(state => state.activeProfileId);
  const profiles = useStore(state => state.profiles);
  const progressMap = useStore(state => state.progress[state.activeProfileId]);
  const readBooksArr = useStore(state => state.readBooks[state.activeProfileId]);
  const ratingsMap = useStore(state => state.ratings?.[state.activeProfileId]);
  const listeningStatsMap = useStore(state => state.listeningStats[state.activeProfileId]);
  const approvedBooksArr = useStore(state => state.approvedBooks[state.activeProfileId]);
  const pointsVal = useStore(state => state.points[state.activeProfileId]);
  const unlockedAvatarsArr = useStore(state => state.unlockedAvatars[state.activeProfileId]);

  const progress = progressMap || {};
  const readBooks = readBooksArr || [];
  const ratings = ratingsMap || {};
  const listeningStats = listeningStatsMap || {};
  const approvedBooks = approvedBooksArr || [];
  const points = pointsVal || 0;
  const unlockedAvatars = unlockedAvatarsArr || [];
  
  const approveBook = useStore(state => state.approveBook);
  const unlockAvatar = useStore(state => state.unlockAvatar);
  const updateProfile = useStore(state => state.updateProfile);
  const isDarkMode = useStore(state => state.isDarkMode);
  const toggleDarkMode = useStore(state => state.toggleDarkMode);
  const navigate = useNavigate();

  // Offline support
  const downloadedBooks = useStore(state => state.downloadedBooks || {});
  const downloadProgress = useStore(state => state.downloadProgress || {});
  const initDownloads = useStore(state => state.initDownloads);
  const downloadBook = useStore(state => state.downloadBook);
  const removeDownloadedBook = useStore(state => state.removeDownloadedBook);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  React.useEffect(() => {
    if (books && books.length > 0) {
      initDownloads(books);
    }
  }, [books, initDownloads]);

  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const completedTours = useStore(state => state.completedTours || {});
  const completeTour = useStore(state => state.completeTour);
  const [isTourActive, setIsTourActive] = useState(false);

  React.useEffect(() => {
    if (activeProfileId && completedTours[activeProfileId] === undefined) {
      const timer = setTimeout(() => {
        setIsTourActive(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [activeProfileId, completedTours]);

  const handleTourComplete = () => {
    setIsTourActive(false);
    if (activeProfileId) {
      completeTour(activeProfileId);
    }
  };

  const startTour = () => {
    setIsTourActive(true);
  };

  const tourSteps = [
    {
      title: "Welcome to StorySprout! 🌱",
      content: "StorySprout is a magical interactive audiobook player for kids. Let's take a quick 1-minute tour to find all the cool features!",
      icon: "✨"
    },
    {
      selector: '[data-tour="profile"]',
      title: "Kid Profiles",
      content: "This is your kid's profile! Multiple kids can share the app, each with their own character, progress, and optional 4-digit PIN security.",
      icon: "🦊"
    },
    /* {
      selector: '[data-tour="shop"]',
      title: "🌱 Earn Points & Avatar Shop",
      content: "Listen to books to earn points! Tap this badge to spend points in the shop to unlock fun premium profile emojis.",
      icon: "🛍️"
    }, */
    {
      selector: '[data-tour="search"]',
      title: "Search Library",
      content: "Tap the magnifying glass to search for books by title or author instantly.",
      icon: "🔍"
    },
    {
      selector: '[data-tour="filters"]',
      title: "Quick Filters",
      content: "Quickly filter to show only completed books, favorites (rated 3+ stars), or grouped series.",
      icon: "⚡"
    },
    {
      selector: '[data-tour="parent-zone"]',
      title: "Parent Zone 🔐",
      content: "Protected by a secure PIN. Tap this gear to sync audiobooks, check stats, approve/restrict books, manage session limits, reset profile PINs, or email developer support logs.",
      icon: "🛡️"
    },
    {
      selector: '[data-tour="book-card"]',
      title: "Let's Start Listening!",
      content: "Tap any book to open the playful audio player. Features include smart resume, sleep timer, offline play support, and kid-friendly discussion questions!",
      icon: "🎧"
    }
  ];

  const activeProfile = profiles.find(p => p.id === activeProfileId);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All'); // 'All', 'Completed', 'Favorites', 'Series'
  const [sortBy, setSortBy] = useState('Title'); // 'Title', 'Last Played'

  // PIN Gate State
  const [pendingApprovalBook, setPendingApprovalBook] = useState(null);

  // Avatar Shop State
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [modalImgError, setModalImgError] = useState(false);

  const handleBookClick = (book) => {
    const hasProgress = progress[book.id] && progress[book.id].currentTime > 0;
    const isFinished = readBooks.includes(book.id);
    const isExplicitlyApproved = approvedBooks.includes(book.id);

    if (hasProgress || isFinished || isExplicitlyApproved) {
      navigate(`/read/${book.id}`);
    } else {
      setPendingApprovalBook(book);
    }
  };

  const handleAdminClick = () => {
    navigate('/admin');
  };

  const handleSwitchProfile = () => {
    useStore.getState().setActiveProfile(null);
    navigate('/profiles');
  };

  // Filter & Sort Logic
  const processedBooks = books
    .filter(book => {
      // Offline mode: only show downloaded books
      if (isOffline && !downloadedBooks[book.id]) {
        return false;
      }

      // 1. Search Query
      if (searchQuery && !book.title.toLowerCase().includes(searchQuery.toLowerCase()) && !book.author?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // 2. Filters
      if (activeFilter === 'Completed' && !readBooks.includes(book.id)) return false;
      if (activeFilter === 'Favorites' && (ratings[book.id] || 0) < 3) return false;
      if (activeFilter === 'Series' && !book.series) return false;
      if (activeFilter === 'Downloaded' && !downloadedBooks[book.id]) return false;
      
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
    if (book.series) {
      if (!acc[book.series]) acc[book.series] = [];
      acc[book.series].push(book);
    }
    return acc;
  }, {});

  const standaloneBooks = processedBooks.filter(b => !b.series);
  const isFiltering = searchQuery !== '' || activeFilter !== 'All' || sortBy !== 'Title';

  return (
    <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }} className="library-main-container">
      {/* Header */}
      <div className="library-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '3rem', color: 'var(--primary)', textShadow: '2px 2px 0px rgba(0,0,0,0.1)', margin: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {activeProfile && (
              <div 
                data-tour="profile"
                style={{ width: '60px', height: '60px', borderRadius: '50%', background: activeProfile.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}
                title={`${activeProfile.name}'s Profile`}
              >
                {activeProfile.avatar}
              </div>
            )}
            StorySprout 🌱
            {activeProfile && <span style={{ fontSize: '1.2rem', marginLeft: '0.5rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>({activeProfile.name}'s Library)</span>}
          </h1>
        </div>
        
        <div className="library-header-controls" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* Points Display / Shop Trigger (HIDDEN FOR NOW) */}
          {/* 
          {activeProfile && (
            <button 
              onClick={() => setIsShopOpen(true)}
              data-tour="shop"
              style={{
                background: 'var(--primary)',
                color: 'var(--btn-text-color, white)',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '24px',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)'
              }}
              title="Avatar Shop"
            >
              🌱 {points} Pts
            </button>
          )} 
          */}

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* Theme Toggle Button */}
            <button 
              className="btn-icon" 
              onClick={toggleDarkMode}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              style={{ 
                background: 'var(--surface-color)',
                color: 'var(--text-main)'
              }}
            >
              {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>
            
            {/* Help Tour Button */}
            <button 
              className="btn-icon" 
              onClick={startTour}
              title="Help Tour"
              style={{ 
                background: 'var(--surface-color)',
                color: 'var(--text-main)'
              }}
            >
              <HelpCircle size={24} />
            </button>
            
            {/* Switch Profile Button */}
            <button 
              onClick={handleSwitchProfile}
              style={{ color: 'var(--text-muted)', opacity: 0.7, padding: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Switch Profile"
            >
              <Users size={24} />
            </button>
            
            {/* Admin Button */}
            <button 
              onClick={handleAdminClick}
              data-tour="parent-zone"
              style={{ color: 'var(--text-muted)', opacity: 0.7, padding: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Admin"
            >
              <Settings size={24} />
            </button>
          </div>
        </div>
      </div>

      {isOffline && (
        <div style={{
          background: 'rgba(255, 107, 107, 0.15)',
          border: '2px dashed var(--primary)',
          color: 'var(--text-main)',
          padding: '1rem',
          borderRadius: '16px',
          marginBottom: '2rem',
          textAlign: 'center',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <span>📶 You are offline! Showing only downloaded books.</span>
        </div>
      )}

      {/* Discovery & Filters Toolbar */}
      <div style={{ marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Filter Pills & Search Row */}
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem', alignItems: 'center' }}>
          
          {/* Collapsible Search */}
          <div data-tour="search" style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: isSearchExpanded ? 1 : 'none', minWidth: isSearchExpanded ? '250px' : 'auto' }}>
            {!isSearchExpanded ? (
              <button
                className="btn-icon"
                onClick={() => setIsSearchExpanded(true)}
                style={{
                  background: 'var(--surface-color)',
                  color: 'var(--text-main)',
                  border: '2px solid var(--border)',
                  flexShrink: 0
                }}
                title="Search Books"
              >
                <Search size={24} />
              </button>
            ) : (
              <>
                <Search size={24} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="Search books or authors..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '1rem 3.5rem 1rem 3.5rem',
                    borderRadius: '24px',
                    border: '2px solid var(--border)',
                    fontSize: '1.1rem',
                    background: 'var(--surface-color)',
                    color: 'var(--text-main)',
                    minWidth: '250px'
                  }}
                />
                <button
                  onClick={() => {
                    setIsSearchExpanded(false);
                    setSearchQuery('');
                  }}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    borderRadius: '50%'
                  }}
                  title="Clear search"
                >
                  <X size={20} />
                </button>
              </>
            )}
          </div>

          <div style={{ width: '1px', height: '32px', background: 'var(--border)', margin: '0 0.25rem', flexShrink: 0 }}></div>

          <div data-tour="filters" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {['All', 'Completed', 'Favorites', 'Series', 'Downloaded'].map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '24px',
                  border: '2px solid var(--border)',
                  background: activeFilter === filter ? 'var(--primary)' : 'var(--surface-color)',
                  color: activeFilter === filter ? 'var(--btn-text-color, white)' : 'var(--text-main)',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
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
                <div className="book-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '2.5rem'
                }}>
                  {processedBooks.map((book, idx) => (
                    <BookCard 
                      key={book.id} 
                      book={book} 
                      progress={progress} 
                      readBooks={readBooks} 
                      ratings={ratings} 
                      onBookClick={handleBookClick} 
                      isGrid={true} 
                      dataTour={idx === 0 ? "book-card" : undefined} 
                      isDownloaded={!!downloadedBooks[book.id]}
                      isDownloading={!!downloadProgress[book.id]}
                      downloadProgress={downloadProgress[book.id]}
                      downloadBook={downloadBook}
                      removeDownloadedBook={removeDownloadedBook}
                    />
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
                    {seriesBooks.map((book, idx) => (
                      <div key={book.id} style={{ scrollSnapAlign: 'start' }}>
                        <BookCard 
                          book={book} 
                          progress={progress} 
                          readBooks={readBooks} 
                          ratings={ratings} 
                          onBookClick={handleBookClick} 
                          dataTour={idx === 0 ? "book-card" : undefined} 
                          isDownloaded={!!downloadedBooks[book.id]}
                          isDownloading={!!downloadProgress[book.id]}
                          downloadProgress={downloadProgress[book.id]}
                          downloadBook={downloadBook}
                          removeDownloadedBook={removeDownloadedBook}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {standaloneBooks.length > 0 && (
                <div>
                  <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>More Books</h2>
                  <div className="book-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    gap: '2.5rem'
                  }}>
                    {standaloneBooks.map((book, idx) => (
                      <BookCard 
                        key={book.id} 
                        book={book} 
                        progress={progress} 
                        readBooks={readBooks} 
                        ratings={ratings} 
                        onBookClick={handleBookClick} 
                        isGrid={true} 
                        dataTour={idx === 0 ? "book-card" : undefined} 
                        isDownloaded={!!downloadedBooks[book.id]}
                        isDownloading={!!downloadProgress[book.id]}
                        downloadProgress={downloadProgress[book.id]}
                        downloadBook={downloadBook}
                        removeDownloadedBook={removeDownloadedBook}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      )}

      {/* PIN Gate Modal */}
      {pendingApprovalBook && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <PINEntry 
            isModal={true}
            onCancel={() => setPendingApprovalBook(null)}
            onSuccess={() => {
              approveBook(pendingApprovalBook.id);
              navigate(`/read/${pendingApprovalBook.id}`);
            }} 
          />
        </div>
      )}

      {/* Avatar Shop Modal */}
      {isShopOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--surface-color)',
            padding: '2rem',
            borderRadius: '24px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            <button 
              onClick={() => setIsShopOpen(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              ×
            </button>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0' }}>Avatar Shop 🛍️</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', margin: 0 }}>You have <strong style={{ color: 'var(--primary)' }}>🌱 {points} Points</strong></p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '1.5rem'
            }}>
              {PREMIUM_AVATARS.map(avatar => {
                const isUnlocked = unlockedAvatars.includes(avatar.emoji);
                const isEquipped = activeProfile?.avatar === avatar.emoji;
                const canAfford = points >= avatar.cost;

                return (
                  <div key={avatar.emoji} style={{
                    background: 'var(--bg-color)',
                    borderRadius: '16px',
                    padding: '1rem',
                    textAlign: 'center',
                    border: isEquipped ? `3px solid ${avatar.color}` : '3px solid transparent',
                    display: 'flex', flexDirection: 'column', alignItems: 'center'
                  }}>
                    <div style={{
                      width: '60px', height: '60px', borderRadius: '50%',
                      background: avatar.color, fontSize: '2rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: '1rem',
                      opacity: isUnlocked || canAfford ? 1 : 0.5
                    }}>
                      {avatar.emoji}
                    </div>
                    
                    {isUnlocked ? (
                      <button 
                        className="btn-secondary"
                        style={{ width: '100%', padding: '0.5rem', fontSize: '0.9rem', background: isEquipped ? 'var(--primary)' : 'var(--surface-color)', color: isEquipped ? 'white' : 'var(--text-main)' }}
                        onClick={() => updateProfile(activeProfileId, { avatar: avatar.emoji, color: avatar.color })}
                      >
                        {isEquipped ? 'Equipped' : 'Equip'}
                      </button>
                    ) : (
                      <button 
                        className="btn-primary"
                        disabled={!canAfford}
                        style={{ width: '100%', padding: '0.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        onClick={() => {
                          unlockAvatar(avatar.emoji, avatar.cost);
                        }}
                      >
                        {canAfford ? <Unlock size={14} /> : <Lock size={14} />}
                        {avatar.cost} Pts
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Tour */}
      <OnboardingTour 
        steps={tourSteps} 
        active={isTourActive} 
        onComplete={handleTourComplete} 
      />
    </div>
  );
}
