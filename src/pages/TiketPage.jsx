import React, { useState, useEffect } from 'react';
import {
  getTiket,
  addTiket,
  updateTiketStatus,
  deleteTiket,
  getEvents,
  getPembeli
} from '../services/dataService';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import {
  Ticket,
  Plus,
  CheckCircle,
  XCircle,
  UserCheck,
  Calendar,
  User,
  CreditCard,
  Trash2,
  AlertCircle
} from 'lucide-react';

export default function TiketPage({ showToast }) {
  const [tickets, setTickets] = useState([]);
  const [events, setEvents] = useState([]);
  const [pembeliList, setPembeliList] = useState([]);
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals & Dialogs
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    event_id: '',
    pembeli_id: '',
    jumlah_tiket: 1
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const filterOptions = [
    { id: 'Semua', label: 'Semua Tiket' },
    { id: 'menunggu_bayar', label: 'Menunggu Bayar' },
    { id: 'lunas', label: 'Lunas' },
    { id: 'hadir', label: 'Hadir (Check-in)' },
    { id: 'dibatalkan', label: 'Dibatalkan' }
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [tList, evList, pbList] = await Promise.all([
        getTiket(activeFilter),
        getEvents(),
        getPembeli()
      ]);
      setTickets(tList);
      setEvents(evList);
      setPembeliList(pbList);
    } catch (err) {
      setError(err.message || 'Gagal memuat data tiket');
      showToast(err.message || 'Gagal memuat data tiket', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeFilter]);

  const openAddModal = () => {
    // Default to first event with quota and first buyer if available
    const availableEvent = events.find((e) => (e.kuota - (e.tiket_terjual || 0)) > 0) || events[0];
    const defaultBuyer = pembeliList[0];

    setFormData({
      event_id: availableEvent ? availableEvent.id : '',
      pembeli_id: defaultBuyer ? (defaultBuyer.no_whatsapp || defaultBuyer.id) : '',
      jumlah_tiket: 1
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const selectedEventObj = events.find((e) => e.id === formData.event_id);
  const currentEventPrice = selectedEventObj ? selectedEventObj.harga_tiket : 0;
  const currentSisaKuota = selectedEventObj
    ? Math.max(0, selectedEventObj.kuota - (selectedEventObj.tiket_terjual || 0))
    : 0;
  const calculatedTotal = currentEventPrice * (Number(formData.jumlah_tiket) || 0);

  // Prefill using schema example: Workshop Sablon + Nadia Putri + 2 tiket
  const prefillSchemaExample = () => {
    const workshopEvent = events.find((e) => e.nama.includes('Sablon')) || events[0];
    const nadiaBuyer = pembeliList.find((p) => p.nama.includes('Nadia')) || pembeliList[0];

    if (workshopEvent && nadiaBuyer) {
      setFormData({
        event_id: workshopEvent.id,
        pembeli_id: nadiaBuyer.no_whatsapp || nadiaBuyer.id,
        jumlah_tiket: 2
      });
      setFormErrors({});
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.event_id) {
      errors.event_id = 'Pilih salah satu event.';
    }
    if (!formData.pembeli_id) {
      errors.pembeli_id = 'Pilih salah satu pembeli.';
    }
    const qty = Number(formData.jumlah_tiket);
    if (!qty || qty < 1 || qty > 5 || !Number.isInteger(qty)) {
      errors.jumlah_tiket = 'Jumlah tiket harus 1 sampai 5.';
    } else if (selectedEventObj && qty > currentSisaKuota) {
      errors.jumlah_tiket = `Jumlah tiket (${qty}) melebihi sisa kuota yang tersedia (${currentSisaKuota}).`;
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      await addTiket({
        event_id: formData.event_id,
        pembeli_id: formData.pembeli_id,
        jumlah_tiket: Number(formData.jumlah_tiket)
      });
      showToast('Tiket transaksi berhasil dicatat dengan status menunggu_bayar!');
      setIsAddModalOpen(false);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan transaksi tiket', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Status Change Action Handlers
  const handleStatusChange = async (tiketId, newStatus) => {
    try {
      setSubmitting(true);
      await updateTiketStatus(tiketId, newStatus);
      showToast(`Status tiket berhasil diubah menjadi "${newStatus}"!`);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Gagal memperbarui status tiket', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    try {
      setSubmitting(true);
      await updateTiketStatus(cancelTarget.id, 'dibatalkan');
      showToast(`Tiket #${cancelTarget.id} dibatalkan dan kuota acara dikembalikan.`);
      setCancelTarget(null);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Gagal membatalkan tiket', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      await deleteTiket(deleteTarget.id);
      showToast(`Tiket #${deleteTarget.id} berhasil dihapus.`);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Gagal menghapus tiket', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'menunggu_bayar':
        return <span className="badge badge-amber">Menunggu Bayar</span>;
      case 'lunas':
        return <span className="badge badge-emerald">Lunas</span>;
      case 'hadir':
        return <span className="badge badge-sky">Hadir (Check-in)</span>;
      case 'dibatalkan':
        return <span className="badge badge-rose">Dibatalkan</span>;
      default:
        return <span className="badge badge-gray">{status}</span>;
    }
  };

  const formatRupiah = (num) => {
    if (num === 0) return 'Gratis';
    return 'Rp ' + Number(num).toLocaleString('id-ID');
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Transaksi Tiket</h1>
          <p>Catat pembelian tiket, verifikasi pelunasan transfer, dan check-in kehadiran acara.</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary" id="btn-tambah-tiket">
          <Plus size={18} />
          <span>Buat Tiket Baru</span>
        </button>
      </div>

      {/* Tabs Filter Status */}
      <div className="tabs-container">
        {filterOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setActiveFilter(opt.id)}
            className={`tab-btn ${activeFilter === opt.id ? 'active' : ''}`}
            id={`tab-status-${opt.id}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState count={3} />
      ) : error ? (
        <ErrorState
          title="Gagal Memuat Transaksi Tiket"
          message={error}
          onRetry={loadData}
        />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title={
            activeFilter !== 'Semua'
              ? `Belum Ada Tiket Berstatus "${activeFilter}"`
              : 'Belum Ada Transaksi Tiket'
          }
          description="Pilih event dan pembeli yang sudah terdaftar untuk mencatat pembelian tiket baru."
          actionLabel="Buat Tiket Baru"
          onAction={openAddModal}
          id="empty-state-tiket"
        />
      ) : (
        <div className="cards-grid">
          {tickets.map((t) => (
            <div key={t.id} className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">{t.nama_event}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <Calendar size={13} style={{ color: 'var(--text-dim)' }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {t.tanggal_event}
                    </span>
                  </div>
                </div>
                {getStatusBadge(t.status)}
              </div>

              <div className="card-body">
                <div className="info-row">
                  <User size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: 'var(--text-main)' }}>{t.nama_pembeli}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      WA: {t.pembeli_id}
                    </div>
                  </div>
                </div>

                <div className="info-row" style={{ marginTop: '4px' }}>
                  <Ticket size={16} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
                  <span>
                    Jumlah: <strong>{t.jumlah_tiket} tiket</strong> (@ {formatRupiah(t.harga_tiket)})
                  </span>
                </div>

                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    marginTop: '6px',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Pembayaran:</span>
                  <strong style={{ fontSize: '1.05rem', color: '#34d399' }}>
                    {formatRupiah(t.total)}
                  </strong>
                </div>

                {/* Tombol Ubah Status Sesuai Status Flow PRD Bagian 4 & 5.3 */}
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {t.status === 'menunggu_bayar' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        onClick={() => handleStatusChange(t.id, 'lunas')}
                        className="btn btn-success btn-sm"
                        disabled={submitting}
                        title="Tandai pembayaran telah diterima"
                        id={`btn-lunas-${t.id}`}
                      >
                        <CheckCircle size={14} />
                        <span>Konfirmasi Lunas</span>
                      </button>
                      <button
                        onClick={() => setCancelTarget(t)}
                        className="btn btn-danger btn-sm"
                        disabled={submitting}
                        title="Batalkan pembelian dan kembalikan kuota"
                        id={`btn-batal-${t.id}`}
                      >
                        <XCircle size={14} />
                        <span>Batalkan</span>
                      </button>
                    </div>
                  )}

                  {t.status === 'lunas' && (
                    <button
                      onClick={() => handleStatusChange(t.id, 'hadir')}
                      className="btn btn-info btn-sm"
                      disabled={submitting}
                      style={{ width: '100%' }}
                      title="Check-in kehadiran di hari acara"
                      id={`btn-checkin-${t.id}`}
                    >
                      <UserCheck size={14} />
                      <span>Check-in Hadir</span>
                    </button>
                  )}

                  {t.status === 'hadir' && (
                    <div
                      style={{
                        padding: '6px 10px',
                        background: 'rgba(2, 132, 199, 0.1)',
                        border: '1px solid rgba(2, 132, 199, 0.25)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem',
                        color: '#38bdf8',
                        textAlign: 'center'
                      }}
                    >
                      ✓ Peserta telah hadir di lokasi acara
                    </div>
                  )}

                  {t.status === 'dibatalkan' && (
                    <div
                      style={{
                        padding: '6px 10px',
                        background: 'rgba(244, 63, 94, 0.1)',
                        border: '1px solid rgba(244, 63, 94, 0.25)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem',
                        color: '#fb7185',
                        textAlign: 'center'
                      }}
                    >
                      ✕ Transaksi dibatalkan (kuota telah dikembalikan)
                    </div>
                  )}
                </div>
              </div>

              <div className="card-footer">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  ID: {t.id}
                </span>
                <button
                  onClick={() => setDeleteTarget(t)}
                  className="btn btn-danger btn-sm"
                  title="Hapus Dokumen Tiket"
                  id={`btn-delete-tiket-${t.id}`}
                >
                  <Trash2 size={14} />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Buat Tiket Baru */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Buat Transaksi Tiket Baru"
      >
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={prefillSchemaExample}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem' }}
            >
              Gunakan Contoh Skema (Workshop Sablon - Nadia Putri)
            </button>
          </div>

          {/* Pilih Event */}
          <div className="form-group">
            <label htmlFor="tk-event">Pilih Event *</label>
            <select
              id="tk-event"
              className="form-control"
              value={formData.event_id}
              onChange={(e) => setFormData({ ...formData, event_id: e.target.value })}
            >
              <option value="">-- Pilih Acara --</option>
              {events.map((ev) => {
                const sisa = Math.max(0, ev.kuota - (ev.tiket_terjual || 0));
                return (
                  <option key={ev.id} value={ev.id} disabled={sisa === 0}>
                    {ev.nama} ({formatRupiah(ev.harga_tiket)}) — Sisa Kuota: {sisa} kursi
                  </option>
                );
              })}
            </select>
            {formErrors.event_id && <div className="error-text">{formErrors.event_id}</div>}
          </div>

          {/* Pilih Pembeli */}
          <div className="form-group">
            <label htmlFor="tk-pembeli">Pilih Pembeli (Data Orang) *</label>
            <select
              id="tk-pembeli"
              className="form-control"
              value={formData.pembeli_id}
              onChange={(e) => setFormData({ ...formData, pembeli_id: e.target.value })}
            >
              <option value="">-- Pilih Pembeli --</option>
              {pembeliList.map((pb) => (
                <option key={pb.id} value={pb.no_whatsapp || pb.id}>
                  {pb.nama} — {pb.no_whatsapp || pb.id}
                </option>
              ))}
            </select>
            {formErrors.pembeli_id && <div className="error-text">{formErrors.pembeli_id}</div>}
          </div>

          {/* Jumlah Tiket */}
          <div className="form-group">
            <label htmlFor="tk-jumlah">Jumlah Tiket (1-5) *</label>
            <input
              id="tk-jumlah"
              type="number"
              min="1"
              max={Math.min(5, currentSisaKuota || 5)}
              step="1"
              className="form-control"
              value={formData.jumlah_tiket}
              onChange={(e) => setFormData({ ...formData, jumlah_tiket: e.target.value })}
            />
            {formErrors.jumlah_tiket && <div className="error-text">{formErrors.jumlah_tiket}</div>}
            <div className="helper-text">
              Maksimal 5 tiket per pesanan dan tidak melebihi sisa kuota (tersedia {currentSisaKuota} kursi).
            </div>
          </div>

          {/* Ringkasan Perhitungan Total Otomatis */}
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              marginTop: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Harga Satuan:</span>
              <span>{formatRupiah(currentEventPrice)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Jumlah:</span>
              <span>{formData.jumlah_tiket || 0} Tiket</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px dashed rgba(255, 255, 255, 0.15)',
                fontWeight: 700
              }}
            >
              <span>Total Bayar:</span>
              <span style={{ color: '#34d399', fontSize: '1.1rem' }}>
                {formatRupiah(calculatedTotal)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              id="btn-submit-tiket"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Tiket'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Dialog Konfirmasi Pembatalan Tiket (Mengembalikan Kuota) */}
      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelConfirm}
        title="Konfirmasi Batalkan Tiket"
        message={`Apakah Anda yakin ingin membatalkan tiket #${cancelTarget?.id} atas nama "${cancelTarget?.nama_pembeli}"? Kuota sebanyak ${cancelTarget?.jumlah_tiket} kursi akan dikembalikan ke event.`}
        confirmLabel="Ya, Batalkan Tiket"
        confirmVariant="danger"
        isLoading={submitting}
      />

      {/* Dialog Konfirmasi Hapus Dokumen Tiket */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Konfirmasi Hapus Tiket"
        message={`Apakah Anda yakin ingin menghapus arsip tiket #${deleteTarget?.id}? Tindakan ini akan menghapus dokumen dari database.`}
        confirmLabel="Hapus Dokumen"
        confirmVariant="danger"
        isLoading={submitting}
      />
    </div>
  );
}
