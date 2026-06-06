import React from 'react';
import useStore from '../../store/useStore';

export default function DashboardOverview({ profileId }) {
  const listeningStats = useStore(state => state.listeningStats[profileId] || {});
  const books = useStore(state => state.books);

  const stats = Object.values(listeningStats);
  const totalSeconds = stats.reduce((acc, curr) => acc + (curr.totalTimeSeconds || 0), 0);
  const totalHours = (totalSeconds / 3600).toFixed(1);
  const completedCount = stats.filter(s => s.completed).length;
  const sessionsCount = stats.reduce((acc, curr) => acc + (curr.sessionsCount || 0), 0);
  
  const averageSessionLength = sessionsCount > 0 
    ? Math.round(totalSeconds / sessionsCount / 60) 
    : 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
      <StatCard 
        label="Total Listening Time"
        value={`${totalHours} hrs`}
        icon="⏱️"
      />
      <StatCard 
        label="Books Completed"
        value={completedCount}
        icon="📚"
        detail={`${sessionsCount} listening sessions`}
      />
      <StatCard 
        label="Average Session"
        value={`${averageSessionLength} min`}
        icon="⏰"
      />
    </div>
  );
}

function StatCard({ label, value, icon, detail }) {
  return (
    <div style={{
      background: 'var(--surface-color)',
      borderRadius: '16px',
      padding: '1.5rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
    }}>
      <p style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>{icon}</p>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0 0 0.25rem 0' }}>{label}</p>
      <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>{value}</p>
      {detail && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>{detail}</p>}
    </div>
  );
}
