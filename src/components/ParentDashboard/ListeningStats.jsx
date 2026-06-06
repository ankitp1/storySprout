import React from 'react';
import useStore from '../../store/useStore';
import { getQuestionsForBook } from '../../lib/discussionQuestions';

export default function ListeningStats() {
  const listeningStats = useStore(state => state.listeningStats);
  const books = useStore(state => state.books);
  const discussionQuestions = useStore(state => state.discussionQuestions);

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
                  style={{ width: '60px', height: '90px', objectFit: 'cover', borderRadius: '8px' }} 
                />
                
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>{book.title}</h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    ⏱️ {(stats.totalTimeSeconds / 3600).toFixed(1)} hrs total
                  </p>
                </div>
                
                {hasQuestions ? (
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'inline-block', background: 'var(--primary)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
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
