import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, RotateCcw, Moon, AlertTriangle, Rewind } from 'lucide-react';
import { getFallbackCover } from '../../lib/coverUtils';
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
  const isSessionLocked = useStore(state => state.isSessionLocked);
  const incrementSessionTime = useStore(state => state.incrementSessionTime);
  const flushCloudSync = useStore(state => state.flushCloudSync);

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
  const [audioError, setAudioError] = useState(null);

  // Offline State & Resolvers
  const [audioUrl, setAudioUrl] = useState(null);
  const [offlineCoverUrl, setOfflineCoverUrl] = useState(null);
  const isDownloaded = useStore(state => state.downloadedBooks?.[bookId]);
  
  const audioRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // YouTube player references
  const ytPlayerRef = useRef(null);
  const [ytPlayer, setYtPlayer] = useState(null);
  
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

  // YouTube Iframe API Loader and Manager
  useEffect(() => {
    if (book.type !== 'youtube') return;

    window.onYouTubeIframeAPIReady = () => {
      initYtPlayer();
    };

    const initYtPlayer = () => {
      const videoId = currentChapter?.id;
      if (!videoId) return;

      const placeholder = document.getElementById('yt-iframe-placeholder');
      if (!placeholder) {
        setTimeout(initYtPlayer, 100);
        return;
      }

      ytPlayerRef.current = new window.YT.Player('yt-iframe-placeholder', {
        videoId: videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3
        },
        events: {
          onReady: (event) => {
            setDuration(event.target.getDuration());
            setYtPlayer(event.target);
            
            if (!hasAppliedSmartResume) {
              const resumeTime = Math.max(0, progress.currentTime - 5);
              event.target.seekTo(resumeTime, true);
              setCurrentTime(resumeTime);
              setHasAppliedSmartResume(true);
            }
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setAudioError(null);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === window.YT.PlayerState.ENDED) {
              addPoints(10);
              setToastMsg('+10 Points! 🌱');
              setTimeout(() => setToastMsg(''), 3000);

              if (chapterIndex < chapters.length - 1) {
                nextChapter();
              } else {
                addPoints(50);
                setIsPlaying(false);
                markBookAsRead(bookId);
                navigate(`/book-celebration/${bookId}`);
              }
            }
          },
          onError: (event) => {
            console.error('YouTube player error:', event.data);
            setAudioError('Cannot load YouTube video. Please check your internet connection.');
            setIsPlaying(false);
          }
        }
      });
    };

    if (!window.YT || !window.YT.Player) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
      initYtPlayer();
    }

    return () => {
      if (ytPlayerRef.current && ytPlayerRef.current.destroy) {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {
          console.error('Error destroying YouTube player:', e);
        }
        ytPlayerRef.current = null;
        setYtPlayer(null);
      }
    };
  }, [bookId, chapterIndex, currentChapter?.id, hasAppliedSmartResume, progress.currentTime]);

  // YouTube Position Tracker
  useEffect(() => {
    let interval = null;
    if (book.type === 'youtube' && ytPlayer && isPlaying) {
      interval = setInterval(() => {
        try {
          const curr = ytPlayer.getCurrentTime();
          setCurrentTime(curr);
        } catch (e) {}
      }, 500);
    }
    return () => clearInterval(interval);
  }, [book.type, ytPlayer, isPlaying]);

  // Smart Resume Logic for standard Audio
  useEffect(() => {
    if (book.type === 'youtube') return;
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration || 0);
      if (!hasAppliedSmartResume) {
        const resumeTime = Math.max(0, progress.currentTime - 5);
        audio.currentTime = resumeTime;
        setCurrentTime(resumeTime);
        setHasAppliedSmartResume(true);
      }
    };

    audio.addEventListener('loadedmetadata', setAudioData);
    return () => audio.removeEventListener('loadedmetadata', setAudioData);
  }, [hasAppliedSmartResume, progress.currentTime, book.type]);

  // Sleep Timer Logic
  useEffect(() => {
    if (sleepTimerRemaining !== null && sleepTimerRemaining > 0 && isPlaying) {
      timerIntervalRef.current = setInterval(() => {
        setSleepTimerRemaining(prev => {
          if (prev <= 1) {
            setIsPlaying(false);
            let currentPos = 0;
            if (book.type === 'youtube') {
              ytPlayer?.pauseVideo();
              currentPos = ytPlayer ? ytPlayer.getCurrentTime() : 0;
            } else {
              audioRef.current?.pause();
              currentPos = audioRef.current ? audioRef.current.currentTime : 0;
            }
            updateProgress(bookId, chapterIndex, currentPos);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [sleepTimerRemaining, isPlaying, bookId, chapterIndex, updateProgress, book.type, ytPlayer]);

  const setSleepTimer = (minutes) => {
    setSleepTimerRemaining(minutes * 60);
    setShowSleepTimerMenu(false);
    if (!isPlaying) togglePlay();
  };

  // Track session
  useEffect(() => {
    incrementSessionCount(bookId);
  }, [bookId, incrementSessionCount]);

  // Periodical progress stats update
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying && !isSessionLocked) {
        let currentPos = 0;
        if (book.type === 'youtube' && ytPlayer) {
          currentPos = ytPlayer.getCurrentTime();
        } else if (audioRef.current) {
          currentPos = audioRef.current.currentTime;
        } else {
          return;
        }

        updateProgress(bookId, chapterIndex, currentPos);
        updateListeningStats(bookId, 3);
        incrementSessionTime(3);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [bookId, chapterIndex, isPlaying, isSessionLocked, updateProgress, updateListeningStats, incrementSessionTime, book.type, ytPlayer]);

  // Pause playback if session is locked
  useEffect(() => {
    if (isSessionLocked && isPlaying) {
      setIsPlaying(false);
      if (book.type === 'youtube') {
        ytPlayer?.pauseVideo();
      } else {
        audioRef.current?.pause();
      }
    }
  }, [isSessionLocked, isPlaying, book.type, ytPlayer]);

  // Unmounting save progress
  useEffect(() => {
    return () => {
      let currentPos = 0;
      if (book.type === 'youtube' && ytPlayerRef.current) {
        try {
          currentPos = ytPlayerRef.current.getCurrentTime();
        } catch (e) {}
      } else if (audioRef.current) {
        currentPos = audioRef.current.currentTime;
      }
      if (currentPos > 0) {
        updateProgress(bookId, chapterIndex, currentPos);
      }
      flushCloudSync();
    };
  }, [bookId, chapterIndex, updateProgress, flushCloudSync, book.type]);

  // Auto-recover on visibility change (unlocking phone)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && audioError) {
        console.log("App became visible, attempting to recover from audio error");
        setAudioError(null);
        if (audioRef.current) {
          audioRef.current.load();
          audioRef.current.currentTime = currentTime;
          // Note: we don't auto-play here to prevent Safari blocking it.
          // The user can just hit play again, but the state will be recovered.
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [audioError, currentTime]);

  // Media Session API for Lock Screen Controls
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentChapter?.name || `Chapter ${chapterIndex + 1}`,
        artist: book.author || 'StorySprout',
        album: book.title,
        artwork: [
          { src: book.coverUrl || getFallbackCover(book.title, 512, 512), sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      // We attach handlers directly to the current state references
      navigator.mediaSession.setActionHandler('play', togglePlay);
      navigator.mediaSession.setActionHandler('pause', togglePlay);
      navigator.mediaSession.setActionHandler('seekbackward', rewind15);
      navigator.mediaSession.setActionHandler('previoustrack', chapterIndex > 0 ? prevChapter : null);
      navigator.mediaSession.setActionHandler('nexttrack', chapterIndex < chapters.length - 1 ? nextChapter : null);
    }
  }, [book, currentChapter, chapterIndex, chapters.length, isPlaying]);

  // Smart Background Pre-caching for Next Chapter
  useEffect(() => {
    if (book.type === 'youtube') return;
    if (!isPlaying) return;

    let timeoutId;
    let active = true;

    const preCacheNextChapter = async () => {
      const nextChapterIndex = chapterIndex + 1;
      if (nextChapterIndex >= chapters.length) return;
      
      const nextChapter = chapters[nextChapterIndex];
      if (!nextChapter || !nextChapter.id) return;

      try {
        const { getOfflineAudio, saveOfflineAudio } = await import('../../lib/offlineDb');
        
        // Check if already downloaded
        const existing = await getOfflineAudio(bookId, nextChapter.id);
        if (existing) return; // Already cached

        if (!active) return;

        console.log(`Pre-caching next chapter: ${nextChapter.name}`);
        const url = `https://www.googleapis.com/drive/v3/files/${nextChapter.id}?alt=media&key=${import.meta.env.VITE_GOOGLE_API_KEY}&acknowledgeAbuse=true`;
        
        const res = await fetch(url);
        if (!res.ok) {
          console.warn(`Failed to pre-cache next chapter (Status ${res.status})`);
          return;
        }

        const blob = await res.blob();
        if (active) {
          await saveOfflineAudio(bookId, nextChapter.id, blob);
          console.log(`Successfully pre-cached ${nextChapter.name}`);
        }
      } catch (err) {
        console.warn('Error pre-caching next chapter:', err);
      }
    };

    // Wait 10 seconds into the current chapter before fetching the next one
    timeoutId = setTimeout(() => {
      preCacheNextChapter();
    }, 10000);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [bookId, chapterIndex, chapters, isPlaying, book.type]);

  // Load offline cover if available
  useEffect(() => {
    let active = true;
    let objectUrl = null;
    const loadCover = async () => {
      if (isDownloaded) {
        try {
          const { getOfflineCover } = await import('../../lib/offlineDb');
          const blob = await getOfflineCover(bookId);
          if (blob && active) {
            objectUrl = URL.createObjectURL(blob);
            setOfflineCoverUrl(objectUrl);
          }
        } catch (e) {
          console.error('Failed to load offline cover:', e);
        }
      }
    };
    loadCover();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [isDownloaded, bookId]);

  // Load offline audio if available
  useEffect(() => {
    if (book.type === 'youtube') return;
    let active = true;
    let objectUrl = null;

    const loadAudio = async () => {
      if (currentChapter?.id) {
        try {
          const { getOfflineAudio } = await import('../../lib/offlineDb');
          const blob = await getOfflineAudio(bookId, currentChapter.id);
          if (blob && active) {
            objectUrl = URL.createObjectURL(blob);
            setAudioUrl(objectUrl);
            return;
          }
        } catch (e) {
          console.error('Failed to load offline audio:', e);
        }

        setAudioUrl(`https://www.googleapis.com/drive/v3/files/${currentChapter.id}?alt=media&key=${import.meta.env.VITE_GOOGLE_API_KEY}&acknowledgeAbuse=true`);
      }
    };

    loadAudio();
    setAudioError(null);

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [bookId, chapterIndex, currentChapter?.id, book.type]);

  // Reload audio element source when URL changes
  useEffect(() => {
    if (book.type === 'youtube') return;
    const audio = audioRef.current;
    if (audio && audioUrl) {
      audio.load();
      if (isPlaying) {
        audio.play().catch(e => console.log('Playback error:', e));
      }
    }
  }, [audioUrl, book.type]);

  const togglePlay = () => {
    setAudioError(null);
    if (book.type === 'youtube') {
      if (ytPlayer) {
        if (isPlaying) {
          ytPlayer.pauseVideo();
        } else {
          ytPlayer.playVideo();
        }
        setIsPlaying(!isPlaying);
      }
    } else if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => {
          console.error("Playback error:", e);
          if (e.name === 'NotAllowedError') {
            setAudioError("Your browser blocked autoplay. Please tap the play button manually.");
          } else if (e.name === 'NotSupportedError') {
            setAudioError("This audio format is not supported by your browser.");
          } else {
            setAudioError("Unable to play this chapter. This could be due to a poor connection or API rate limits.");
          }
          setIsPlaying(false);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const rewind15 = () => {
    if (book.type === 'youtube') {
      if (ytPlayer) {
        const curr = ytPlayer.getCurrentTime();
        ytPlayer.seekTo(Math.max(0, curr - 15), true);
        setCurrentTime(Math.max(0, curr - 15));
      }
    } else if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 15);
    }
  };

  const restartChapter = () => {
    setAudioError(null);
    if (book.type === 'youtube') {
      if (ytPlayer) {
        ytPlayer.seekTo(0, true);
        setCurrentTime(0);
      }
    } else if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (book.type === 'youtube') {
      if (ytPlayer) {
        ytPlayer.seekTo(time, true);
      }
    } else if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const nextChapter = () => {
    if (chapterIndex < chapters.length - 1) {
      setAudioError(null);
      setHasAppliedSmartResume(false);
      setChapterIndex(chapterIndex + 1);
      setIsPlaying(true);
      if (book.type !== 'youtube') {
        setTimeout(() => { if (audioRef.current) audioRef.current.play().catch(e => console.log(e)); }, 100);
      }
    }
  };

  const prevChapter = () => {
    if (chapterIndex > 0) {
      setAudioError(null);
      setHasAppliedSmartResume(false);
      setChapterIndex(chapterIndex - 1);
      setIsPlaying(true);
      if (book.type !== 'youtube') {
        setTimeout(() => { if (audioRef.current) audioRef.current.play().catch(e => console.log(e)); }, 100);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
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
    if (isNaN(timeInSeconds) || timeInSeconds === null) return "0:00";
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

        {book.type === 'youtube' ? (
          <div style={{
            width: '100%',
            maxWidth: '260px',
            aspectRatio: '16/9',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            marginBottom: '1.5rem',
            background: '#000',
            position: 'relative'
          }}>
            <div id="yt-iframe-placeholder" style={{ width: '100%', height: '100%' }}></div>
          </div>
        ) : (
          <img 
            src={offlineCoverUrl || ((imgError || !book.coverUrl) ? getFallbackCover(book.title, 400, 600) : book.coverUrl)} 
            alt={book.title} 
            onError={() => setImgError(true)}
            className="player-cover"
            style={{ width: '100%', maxWidth: '260px', aspectRatio: '3/4', objectFit: 'cover', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', marginBottom: '1.5rem' }} 
          />
        )}

        {/* Book Title is hidden because the cover image usually contains it */}
        {/* <h1 style={{ margin: 0, fontSize: '2.5rem', textAlign: 'center', maxWidth: '80%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{book.title}</h1> */}
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{currentChapter?.name || `Chapter ${chapterIndex + 1}`}</p>
      </div>

      {book.type !== 'youtube' && (
        <audio 
          ref={audioRef} 
          src={audioUrl || undefined} 
          onTimeUpdate={handleTimeUpdate} 
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={(e) => {
            const error = e.target.error;
            console.error("Audio player element error:", error);
            
            // Auto-recovery attempt for Network Errors (common on lock screen)
            if (error && (error.code === 2 || error.code === 3)) {
              console.log("Attempting automatic recovery for network error code:", error.code);
              const retryCount = window.__audioRetryCount || 0;
              if (retryCount < 3) {
                window.__audioRetryCount = retryCount + 1;
                setTimeout(() => {
                   if (audioRef.current) {
                     audioRef.current.load();
                     audioRef.current.currentTime = currentTime;
                     audioRef.current.play().then(() => {
                       setAudioError(null);
                       window.__audioRetryCount = 0; // reset on success
                     }).catch(err => {
                       console.error("Auto-recovery playback failed:", err);
                       setAudioError("Unable to play this chapter. Connection dropped.");
                     });
                   }
                }, 2000);
                return; // skip showing error UI temporarily
              }
            }

            if (error && error.code === 4) {
              setAudioError("Media resource could not be loaded. This is often caused by Google Drive API rate limits (403 Forbidden). Try downloading the book instead.");
            } else {
              setAudioError("Cannot load audio chapter. Please check your internet connection or sync the library.");
            }
            setIsPlaying(false);
          }}
          onEnded={() => {
            addPoints(10);
            setToastMsg('+10 Points! 🌱');
            setTimeout(() => setToastMsg(''), 3000);

            if (chapterIndex < chapters.length - 1) {
              nextChapter();
            } else {
              addPoints(50);
              setIsPlaying(false);
              markBookAsRead(bookId);
              navigate(`/book-celebration/${bookId}`);
            }
          }} 
        />
      )}

      <div style={{ background: 'var(--surface-color)', padding: '2rem 3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', boxShadow: '0 -10px 40px rgba(0,0,0,0.05)', borderTopLeftRadius: '40px', borderTopRightRadius: '40px', zIndex: 10, position: 'relative', width: '100%', boxSizing: 'border-box' }}>
        
        {audioError && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--surface-color)',
            borderTopLeftRadius: '40px',
            borderTopRightRadius: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            color: 'var(--text-main)',
            textAlign: 'center',
            zIndex: 20
          }}>
            <AlertTriangle size={40} color="var(--primary)" style={{ marginBottom: '0.75rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Cannot Play Chapter</h3>
            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '300px' }}>{audioError}</p>
            <button 
              className="btn-primary" 
              onClick={() => {
                setAudioError(null);
                if (book.type === 'youtube') {
                  if (ytPlayer) {
                    ytPlayer.playVideo();
                    setIsPlaying(true);
                  }
                } else if (audioRef.current) {
                  audioRef.current.load();
                  audioRef.current.play().catch(err => {
                    console.error("Retry playback failed:", err);
                    setAudioError("Unable to play this chapter. Please check your internet connection.");
                  });
                  setIsPlaying(true);
                }
              }}
              style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}
            >
              Retry Playback
            </button>
          </div>
        )}
        <div style={{ width: '100%', maxWidth: '800px', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '0 1rem', boxSizing: 'border-box' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-main)', width: '60px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
            {formatTime(currentTime)}
          </span>
          <input 
            type="range"
            min={0}
            max={duration || 1}
            value={currentTime}
            onChange={handleSeek}
            style={{
              flex: 1,
              height: '16px',
              borderRadius: '8px',
              background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${duration ? (currentTime / duration) * 100 : 0}%, var(--surface-light) ${duration ? (currentTime / duration) * 100 : 0}%, var(--surface-light) 100%)`,
              outline: 'none',
              cursor: 'pointer',
              WebkitAppearance: 'none',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.1)'
            }}
            className="player-slider"
          />
          <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-muted)', width: '60px', fontFamily: 'var(--font-mono)' }}>
            {formatTime(duration)}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', position: 'relative' }}>
          <button 
            onClick={() => setShowSleepTimerMenu(!showSleepTimerMenu)} 
            style={{ 
              color: sleepTimerRemaining ? 'var(--primary)' : 'var(--text-muted)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: 'var(--bg-color)', 
              padding: '0.5rem 1.5rem', 
              borderRadius: '24px',
              border: '2px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <Moon size={20} fill={sleepTimerRemaining ? 'var(--primary)' : 'none'} />
            {sleepTimerRemaining ? <span>{formatTime(sleepTimerRemaining)}</span> : <span>Sleep Timer</span>}
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
            onClick={restartChapter}
            className="btn-icon player-btn-secondary" 
            title="Restart Chapter"
          >
            <RotateCcw size={32} color="var(--text-main)" />
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

          <button 
            onClick={rewind15}
            className="btn-icon player-btn-secondary" 
            title="Rewind 15 Seconds"
          >
            <Rewind size={32} color="var(--text-main)" />
          </button>
        </div>
      </div>
    </div>
  );
}
