import React from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { Play, Settings } from 'lucide-react';

const BookCard = ({ book, progress, readBooks, navigate, isGrid = false }) => (
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

      {/* Badges */}
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
          ▶ Resume
        </div>
      ) : null}
    </div>
    <h3 style={{ margin: 0, textAlign: 'center', fontSize: '1.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{book.title}</h3>
    
    <style>{`
      div:hover > .play-overlay {
        opacity: 1 !important;
      }
    `}</style>
  </div>
);

export default function Library() {
  const books = useStore(state => state.books);
  const progress = useStore(state => state.progress);
  const readBooks = useStore(state => state.readBooks);
  const navigate = useNavigate();

  // Group books by series
  const seriesGroups = {};
  const standaloneBooks = [];

  books.forEach(book => {
    if (book.series) {
      if (!seriesGroups[book.series]) seriesGroups[book.series] = [];
      seriesGroups[book.series].push(book);
    } else {
      standaloneBooks.push(book);
    }
  });

  return (
    <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', color: 'var(--primary)', textShadow: '2px 2px 0px rgba(0,0,0,0.1)' }}>
          StorySprout 🌱
        </h1>
        
        {/* Hidden Admin Button */}
        <button 
          onClick={() => navigate('/admin/login')}
          style={{ color: 'var(--text-muted)', opacity: 0.5, padding: '1rem' }}
        >
          <Settings size={24} />
        </button>
      </div>

      {books.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <img src="https://illustrations.popsy.co/amber/reading.svg" alt="Reading" style={{ width: '300px', opacity: 0.5 }} />
          <h2 style={{ color: 'var(--text-muted)', marginTop: '2rem' }}>No books yet! Ask a parent to add some.</h2>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem', paddingBottom: '2rem' }}>
          
          {/* Render each Series Row */}
          {Object.entries(seriesGroups).map(([seriesName, seriesBooks]) => (
            <div key={seriesName}>
              <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', borderBottom: '4px solid var(--primary)', display: 'inline-block', paddingBottom: '0.25rem', borderRadius: '2px' }}>
                {seriesName}
              </h2>
              <div style={{
                display: 'flex', gap: '2.5rem', overflowX: 'auto', paddingBottom: '1.5rem',
                scrollSnapType: 'x mandatory', padding: '10px 10px 30px 10px', marginLeft: '-10px'
              }}>
                {seriesBooks.map(book => (
                  <div key={book.id} style={{ scrollSnapAlign: 'start' }}>
                    <BookCard book={book} progress={progress} readBooks={readBooks} navigate={navigate} />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Render Standalone Books */}
          {standaloneBooks.length > 0 && (
            <div>
              {Object.keys(seriesGroups).length > 0 && (
                <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', borderBottom: '4px solid var(--primary)', display: 'inline-block', paddingBottom: '0.25rem', borderRadius: '2px' }}>
                  Individual Books
                </h2>
              )}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
                gap: '2.5rem'
              }}>
                {standaloneBooks.map(book => (
                  <BookCard key={book.id} book={book} progress={progress} readBooks={readBooks} navigate={navigate} isGrid={true} />
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
