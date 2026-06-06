import React, { useState } from 'react';
import { Lock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PINEntry({ onSuccess, isModal, onCancel }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const navigate = useNavigate();
  
  const CORRECT_PIN = '6556'; // In a real app, this would be env var or user set

  const handleKeyPress = (num) => {
    setError(false);
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      if (newPin.length === 4) {
        if (newPin === CORRECT_PIN) {
          onSuccess();
        } else {
          setError(true);
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError(false);
  };

  return (
    <div style={{
      minHeight: isModal ? 'auto' : '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: isModal ? 'transparent' : 'var(--bg-color)',
      padding: isModal ? '0' : '2rem'
    }}>
      {!isModal && (
        <div style={{ position: 'absolute', top: '2rem', left: '2rem' }}>
          <button className="btn-icon" onClick={() => navigate('/')}>
            <ArrowLeft size={32} />
          </button>
        </div>
      )}

      <div style={{
        background: 'var(--surface-color)',
        padding: '3rem',
        borderRadius: '24px',
        boxShadow: isModal ? 'none' : '0 20px 40px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%',
        position: 'relative'
      }}>
        {isModal && onCancel && (
          <button 
            onClick={onCancel}
            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            ×
          </button>
        )}
        <Lock size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
        <h2 style={{ margin: '0 0 2rem 0' }}>{isModal ? 'Parental Approval Required' : 'Parent Dashboard'}</h2>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{
              width: '20px', height: '20px',
              borderRadius: '50%',
              background: i < pin.length ? 'var(--primary)' : 'var(--border)',
              transition: 'background 0.2s',
              animation: error ? 'shake 0.4s' : 'none'
            }} />
          ))}
        </div>

        {error && <p style={{ color: 'var(--danger-color)', marginTop: '-1rem', marginBottom: '1rem' }}>Incorrect PIN</p>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              style={{
                background: 'var(--bg-color)',
                border: 'none',
                borderRadius: '50%',
                width: '70px', height: '70px',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                margin: '0 auto',
                color: 'var(--text-main)'
              }}
            >
              {num}
            </button>
          ))}
          <div></div>
          <button
            onClick={() => handleKeyPress('0')}
            style={{
              background: 'var(--bg-color)',
              border: 'none',
              borderRadius: '50%',
              width: '70px', height: '70px',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              margin: '0 auto',
              color: 'var(--text-main)'
            }}
          >
            0
          </button>
          <button
            onClick={handleDelete}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1rem',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
