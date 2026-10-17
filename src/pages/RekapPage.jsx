import React, { useState, useEffect } from 'react';
import { getEvents, getRekapData } from '../services/dataService';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import {
  BarChart3,
  Calendar,
  DollarSign,
  Users,
  Ticket,
  UserCheck,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function RekapPage({ showToast }) {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [rekap, setRekap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingRekap, setLoadingRekap] = useState(false);
  const [error, setError] = useState(null);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const evList = await getEvents();
      setEvents(evList);
      if (evList.length > 0) {
        setSelectedEventId(evList[0].id);
      }
    } catch (err) {
      setError(err.message || 'Gagal memuat daftar event');
      showToast(err.message || 'Gagal memuat daftar event untuk rekap', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const loadRekap = async () => {
    if (!selectedEventId) {
      setRekap(null);
      return;
    }
    try {
      setLoadingRekap(true);
      setError(null);
      const data = await getRekapData(selectedEventId);
      setRekap(data);
    } catch (err) {
      setError(err.message || 'Gagal memuat rekapitulasi data event');
      showToast(err.message || 'Gagal memuat rekap data event', 'error');
    } finally {
      setLoadingRekap(false);
    }
  };

  useEffect(() => {
    loadRekap();
  }, [selectedEventId]);

  const formatRupiah = (num) => {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  };

  const percentTerjual = rekap && rekap.kuota > 0
    ? Math.min(100, Math.round((rekap.tiket_terjual / rekap.kuota) * 100))
    : 0;

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Rekapitulasi Penjualan & Kehadiran</h1>
          <p>
            Ringkasan data per event: tiket terjual, sisa kuota, pendapatan lunas, dan peserta hadir.
          </p>
        </div>

        {events.length > 0 && (
          <div style={{ minWidth: '280px' }}>
            <label
              htmlFor="select-event-rekap"
              style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}
            >
              Pilih Event:
            </label>
            <select
              id="select-event-rekap"
              className="form-control"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.nama} ({ev.tanggal})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <LoadingState count={3} />
      ) : error ? (
        <ErrorState
          title="Gagal Memuat Rekapitulasi"
          message={error}
          onRetry={loadRekap}
        />
      ) : events.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Belum ada data event"
          description="Buat event terlebih dahulu di modul Event untuk melihat statistik dan rekapitulasi."
        />
      ) : loadingRekap || !rekap ? (
        <LoadingState type="skeleton-rekap" />
      ) : (
        <div>
          {/* Banner Event Information */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.08))',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px',
              marginBottom: '24px',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px'
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {rekap.event.nama}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
                📍 {rekap.event.lokasi} &nbsp;|&nbsp; 🗓️ {rekap.event.tanggal} &nbsp;|&nbsp; 🏷️ Harga:{' '}
                {rekap.event.harga_tiket === 0 ? 'Gratis' : formatRupiah(rekap.event.harga_tiket)}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="badge badge-sky">Event ID: {rekap.event.id}</span>
            </div>
          </div>

          {/* 4 Stat Cards */}
          <div className="stats-grid">
            {/* 1. Tiket Terjual */}
            <div className="stat-card">
              <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Ticket size={16} style={{ color: '#818cf8' }} />
                <span>Tiket Terjual</span>
              </div>
              <div className="stat-value" style={{ color: '#a5b4fc' }}>
                {rekap.tiket_terjual}{' '}
                <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-dim)' }}>
                  / {rekap.kuota} kursi
                </span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${percentTerjual}%` }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                {percentTerjual}% kapasitas terisi
              </div>
            </div>

            {/* 2. Sisa Kuota */}
            <div className="stat-card">
              <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={16} style={{ color: '#fbbf24' }} />
                <span>Sisa Kuota Kursi</span>
              </div>
              <div className="stat-value" style={{ color: rekap.sisa_kuota === 0 ? '#fb7185' : '#fbbf24' }}>
                {rekap.sisa_kuota}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 'auto' }}>
                {rekap.sisa_kuota === 0 ? 'Kapasitas telah penuh (Habis)' : 'Tersedia untuk pembeli baru'}
              </div>
            </div>

            {/* 3. Total Pendapatan Sah (Lunas + Hadir) */}
            <div className="stat-card">
              <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DollarSign size={16} style={{ color: '#34d399' }} />
                <span>Pendapatan Bersih</span>
              </div>
              <div className="stat-value" style={{ color: '#34d399' }}>
                {formatRupiah(rekap.pendapatan)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 'auto' }}>
                *Hanya dari tiket status <strong>Lunas</strong> dan <strong>Hadir</strong>
              </div>
            </div>

            {/* 4. Jumlah Hadir Check-in */}
            <div className="stat-card">
              <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserCheck size={16} style={{ color: '#38bdf8' }} />
                <span>Peserta Hadir</span>
              </div>
              <div className="stat-value" style={{ color: '#38bdf8' }}>
                {rekap.jumlah_hadir}{' '}
                <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-dim)' }}>
                  orang
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 'auto' }}>
                Check-in saat hari acara
              </div>
            </div>
          </div>

          {/* Rincian Transaksi Event */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px'
            }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
              Rincian Tiket untuk "{rekap.event.nama}"
            </h3>

            {rekap.tiketList.length === 0 ? (
              <EmptyState
                icon={Ticket}
                title="Belum Ada Tiket Terjual"
                description={`Event "${rekap.event.nama}" belum memiliki transaksi tiket.`}
                id="empty-state-rekap-tiket"
              />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px 14px' }}>ID Tiket</th>
                      <th style={{ padding: '10px 14px' }}>Nama Pembeli</th>
                      <th style={{ padding: '10px 14px' }}>No WhatsApp</th>
                      <th style={{ padding: '10px 14px' }}>Jumlah</th>
                      <th style={{ padding: '10px 14px' }}>Total Bayar</th>
                      <th style={{ padding: '10px 14px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rekap.tiketList.map((t) => (
                      <tr
                        key={t.id}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: 'var(--text-dim)' }}>
                          {t.id}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600 }}>{t.nama_pembeli}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{t.pembeli_id}</td>
                        <td style={{ padding: '12px 14px' }}>{t.jumlah_tiket} tiket</td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: t.status === 'lunas' || t.status === 'hadir' ? '#34d399' : 'var(--text-muted)' }}>
                          {formatRupiah(t.total)}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {t.status === 'menunggu_bayar' && (
                            <span className="badge badge-amber">Menunggu Bayar</span>
                          )}
                          {t.status === 'lunas' && (
                            <span className="badge badge-emerald">Lunas</span>
                          )}
                          {t.status === 'hadir' && (
                            <span className="badge badge-sky">Hadir</span>
                          )}
                          {t.status === 'dibatalkan' && (
                            <span className="badge badge-rose">Dibatalkan</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
