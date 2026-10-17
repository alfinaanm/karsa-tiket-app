import React from 'react';

export default function LoadingState({ type = 'cards', count = 3 }) {
  if (type === 'skeleton-rekap') {
    return (
      <div className="skeleton-container" id="skeleton-rekap">
        {/* Banner Skeleton */}
        <div className="skeleton-card skeleton-banner">
          <div className="skeleton-line skeleton-title-shimmer" style={{ width: '40%', height: '24px' }}></div>
          <div className="skeleton-line" style={{ width: '60%', height: '14px', marginTop: '12px' }}></div>
        </div>

        {/* 4 Stat Cards Skeleton */}
        <div className="stats-grid" style={{ marginTop: '20px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card skeleton-card">
              <div className="skeleton-line" style={{ width: '50%', height: '14px', marginBottom: '12px' }}></div>
              <div className="skeleton-line" style={{ width: '70%', height: '32px', marginBottom: '12px' }}></div>
              <div className="skeleton-line" style={{ width: '100%', height: '8px', borderRadius: '4px' }}></div>
            </div>
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="skeleton-card" style={{ marginTop: '24px', padding: '24px' }}>
          <div className="skeleton-line" style={{ width: '30%', height: '20px', marginBottom: '16px' }}></div>
          <div className="skeleton-line" style={{ width: '100%', height: '40px', marginBottom: '8px' }}></div>
          <div className="skeleton-line" style={{ width: '100%', height: '40px', marginBottom: '8px' }}></div>
          <div className="skeleton-line" style={{ width: '100%', height: '40px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="cards-grid" id="loading-cards">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card skeleton-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div className="skeleton-line" style={{ width: '65%', height: '20px' }}></div>
            <div className="skeleton-line" style={{ width: '20%', height: '18px', borderRadius: '999px' }}></div>
          </div>
          <div className="skeleton-line" style={{ width: '50%', height: '14px', marginBottom: '10px' }}></div>
          <div className="skeleton-line" style={{ width: '85%', height: '14px', marginBottom: '10px' }}></div>
          <div className="skeleton-line" style={{ width: '40%', height: '14px', marginBottom: '16px' }}></div>
          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
            <div className="skeleton-line" style={{ width: '30%', height: '14px' }}></div>
            <div className="skeleton-line" style={{ width: '40%', height: '28px', borderRadius: '8px' }}></div>
          </div>
        </div>
      ))}
    </div>
  );
}
