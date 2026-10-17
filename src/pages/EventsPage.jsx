import React, { useState, useEffect } from 'react';
import { getEvents, addEvent, updateEvent, deleteEvent } from '../services/dataService';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { Calendar, MapPin, Users, Plus, Edit2, Trash2, Ticket, Tag } from 'lucide-react';

export default function EventsPage({ showToast }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    nama: '',
    tanggal: '',
    lokasi: '',
    harga_tiket: '',
    kuota: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEvents();
      setEvents(data);
    } catch (err) {
      setError(err.message || 'Gagal memuat daftar event');
      showToast(err.message || 'Gagal memuat daftar event', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const openAddModal = () => {
    setEditingEvent(null);
    setFormData({
      nama: '',
      tanggal: new Date().toISOString().split('T')[0],
      lokasi: '',
      harga_tiket: '',
      kuota: ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (event) => {
    setEditingEvent(event);
    setFormData({
      nama: event.nama || '',
      tanggal: event.tanggal || '',
      lokasi: event.lokasi || '',
      harga_tiket: event.harga_tiket ?? '',
      kuota: event.kuota ?? ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Prefill using schema example
  const prefillSchemaExample = () => {
    setFormData({
      nama: 'Workshop Sablon Tote Bag',
      tanggal: '2026-10-18',
      lokasi: 'Ruang Karsa, Jl. Merdeka No. 21',
      harga_tiket: 75000,
      kuota: 30
    });
    setFormErrors({});
  };

  const validate = () => {
    const errors = {};
    if (!formData.nama.trim() || formData.nama.length > 60) {
      errors.nama = 'Nama acara wajib diisi (1-60 karakter).';
    }
    if (!formData.tanggal || !/^\d{4}-\d{2}-\d{2}$/.test(formData.tanggal)) {
      errors.tanggal = 'Tanggal acara harus berformat YYYY-MM-DD.';
    }
    if (!formData.lokasi.trim() || formData.lokasi.length > 100) {
      errors.lokasi = 'Lokasi acara wajib diisi (1-100 karakter).';
    }
    const harga = Number(formData.harga_tiket);
    if (formData.harga_tiket === '' || isNaN(harga) || harga < 0 || !Number.isInteger(harga)) {
      errors.harga_tiket = 'Harga tiket minimal 0 dan harus berupa angka bulat.';
    }
    const kuota = Number(formData.kuota);
    if (formData.kuota === '' || isNaN(kuota) || kuota < 1 || kuota > 500 || !Number.isInteger(kuota)) {
      errors.kuota = 'Kuota harus berupa angka bulat 1 sampai 500.';
    } else if (editingEvent && kuota < (editingEvent.tiket_terjual || 0)) {
      errors.kuota = `Kuota tidak boleh lebih kecil dari tiket yang sudah terjual (${editingEvent.tiket_terjual}).`;
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      if (editingEvent) {
        await updateEvent(editingEvent.id, formData);
        showToast('Event berhasil diperbarui!');
      } else {
        await addEvent(formData);
        showToast('Event berhasil ditambahkan!');
      }
      setIsModalOpen(false);
      await fetchEvents();
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan event', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      await deleteEvent(deleteTarget.id);
      showToast(`Event "${deleteTarget.nama}" berhasil dihapus.`);
      setDeleteTarget(null);
      await fetchEvents();
    } catch (err) {
      showToast(err.message || 'Gagal menghapus event', 'error');
    } finally {
      setSubmitting(false);
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
          <h1>Master Data Event</h1>
          <p>Kelola acara, kuota kursi, jadwal, dan pantau ketersediaan tiket.</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary" id="btn-tambah-event">
          <Plus size={18} />
          <span>Tambah Event</span>
        </button>
      </div>

      {loading ? (
        <LoadingState count={3} />
      ) : error ? (
        <ErrorState
          title="Gagal Memuat Daftar Event"
          message={error}
          onRetry={fetchEvents}
        />
      ) : events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Belum ada event"
          description="Buat event perdana untuk komunitas Anda dan mulai penjualan tiket workshop atau konser."
          actionLabel="Tambah Event"
          onAction={openAddModal}
          id="empty-state-event"
        />
      ) : (
        <div className="cards-grid">
          {events.map((ev) => {
            const terjual = ev.tiket_terjual || 0;
            const sisa = Math.max(0, ev.kuota - terjual);
            const isHabis = terjual >= ev.kuota;

            return (
              <div key={ev.id} className="card">
                <div className="card-header">
                  <h3 className="card-title">{ev.nama}</h3>
                  {isHabis ? (
                    <span className="badge badge-rose">Habis</span>
                  ) : (
                    <span className="badge badge-emerald">Tersedia</span>
                  )}
                </div>

                <div className="card-body">
                  <div className="info-row">
                    <Calendar size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <span>{ev.tanggal}</span>
                  </div>
                  <div className="info-row">
                    <MapPin size={16} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ev.lokasi}
                    </span>
                  </div>
                  <div className="info-row">
                    <Tag size={16} style={{ color: '#38bdf8', flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {formatRupiah(ev.harga_tiket)}
                    </span>
                  </div>
                  <div className="info-row">
                    <Users size={16} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                    <span>
                      Kuota: <strong>{ev.kuota}</strong> | Terjual: <strong>{terjual}</strong>
                    </span>
                  </div>

                  {/* Sisa Kuota pill */}
                  <div style={{ marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Sisa Kuota:</span>
                      <strong style={{ color: isHabis ? '#fb7185' : '#34d399' }}>
                        {sisa} kursi
                      </strong>
                    </div>
                    <div style={{ background: 'rgba(255, 255, 255, 0.08)', height: '6px', borderRadius: '10px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(100, (terjual / (ev.kuota || 1)) * 100)}%`,
                          background: isHabis ? '#f43f5e' : 'linear-gradient(90deg, #6366f1, #10b981)'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="card-footer">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    ID: {ev.id}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => openEditModal(ev)}
                      className="btn btn-secondary btn-sm"
                      title="Ubah Event"
                      id={`btn-edit-event-${ev.id}`}
                    >
                      <Edit2 size={14} />
                      <span>Ubah</span>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(ev)}
                      className="btn btn-danger btn-sm"
                      title="Hapus Event"
                      id={`btn-delete-event-${ev.id}`}
                    >
                      <Trash2 size={14} />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tambah / Ubah Event */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEvent ? 'Ubah Data Event' : 'Tambah Event Baru'}
      >
        <form onSubmit={handleSubmit}>
          {!editingEvent && (
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={prefillSchemaExample}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.78rem' }}
              >
                Gunakan Contoh Skema (Workshop Sablon)
              </button>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="ev-nama">Nama Acara *</label>
            <input
              id="ev-nama"
              type="text"
              maxLength={60}
              placeholder="Contoh: Workshop Sablon Tote Bag"
              className="form-control"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            />
            {formErrors.nama && <div className="error-text">{formErrors.nama}</div>}
            <div className="helper-text">Maksimal 60 karakter</div>
          </div>

          <div className="form-group">
            <label htmlFor="ev-tanggal">Tanggal Acara *</label>
            <input
              id="ev-tanggal"
              type="date"
              className="form-control"
              value={formData.tanggal}
              onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
            />
            {formErrors.tanggal && <div className="error-text">{formErrors.tanggal}</div>}
            <div className="helper-text">Format: YYYY-MM-DD</div>
          </div>

          <div className="form-group">
            <label htmlFor="ev-lokasi">Lokasi Acara *</label>
            <input
              id="ev-lokasi"
              type="text"
              maxLength={100}
              placeholder="Contoh: Ruang Karsa, Jl. Merdeka No. 21"
              className="form-control"
              value={formData.lokasi}
              onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
            />
            {formErrors.lokasi && <div className="error-text">{formErrors.lokasi}</div>}
            <div className="helper-text">Maksimal 100 karakter</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label htmlFor="ev-harga">Harga Tiket (Rp) *</label>
              <input
                id="ev-harga"
                type="number"
                min="0"
                step="1"
                placeholder="75000"
                className="form-control"
                value={formData.harga_tiket}
                onChange={(e) => setFormData({ ...formData, harga_tiket: e.target.value })}
              />
              {formErrors.harga_tiket && <div className="error-text">{formErrors.harga_tiket}</div>}
              <div className="helper-text">0 untuk acara gratis</div>
            </div>

            <div className="form-group">
              <label htmlFor="ev-kuota">Kuota Kursi *</label>
              <input
                id="ev-kuota"
                type="number"
                min="1"
                max="500"
                step="1"
                placeholder="30"
                className="form-control"
                value={formData.kuota}
                onChange={(e) => setFormData({ ...formData, kuota: e.target.value })}
              />
              {formErrors.kuota && <div className="error-text">{formErrors.kuota}</div>}
              <div className="helper-text">Antara 1 sampai 500</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              id="btn-submit-event"
            >
              {submitting ? 'Menyimpan...' : editingEvent ? 'Perbarui Event' : 'Simpan Event'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Dialog Konfirmasi Hapus Event */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Konfirmasi Hapus Event"
        message={`Apakah Anda yakin ingin menghapus event "${deleteTarget?.nama}"? Tindakan ini akan menghapus data event secara permanen.`}
        confirmLabel="Hapus Event"
        confirmVariant="danger"
        isLoading={submitting}
      />
    </div>
  );
}
