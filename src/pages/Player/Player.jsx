import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, RotateCcw, Moon } from 'lucide-react';
import './Player.css';

export default function Player() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  
  const book = useStore(state => state.books.find(b => b.id === bookId));
  const activeProfileId = useStore(state => state.activeProfileId);
  const rawProgress = useStore(state => state.progress);
  const progress = (activeProfileId && rawProgress[activeProfileId]) ? (rawProgress[activeProfileId][bookId] || { chapterIndex: 0, currentTime: 0 }) : { chapterIndex: 0, currentTime: 0 };
  const updateProgress = useStore(state => state.updateProgress);
  const markBookAsRead = useStore(state => state.markBookAsRead);
  const updateListeningStats = useStore(state => state.updateListeningStats);
  const incrementSessionCount = useStore(state => state.incrementSessionCount);
  const addPoints = useStore(state => state.addPoints);

  // Audio State
  const [chapterIndex, setChapterIndex] = useState(progress.chapterIndex || 0);
  const [currentTime, setCurrentTime] = useState(progress.currentTime || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState(null);
  const [showSleepTimerMenu, setShowSleepTimerMenu] = useState(false);
  const [hasAppliedSmartResume, setHasAppliedSmartResume] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [imgError, setImgError] = useState(false);
  
  const audioRef = useRef(null);
  const timerIntervalRef = useRef(null);
  
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

  // Smart Resume Logic
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration || 0);
      if (!hasAppliedSmartResume) {
        // Smart Resume: Rewind 5 seconds from saved progress
        const resumeTime = Math.max(0, progress.currentTime - 5);
        audio.currentTime = resumeTime;
        setCurrentTime(resumeTime);
        setHasAppliedSmartResume(true);
      }
    };

    audio.addEventListener('loadedmetadata', setAudioData);
    return () => audio.removeEventListener('loadedmetadata', setAudioData);
  }, [hasAppliedSmartResume, progress.currentTime]);

  // Sleep Timer Logic
  useEffect(() => {
    if (sleepTimerRemaining !== null && sleepTimerRemaining > 0 && isPlaying) {
      timerIntervalRef.current = setInterval(() => {
        setSleepTimerRemaining(prev => {
          if (prev <= 1) {
            setIsPlaying(false);
            audioRef.current?.pause();
            updateProgress(bookId, chapterIndex, audioRef.current?.currentTime || 0);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [sleepTimerRemaining, isPlaying, bookId, chapterIndex, updateProgress]);

  const setSleepTimer = (minutes) => {
    setSleepTimerRemaining(minutes * 60);
    setShowSleepTimerMenu(false);
    if (!isPlaying) togglePlay();
  };

  // Track session
  useEffect(() => {
    incrementSessionCount(bookId);
  }, [bookId, incrementSessionCount]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (audioRef.current && isPlaying) {
        updateProgress(bookId, chapterIndex, audioRef.current.currentTime);
        updateListeningStats(bookId, 3);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [bookId, chapterIndex, isPlaying, updateProgress, updateListeningStats]);

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
      setHasAppliedSmartResume(false);
      setChapterIndex(chapterIndex + 1);
      setIsPlaying(true);
      setTimeout(() => { if (audioRef.current) audioRef.current.play(); }, 100);
    }
  };

  const prevChapter = () => {
    if (chapterIndex > 0) {
      setHasAppliedSmartResume(false);
      setChapterIndex(chapterIndex - 1);
      setIsPlaying(true);
      setTimeout(() => { if (audioRef.current) audioRef.current.play(); }, 100);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if they are typing in an input (not applicable here, but good practice)
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch(e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextChapter();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevChapter();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, nextChapter, prevChapter]);

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="player-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-color)' }}>
      <div className="player-header" style={{ padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', background: 'transparent', zIndex: 10 }}>
        <button onClick={() => navigate('/')} className="btn-icon" style={{ width: '64px', height: '64px', marginRight: '1.5rem', background: 'white', boxShadow: 'var(--shadow-md)' }}>
          <ArrowLeft size={32} />
        </button>
      </div>

      <div className="player-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem', marginTop: '-80px', position: 'relative' }}>
        {toastMsg && (
          <div style={{
            position: 'absolute', top: '10%',
            background: 'var(--primary)', color: 'var(--btn-text-color, white)', padding: '0.75rem 1.5rem',
            borderRadius: '24px', fontSize: '1.5rem', fontWeight: 'bold',
            boxShadow: '0 10px 20px rgba(255, 107, 107, 0.3)',
            animation: 'slideUpFade 3s ease-out forwards',
            zIndex: 100
          }}>
            {toastMsg}
          </div>
        )}
        <img 
          src={imgError ? `https://placehold.co/400x600/e2e8f0/475569?text=${encodeURIComponent(book.title)}` : book.coverUrl} 
          alt={book.title} 
          onError={() => setImgError(true)}
          className="player-cover"
          style={{ width: '100%', maxWidth: '260px', aspectRatio: '3/4', objectFit: 'cover', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', marginBottom: '1.5rem' }} 
        />
        <h1 style={{ margin: 0, fontSize: '2.5rem', textAlign: 'center', maxWidth: '80%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{book.title}</h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{currentChapter?.name || `Chapter ${chapterIndex + 1}`}</p>
      </div>

      <audio 
        ref={audioRef} 
        src={currentChapter?.id ? `https://www.googleapis.com/drive/v3/files/${currentChapter.id}?alt=media&key=${import.meta.env.VITE_GOOGLE_API_KEY}&acknowledgeAbuse=true` : undefined} 
        onTimeUpdate={handleTimeUpdate} 
        onEnded={() => {
          // Award points for finishing a chapter!
          addPoints(10);
          setToastMsg('+10 Points! 🌱');
          setTimeout(() => setToastMsg(''), 3000);

          if (chapterIndex < chapters.length - 1) {
            nextChapter();
          } else {
            // Bonus points for finishing the book!
            addPoints(50);
            setIsPlaying(false);
            markBookAsRead(bookId);
            navigate(`/book-celebration/${bookId}`);
          }
        }} 
      />

      <div style={{ background: 'var(--surface-color)', padding: '2rem 3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', boxShadow: '0 -10px 40px rgba(0,0,0,0.05)', borderTopLeftRadius: '40px', borderTopRightRadius: '40px', zIndex: 10 }}>
        
        <div style={{ width: '100%', maxWidth: '800px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '1rem', color: 'var(--text-muted)', width: '50px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{formatTime(currentTime)}</span>
          <div style={{ flex: 1, height: '12px', background: 'var(--border)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, background: 'var(--primary)', width: `${duration ? (currentTime / duration) * 100 : 0}%`, transition: 'width 0.1s linear' }} />
          </div>
          <span style={{ fontSize: '1rem', color: 'var(--text-muted)', width: '50px', fontFamily: 'var(--font-mono)' }}>{formatTime(duration)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', position: 'relative' }}>
          <button className="btn-icon" onClick={() => setShowSleepTimerMenu(!showSleepTimerMenu)} style={{ color: sleepTimerRemaining ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-color)', padding: '0.5rem 1rem', borderRadius: '20px' }}>
            <Moon size={20} fill={sleepTimerRemaining ? 'var(--primary)' : 'none'} />
            {sleepTimerRemaining ? <span style={{ fontWeight: 'bold' }}>{formatTime(sleepTimerRemaining)}</span> : <span>Sleep Timer</span>}
          </button>
          {showSleepTimerMenu && (
            <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '1rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', zIndex: 10 }}>
              <button className="btn-secondary" onClick={() => setSleepTimer(10)}>10m</button>
              <button className="btn-secondary" onClick={() => setSleepTimer(15)}>15m</button>
              <button className="btn-secondary" onClick={() => setSleepTimer(20)}>20m</button>
              <button className="btn-secondary" onClick={() => setSleepTimer(30)}>30m</button>
              <button className="btn-icon" onClick={() => setSleepTimerRemaining(null)}>Off</button>
            </div>
          )}
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
