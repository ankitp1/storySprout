import React from 'react';
import useStore from '../../store/useStore';
import { getQuestionsForBook } from '../../lib/discussionQuestions';

export default function ListeningStats({ profileId }) {
  const listeningStatsMap = useStore(state => state.listeningStats[profileId]);
  const ratingsMap = useStore(state => state.ratings[profileId]);
  const books = useStore(state => state.books);
  const discussionQuestions = useStore(state => state.discussionQuestions);
  
  const listeningStats = listeningStatsMap || {};
  const ratings = ratingsMap || {};

  const completedBooks = books.filter(b => listeningStats[b.id]?.completed);

  return (
    <div style={{
      background: 'var(--surface-color)',
      borderRadius: '16px',
      padding: '2rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
    }}>
      <h2 style={{ marginTop: 0 }}>📚 Completed Books</h2>
      
      {completedBooks.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No books completed yet!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {completedBooks.map(book => {
            const stats = listeningStats[book.id];
            const hasQuestions = getQuestionsForBook(discussionQuestions, book.title) !== null;
            
            return (
              <div key={book.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                padding: '1rem',
                border: '1px solid var(--border)',
                borderRadius: '12px'
              }}>
                <img 
                  src={book.coverUrl} 
                  alt={book.title} 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://placehold.co/40x60/e2e8f0/475569?text=Cover`;
                  }}
                  style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} 
                />
                
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontSize: '1.1rem' }}>
                    {book.title}
                  </h4>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    ⏱️ {(stats.totalTimeSeconds / 3600).toFixed(1)} hrs total
                  </p>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Completed: {new Date(stats.completedAt).toLocaleDateString()}
                  </p>
                  {ratings[book.id] && (
                    <p style={{ margin: '0.25rem 0 0 0', color: '#FFD700', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      ⭐ {ratings[book.id]} / 5
                    </p>
                  )}
                </div>
                
                {hasQuestions ? (
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'inline-block', background: 'var(--primary)', color: 'var(--btn-text-color, white)', padding: '0.25rem 0.5rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      Questions Available
                    </span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
