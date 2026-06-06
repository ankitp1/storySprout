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

  const handleSelect = (profileId) => {
    setActiveProfile(profileId);
    navigate('/');
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (newName.trim()) {
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      addProfile(newName.trim(), randomColor);
      setNewName('');
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
              {profile.name.charAt(0).toUpperCase()}
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
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
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
