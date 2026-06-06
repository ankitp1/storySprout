import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import './Player.css';

export default function Player() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  
  const book = useStore(state => state.books.find(b => b.id === bookId));
  const progress = useStore(state => {
    if (!state.activeProfileId || !state.progress[state.activeProfileId]) return { chapterIndex: 0, currentTime: 0 };
    return state.progress[state.activeProfileId][bookId] || { chapterIndex: 0, currentTime: 0 };
  });
  const updateProgress = useStore(state => state.updateProgress);
  const markBookAsRead = useStore(state => state.markBookAsRead);
  const updateListeningStats = useStore(state => state.updateListeningStats);
  const incrementSessionCount = useStore(state => state.incrementSessionCount);

  // Audio State
  const [chapterIndex, setChapterIndex] = useState(progress.chapterIndex || 0);
  const [currentTime, setCurrentTime] = useState(progress.currentTime || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef(null);
  
  // Guard against missing book
  if (!book) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Book not found!</h2>
        <button className="btn-primary" onClick={() => navigate('/')}>Back to Library</button>
      </div>
    );
  }

  const chapters = book.chapters || [];
  const currentChapter = chapters[chapterIndex] || chapters[0];

  useEffect(() => {
    // When chapter index changes, update current time to 0 if it's a new chapter
    // otherwise respect the saved progress time on initial load
    if (audioRef.current) {
      if (chapterIndex === progress.chapterIndex && progress.currentTime > 0) {
        audioRef.current.currentTime = progress.currentTime;
      } else {
        audioRef.current.currentTime = 0;
      }
    }
  }, [chapterIndex]);

  // Track session
  useEffect(() => {
    incrementSessionCount(bookId);
  }, [bookId, incrementSessionCount]);

  useEffect(() => {
    // Save progress periodically
    const interval = setInterval(() => {
      if (audioRef.current && isPlaying) {
        updateProgress(bookId, chapterIndex, audioRef.current.currentTime);
        updateListeningStats(bookId, 3); // Accumulate 3 seconds
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [bookId, chapterIndex, isPlaying, updateProgress, updateListeningStats]);

  // Handle unmount save
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        updateProgress(bookId, chapterIndex, audioRef.current.currentTime);
      }
    };
  }, [bookId, chapterIndex, updateProgress]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const rewind15 = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 15);
    }
  };

  const nextChapter = () => {
    if (chapterIndex < chapters.length - 1) {
      setChapterIndex(chapterIndex + 1);
      setIsPlaying(true);
      setTimeout(() => { if (audioRef.current) audioRef.current.play(); }, 100);
    }
  };

  const prevChapter = () => {
    if (chapterIndex > 0) {
      setChapterIndex(chapterIndex - 1);
      setIsPlaying(true);
      setTimeout(() => { if (audioRef.current) audioRef.current.play(); }, 100);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-color)' }}>
      {/* Top Navigation */}
      <div style={{ padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', background: 'transparent', zIndex: 10 }}>
        <button onClick={() => navigate('/')} className="btn-icon" style={{ width: '64px', height: '64px', marginRight: '1.5rem', background: 'white', boxShadow: 'var(--shadow-md)' }}>
          <ArrowLeft size={32} />
        </button>
      </div>

      {/* Main Content Area (Cover Art) */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        padding: '2rem',
        marginTop: '-80px' // Offset top nav
      }}>
        <img 
          src={book.coverUrl} 
          alt={book.title} 
          style={{ 
            width: '300px', 
            height: '400px', 
            objectFit: 'cover', 
            borderRadius: '24px', 
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            marginBottom: '2rem'
          }} 
        />
        <h1 style={{ margin: 0, fontSize: '2.5rem', textAlign: 'center', maxWidth: '80%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {book.title}
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          {currentChapter?.name || `Chapter ${chapterIndex + 1}`}
        </p>
      </div>

      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef}
        src={currentChapter?.url} 
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={() => {
          if (chapterIndex < chapters.length - 1) {
            nextChapter();
          } else {
            setIsPlaying(false);
            markBookAsRead(bookId);
            navigate(`/book-celebration/${bookId}`);
          }
        }}
      />

      {/* Bottom Controls */}
      <div style={{ 
        background: 'var(--surface-color)', 
        padding: '2rem 3rem', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2rem',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.05)',
        borderTopLeftRadius: '40px',
        borderTopRightRadius: '40px',
        zIndex: 10
      }}>
        
        {/* Progress Bar */}
        <div style={{ width: '100%', maxWidth: '800px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '1rem', color: 'var(--text-muted)', width: '50px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{formatTime(currentTime)}</span>
          <div style={{ flex: 1, height: '12px', background: 'var(--border)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
            <div style={{ 
              position: 'absolute', 
              top: 0, left: 0, bottom: 0, 
              background: 'var(--primary)', 
              width: `${duration ? (currentTime / duration) * 100 : 0}%`,
              transition: 'width 0.1s linear'
            }} />
          </div>
          <span style={{ fontSize: '1rem', color: 'var(--text-muted)', width: '50px', fontFamily: 'var(--font-mono)' }}>{formatTime(duration)}</span>
        </div>

        <div className="player-controls-container">
          
          <button 
            onClick={rewind15}
            className="btn-icon player-btn-secondary" 
            title="Rewind 15 Seconds"
          >
            <RotateCcw size={32} color="var(--text-muted)" />
          </button>

          <button 
            onClick={prevChapter}
            className="btn-icon player-btn-secondary" 
            style={{ opacity: chapterIndex <= 0 ? 0.3 : 1 }} 
            disabled={chapterIndex <= 0}
            title="Previous Chapter"
          >
            <SkipBack size={32} color="var(--text-main)" />
          </button>
          
          <button 
            onClick={togglePlay}
            className="player-btn-giant"
          >
            {isPlaying ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" style={{ marginLeft: '8px' }} />}
          </button>

          <button 
            onClick={nextChapter}
            className="btn-icon player-btn-secondary" 
            style={{ opacity: chapterIndex >= chapters.length - 1 ? 0.3 : 1 }} 
            disabled={chapterIndex >= chapters.length - 1}
            title="Next Chapter"
          >
            <SkipForward size={32} color="var(--text-main)" />
          </button>

          {/* Placeholder to balance the rewind button */}
          <div className="player-btn-placeholder"></div>
        </div>
      </div>
    </div>
  );
}
