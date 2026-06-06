import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { getQuestionsForBook } from '../../lib/discussionQuestions';
import { Trophy, MessageCircle, Star } from 'lucide-react';
import Confetti from 'react-confetti';
import './BookCelebration.css';

export default function BookCelebration() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  
  const book = useStore(state => state.books.find(b => b.id === bookId));
  const discussionQuestions = useStore(state => state.discussionQuestions);
  const activeProfileId = useStore(state => state.activeProfileId);
  const rateBook = useStore(state => state.rateBook);
  const currentRating = useStore(state => state.ratings?.[activeProfileId]?.[bookId] || 0);
  
  const [questions, setQuestions] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [windowDimensions, setWindowDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    const handleResize = () => setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (book && discussionQuestions) {
      const q = getQuestionsForBook(discussionQuestions, book.title);
      setQuestions(q);
    }
  }, [book, discussionQuestions]);

  if (!book) {
    return (
      <div className="celebration-screen">
        <h2>Book not found!</h2>
        <button className="btn-primary" onClick={() => navigate('/')}>Back to Library</button>
      </div>
    );
  }

  const handlePickRandom = (category) => {
    if (!questions || !questions[category]) return;
    const qList = questions[category];
    const qIndex = Math.floor(Math.random() * qList.length);
    setSelectedQuestion({ category, text: qList[qIndex] });
  };

  return (
    <div className="celebration-screen">
      <Confetti
        width={windowDimensions.width}
        height={windowDimensions.height}
        recycle={false}
        numberOfPieces={500}
        gravity={0.1}
      />
      
      <div className="celebration-content">
        <Trophy size={80} style={{ color: '#FFD700', marginBottom: '1rem' }} />
        
        <h1>🎉 Awesome Job!</h1>
        <p>You finished <strong>{book.title}</strong>!</p>
        
        <img 
          src={book.coverUrl} 
          alt={book.title} 
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://placehold.co/400x600/e2e8f0/475569?text=${encodeURIComponent(book.title)}`;
          }}
          style={{ width: '200px', height: '300px', objectFit: 'cover', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', marginBottom: '2rem' }} 
        />

        {/* Star Rating Widget */}
        <div style={{ margin: '2rem 0', padding: '1.5rem', background: 'var(--bg-color)', borderRadius: '16px' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)' }}>Rate this book:</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={40}
                style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                fill={(hoverRating || currentRating) >= star ? '#FFD700' : 'none'}
                color={(hoverRating || currentRating) >= star ? '#FFD700' : 'var(--text-muted)'}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => rateBook(bookId, star)}
              />
            ))}
          </div>
          {currentRating > 0 && <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Rating saved!</p>}
        </div>
        
        {questions && (
          <div className="discussion-section">
            <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <MessageCircle size={28} />
              Let's Chat About It!
            </h2>
            
            <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
              Pick a question to talk with your parent about:
            </p>
            
            <div className="question-selector">
              <button
                className={`question-btn ${selectedQuestion?.category === 'easy' ? 'active' : ''}`}
                onClick={() => handlePickRandom('easy')}
              >
                <span className="difficulty">💚 Easy</span>
              </button>
              
              <button
                className={`question-btn ${selectedQuestion?.category === 'medium' ? 'active' : ''}`}
                onClick={() => handlePickRandom('medium')}
              >
                <span className="difficulty">💛 Medium</span>
              </button>
              
              <button
                className={`question-btn ${selectedQuestion?.category === 'deep' ? 'active' : ''}`}
                onClick={() => handlePickRandom('deep')}
              >
                <span className="difficulty">🧡 Think Big</span>
              </button>
            </div>
            
            {selectedQuestion && (
              <div className="selected-question-display">
                <p className="big-question">
                  {selectedQuestion.text}
                </p>
                <button className="btn-secondary" onClick={() => handlePickRandom(selectedQuestion.category)}>
                  Pick Another
                </button>
              </div>
            )}
          </div>
        )}
        
        <button 
          className="btn-primary"
          onClick={() => navigate('/')}
          style={{ marginTop: '2rem' }}
        >
          ← Back to Library
        </button>
      </div>
    </div>
  );
}
