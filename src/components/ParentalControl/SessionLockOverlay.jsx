import React, { useState } from 'react';
import useStore from '../../store/useStore';
import PINEntry from '../ParentDashboard/PINEntry';
import { Lock } from 'lucide-react';

export default function SessionLockOverlay() {
  const isSessionLocked = useStore(state => state.isSessionLocked);
  const unlockSession = useStore(state => state.unlockSession);
  const activeProfileId = useStore(state => state.activeProfileId);
  const profiles = useStore(state => state.profiles);
  
  const [showPinEntry, setShowPinEntry] = useState(false);

  if (!isSessionLocked) return null;

  const activeProfile = profiles.find(p => p.id === activeProfileId);
  const profileName = activeProfile ? activeProfile.name : 'Child';

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.98)', // Premium dark slate background
      zIndex: 10000, // Make sure it sits on top of everything
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      color: '#F8FAFC',
      textAlign: 'center'
    }}>
      <div className="animate-float" style={{
        background: 'var(--surface-color, #1E2A45)',
        border: '3px solid var(--primary, #FF6B6B)',
        padding: '3rem 2rem',
        borderRadius: '32px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(255, 107, 107, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary, #FF6B6B)'
        }}>
          <Lock size={40} />
        </div>
        
        <h2 style={{ fontSize: '2.5rem', margin: 0, color: 'var(--primary, #FF6B6B)', fontFamily: 'var(--font-display)' }}>
          Time's Up! ⏳
        </h2>
        
        <p style={{ fontSize: '1.25rem', color: '#94A3B8', margin: 0, lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>
          {profileName} has reached the session listening limit. It is time to rest your eyes and ears! 🌳
        </p>

        <button 
          className="btn-primary" 
          onClick={() => setShowPinEntry(true)}
          style={{
            marginTop: '1rem',
            padding: '0.75rem 2rem',
            fontSize: '1.1rem',
            boxShadow: '0 4px 15px rgba(255, 107, 107, 0.4)'
          }}
        >
          🔑 Parents: Unlock
        </button>
      </div>

      {showPinEntry && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          zIndex: 10001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <PINEntry 
            isModal={true}
            onCancel={() => setShowPinEntry(false)}
            onSuccess={() => {
              unlockSession();
              setShowPinEntry(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
