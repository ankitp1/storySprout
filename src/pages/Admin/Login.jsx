import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { Lock, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { adminPin, setAdminStatus } = useStore();

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === adminPin) {
      setAdminStatus(true);
      navigate('/admin');
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', flex: 1 }}>
      <div className="glass" style={{ padding: '3rem', borderRadius: 'var(--radius-lg)', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <div style={{ background: 'var(--accent-bg)', width: '80px', height: '80px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--accent)' }}>
          <Lock size={40} />
        </div>
        <h2 style={{ marginBottom: '0.5rem' }}>Parents Only</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Enter PIN to add or manage books</p>
        
        <form onSubmit={handleLogin}>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN (1234)"
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1.5rem',
              textAlign: 'center',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--border)',
              marginBottom: '1rem',
              background: 'var(--surface-color)',
              color: 'var(--text-main)',
              letterSpacing: '0.2em'
            }}
            maxLength={4}
            pattern="\d{4}"
          />
          {error && <p style={{ color: 'var(--primary)', marginBottom: '1rem' }}>{error}</p>}
          <button type="submit" className="btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>
            Unlock
          </button>
        </form>
        
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', color: 'var(--text-muted)', gap: '0.5rem', marginTop: '1rem' }}>
          <ArrowLeft size={20} /> Back to Library
        </button>
      </div>
    </div>
  );
}
