import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { Plus, Lock, X } from 'lucide-react';
import './ProfileSelection.css';

export default function ProfileSelection() {
  const { profiles, setActiveProfile, addProfile } = useStore();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🦊');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [confirmPinError, setConfirmPinError] = useState(false);

  // PIN Gate State
  const [pinGateProfileId, setPinGateProfileId] = useState(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const AVATARS = [
    { emoji: '🦊', color: '#FF6B6B' },
    { emoji: '🦄', color: '#4ECDC4' },
    { emoji: '🦖', color: '#45B7D1' },
    { emoji: '🚀', color: '#96CEB4' },
    { emoji: '🌟', color: '#FFEEAD' },
    { emoji: '🐼', color: '#D4A5A5' },
    { emoji: '🐯', color: '#FFD93D' },
    { emoji: '🐙', color: '#FF847C' }
  ];

  const handleSelect = (profileId) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile && profile.pin) {
      setPinGateProfileId(profileId);
      setEnteredPin('');
      setPinError(false);
    } else {
      setActiveProfile(profileId);
      navigate('/');
    }
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (newName.trim()) {
      if (newPin && newPin !== confirmPin) {
        setConfirmPinError(true);
        return;
      }
      const avatarData = AVATARS.find(a => a.emoji === selectedAvatar) || AVATARS[0];
      addProfile(newName.trim(), avatarData.emoji, avatarData.color, newPin);
      setNewName('');
      setSelectedAvatar('🦊');
      setNewPin('');
      setConfirmPin('');
      setConfirmPinError(false);
      setIsAdding(false);
    }
  };

  const handlePinChange = (val) => {
    setNewPin(val);
    setConfirmPinError(false);
  };

  const handleConfirmPinChange = (val) => {
    setConfirmPin(val);
    setConfirmPinError(false);
  };

  const handleKeypadPress = (val) => {
    setPinError(false);
    if (enteredPin.length < 4) {
      const nextPin = enteredPin + val;
      setEnteredPin(nextPin);
      
      // Auto-submit on 4th digit
      if (nextPin.length === 4) {
        const targetProfile = profiles.find(p => p.id === pinGateProfileId);
        if (targetProfile && targetProfile.pin === nextPin) {
          setActiveProfile(pinGateProfileId);
          setPinGateProfileId(null);
          setEnteredPin('');
          navigate('/');
        } else {
          setPinError(true);
          // Auto-clear after brief delay to show error
          setTimeout(() => {
            setEnteredPin('');
          }, 800);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPinError(false);
    setEnteredPin(prev => prev.slice(0, -1));
  };

  const gateProfile = profiles.find(p => p.id === pinGateProfileId);

  return (
    <div className="profile-screen">
      <h1 className="profile-title">Who's listening?</h1>
      
      <div className="profiles-container">
        {profiles.map(profile => (
          <div key={profile.id} className="profile-card" onClick={() => handleSelect(profile.id)}>
            <div className="profile-avatar" style={{ backgroundColor: profile.color, position: 'relative' }}>
              {profile.avatar || profile.name.charAt(0).toUpperCase()}
              {profile.pin && (
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  background: 'var(--surface-color)',
                  borderRadius: '50%',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <Lock size={16} color="var(--text-main)" />
                </div>
              )}
            </div>
            <p className="profile-name">{profile.name}</p>
          </div>
        ))}
        
        <div className="profile-card" onClick={() => setIsAdding(true)}>
          <div className="profile-avatar add-profile-btn">
            <Plus size={48} />
          </div>
          <p className="profile-name">Add Profile</p>
        </div>
      </div>

      {/* Profile PIN Gate Modal */}
      {pinGateProfileId && gateProfile && (
        <div className="add-profile-modal">
          <div className="add-profile-content" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div 
              style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '20px', 
                backgroundColor: gateProfile.color, 
                fontSize: '2.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {gateProfile.avatar}
            </div>
            <h2 style={{ margin: '0 0 0.5rem 0' }}>Enter PIN for {gateProfile.name}</h2>
            <p style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Enter your 4-digit code to listen
            </p>

            {/* PIN Dot Indicators */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: pinError 
                    ? 'var(--primary)' 
                    : (enteredPin.length > i ? 'var(--text-main)' : 'var(--border)'),
                  border: '2px solid var(--border)',
                  transform: pinError ? 'scale(1.1)' : 'none',
                  transition: 'all 0.15s ease'
                }} />
              ))}
            </div>

            {pinError && (
              <p style={{ color: 'var(--primary)', fontWeight: 'bold', margin: '0 0 1rem 0', animation: 'shake 0.3s ease' }}>
                Oops! Incorrect PIN.
              </p>
            )}

            {/* Numeric Keypad */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '0.75rem', 
              width: '100%', 
              maxWidth: '260px',
              marginBottom: '1.5rem'
            }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num.toString())}
                  style={{
                    padding: '1rem',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    borderRadius: '16px',
                    border: '2px solid var(--border)',
                    background: 'var(--bg-color)',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setEnteredPin('')}
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  borderRadius: '16px',
                  border: '2px solid transparent',
                  background: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                Clear
              </button>
              <button
                key={0}
                type="button"
                onClick={() => handleKeypadPress('0')}
                style={{
                  padding: '1rem',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  borderRadius: '16px',
                  border: '2px solid var(--border)',
                  background: 'var(--bg-color)',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  borderRadius: '16px',
                  border: '2px solid transparent',
                  background: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ⌫
              </button>
            </div>

            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => {
                setPinGateProfileId(null);
                setEnteredPin('');
                setPinError(false);
              }}
              style={{ width: '100%', padding: '0.75rem' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add Profile Modal */}
      {isAdding && (
        <div className="add-profile-modal">
          <div className="add-profile-content" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Add New Profile</h2>
              <button 
                type="button" 
                onClick={() => {
                  setIsAdding(false);
                  setNewPin('');
                  setConfirmPin('');
                  setConfirmPinError(false);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAdd}>
              <input
                autoFocus
                type="text"
                placeholder="Child's Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={15}
                required
              />
              
              <div style={{ marginTop: '1.5rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontWeight: 'bold' }}>Pick an Avatar:</p>
                <div className="avatar-grid">
                  {AVATARS.map((a) => (
                    <button
                      key={a.emoji}
                      type="button"
                      className={`avatar-btn ${selectedAvatar === a.emoji ? 'selected' : ''}`}
                      style={{ backgroundColor: a.color }}
                      onClick={() => setSelectedAvatar(a.emoji)}
                    >
                      {a.emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', background: 'rgba(255,107,107,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <p style={{ margin: '0 0 0.25rem 0', color: 'var(--text-muted)', fontWeight: 'bold' }}>Set 4-Digit Profile PIN (Optional):</p>
                <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                  🔑 **Why set a PIN?** Since profiles sync across all family devices in the cloud, a PIN keeps other kids from accidentally opening this profile and changing books, progress, or points!
                </p>
                <input
                  type="text"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  placeholder="e.g. 1234"
                  value={newPin}
                  onChange={(e) => handlePinChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: '2px solid var(--border)',
                    width: '100%',
                    fontSize: '1.2rem',
                    textAlign: 'center',
                    letterSpacing: '0.5rem',
                    boxSizing: 'border-box'
                  }}
                />

                {newPin.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontWeight: 'bold' }}>Confirm Profile PIN:</p>
                    <input
                      type="text"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      placeholder="e.g. 1234"
                      value={confirmPin}
                      onChange={(e) => handleConfirmPinChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '12px',
                        border: confirmPinError ? '2px solid var(--primary)' : '2px solid var(--border)',
                        width: '100%',
                        fontSize: '1.2rem',
                        textAlign: 'center',
                        letterSpacing: '0.5rem',
                        boxSizing: 'border-box'
                      }}
                    />
                    {confirmPinError && (
                      <p style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>
                        PINs do not match! Please verify.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn-secondary" onClick={() => {
                  setIsAdding(false);
                  setNewPin('');
                  setConfirmPin('');
                  setConfirmPinError(false);
                }} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={!newName.trim() || (newPin && newPin.length !== 4)} style={{ flex: 1 }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
