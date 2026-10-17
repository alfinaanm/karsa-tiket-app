import React, { useState } from 'react';
import Navbar from './components/Navbar';
import EventsPage from './pages/EventsPage';
import PembeliPage from './pages/PembeliPage';
import TiketPage from './pages/TiketPage';
import RekapPage from './pages/RekapPage';
import Toast from './components/Toast';

export default function App() {
  const [activeTab, setActiveTab] = useState('event');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  return (
    <div className="app-container">
      {/* Navigation Bar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Modules */}
      <main className="main-content">
        {activeTab === 'event' && <EventsPage showToast={showToast} />}
        {activeTab === 'pembeli' && <PembeliPage showToast={showToast} />}
        {activeTab === 'tiket' && <TiketPage showToast={showToast} />}
        {activeTab === 'rekap' && <RekapPage showToast={showToast} />}
      </main>

      {/* Global Toast Alerts */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '20px',
          textAlign: 'center',
          color: 'var(--text-dim)',
          fontSize: '0.8rem'
        }}
      >
        <p>
          Karsa Tiket &copy; {new Date().getFullYear()} &middot; Tugas Mandiri Sesi 3 &middot; Cloud Firestore &amp; Vite React
        </p>
      </footer>
    </div>
  );
}
