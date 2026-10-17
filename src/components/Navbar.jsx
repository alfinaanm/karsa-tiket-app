import React from 'react';
import { Calendar, Users, Ticket, BarChart3, Sparkles } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'event', label: 'Event', icon: Calendar, subtitle: 'Master Acara' },
    { id: 'pembeli', label: 'Pembeli', icon: Users, subtitle: 'Data Peserta' },
    { id: 'tiket', label: 'Tiket', icon: Ticket, subtitle: 'Transaksi' },
    { id: 'rekap', label: 'Rekap', icon: BarChart3, subtitle: 'Ringkasan' },
  ];

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <a href="#event" onClick={() => setActiveTab('event')} className="brand">
          <div className="brand-icon">
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ lineHeight: 1.1 }}>Karsa Tiket</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Tiketing Komunitas Kreatif
            </div>
          </div>
        </a>

        <nav className="nav-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`nav-btn ${isActive ? 'active' : ''}`}
                title={item.subtitle}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
