import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { getQuestionsForBook } from '../../lib/discussionQuestions';
import { Trophy, MessageCircle } from 'lucide-react';
import Confetti from 'react-confetti';
import './BookCelebration.css';

export default function BookCelebration() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  
  const book = useStore(state => state.books.find(b => b.id === bookId));
  const discussionQuestions = useStore(state => state.discussionQuestions);
  
  const [questions, setQuestions] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [windowDimensions, setWindowDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

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
          className="celebration-cover"
        />
        
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
