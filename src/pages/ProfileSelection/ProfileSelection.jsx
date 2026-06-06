import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { Plus } from 'lucide-react';
import './ProfileSelection.css';

export default function ProfileSelection() {
  const { profiles, setActiveProfile, addProfile } = useStore();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🦊');

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
    setActiveProfile(profileId);
    navigate('/');
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (newName.trim()) {
      const avatarData = AVATARS.find(a => a.emoji === selectedAvatar) || AVATARS[0];
      addProfile(newName.trim(), avatarData.emoji, avatarData.color);
      setNewName('');
      setSelectedAvatar('🦊');
      setIsAdding(false);
    }
  };

  return (
    <div className="profile-screen">
      <h1 className="profile-title">Who's listening?</h1>
      
      <div className="profiles-container">
        {profiles.map(profile => (
          <div key={profile.id} className="profile-card" onClick={() => handleSelect(profile.id)}>
            <div className="profile-avatar" style={{ backgroundColor: profile.color }}>
              {profile.avatar || profile.name.charAt(0).toUpperCase()}
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

      {isAdding && (
        <div className="add-profile-modal">
          <div className="add-profile-content">
            <h2>Add New Profile</h2>
            <form onSubmit={handleAdd}>
              <input
                autoFocus
                type="text"
                placeholder="Child's Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={15}
              />
              
              <div style={{ marginTop: '1.5rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Pick an Avatar:</p>
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

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsAdding(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={!newName.trim()}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
