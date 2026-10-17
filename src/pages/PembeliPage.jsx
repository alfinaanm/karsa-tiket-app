import React, { useState, useEffect } from 'react';
import { getPembeli, addPembeli, updatePembeli, deletePembeli } from '../services/dataService';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Users, Phone, Mail, Search, Plus, Edit2, Trash2, UserCheck } from 'lucide-react';

export default function PembeliPage({ showToast }) {
  const [pembeliList, setPembeliList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPembeli, setEditingPembeli] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    nama: '',
    no_whatsapp: '',
    email: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchPembeli = async (query = searchQuery) => {
    try {
      setLoading(true);
      const data = await getPembeli(query);
      setPembeliList(data);
    } catch (err) {
      showToast(err.message || 'Gagal memuat data pembeli', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPembeli(searchQuery);
  }, [searchQuery]);

  const openAddModal = () => {
    setEditingPembeli(null);
    setFormData({
      nama: '',
      no_whatsapp: '',
      email: ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingPembeli(p);
    setFormData({
      nama: p.nama || '',
      no_whatsapp: p.no_whatsapp || p.id || '',
      email: p.email || ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Prefill using schema example
  const prefillSchemaExample = () => {
    setFormData({
      nama: 'Nadia Putri',
      no_whatsapp: '081355512345',
      email: 'nadia.putri@contoh.id'
    });
    setFormErrors({});
  };

  const validate = () => {
    const errors = {};
    if (!formData.nama.trim() || formData.nama.length > 60) {
      errors.nama = 'Nama pembeli wajib diisi (1-60 karakter).';
    }
    const cleanPhone = (formData.no_whatsapp || '').trim();
    if (!editingPembeli) {
      if (!cleanPhone.startsWith('08') || cleanPhone.length < 10 || cleanPhone.length > 13 || !/^\d+$/.test(cleanPhone)) {
        errors.no_whatsapp = 'Nomor WhatsApp harus diawali 08 dan memiliki panjang 10 sampai 13 angka.';
      }
    }
    if (!formData.email || !formData.email.includes('@') || formData.email.length > 80) {
      errors.email = 'Email tidak sah (harus mengandung tanda @ dan maksimal 80 karakter).';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      if (editingPembeli) {
        await updatePembeli(editingPembeli.id, {
          nama: formData.nama,
          email: formData.email
        });
        showToast('Data pembeli berhasil diperbarui!');
      } else {
        await addPembeli(formData);
        showToast('Pembeli baru berhasil disimpan!');
      }
      setIsModalOpen(false);
      await fetchPembeli();
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan data pembeli', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      await deletePembeli(deleteTarget.id);
      showToast(`Data pembeli "${deleteTarget.nama}" berhasil dihapus.`);
      setDeleteTarget(null);
      await fetchPembeli();
    } catch (err) {
      showToast(err.message || 'Gagal menghapus data pembeli', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Data Pembeli / Peserta</h1>
          <p>Kelola data identitas peserta, kontak WhatsApp, dan alamat email.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Cari nama atau nomor WhatsApp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="input-cari-pembeli"
            />
          </div>
          <button onClick={openAddModal} className="btn btn-primary" id="btn-tambah-pembeli">
            <Plus size={18} />
            <span>Tambah Pembeli</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <p>Memuat data pembeli...</p>
        </div>
      ) : pembeliList.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Users size={32} />
          </div>
          <h2 className="empty-title">
            {searchQuery ? 'Pembeli tidak ditemukan' : 'Belum ada pembeli terdaftar'}
          </h2>
          <p className="empty-desc">
            {searchQuery
              ? `Tidak ada pembeli yang cocok dengan kata kunci "${searchQuery}".`
              : 'Daftarkan pembeli pertama saat mereka menghubungi panitia untuk memesan tiket acara.'}
          </p>
          {!searchQuery && (
            <button onClick={openAddModal} className="btn btn-primary">
              <Plus size={16} />
              <span>Tambah Pembeli Baru</span>
            </button>
          )}
        </div>
      ) : (
        <div className="cards-grid">
          {pembeliList.map((p) => (
            <div key={p.id} className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700
                    }}
                  >
                    {p.nama ? p.nama.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h3 className="card-title">{p.nama}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      ID Dokumen: {p.id}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card-body">
                <div className="info-row">
                  <Phone size={16} style={{ color: '#34d399', flexShrink: 0 }} />
                  <a
                    href={`https://wa.me/${p.no_whatsapp ? p.no_whatsapp.replace(/^0/, '62') : ''}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#34d399', textDecoration: 'none', fontWeight: 600 }}
                  >
                    {p.no_whatsapp || p.id}
                  </a>
                </div>
                <div className="info-row">
                  <Mail size={16} style={{ color: '#38bdf8', flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.email}
                  </span>
                </div>
              </div>

              <div className="card-footer">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {p.dibuat_pada ? new Date(p.dibuat_pada).toLocaleDateString('id-ID') : 'Aktif'}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => openEditModal(p)}
                    className="btn btn-secondary btn-sm"
                    title="Ubah Data Pembeli"
                    id={`btn-edit-pembeli-${p.id}`}
                  >
                    <Edit2 size={14} />
                    <span>Ubah</span>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(p)}
                    className="btn btn-danger btn-sm"
                    title="Hapus Pembeli"
                    id={`btn-delete-pembeli-${p.id}`}
                  >
                    <Trash2 size={14} />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah / Ubah Pembeli */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPembeli ? 'Ubah Data Pembeli' : 'Tambah Pembeli Baru'}
      >
        <form onSubmit={handleSubmit}>
          {!editingPembeli && (
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={prefillSchemaExample}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.78rem' }}
              >
                Gunakan Contoh Skema (Nadia Putri)
              </button>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="pb-nama">Nama Lengkap Pembeli *</label>
            <input
              id="pb-nama"
              type="text"
              maxLength={60}
              placeholder="Contoh: Nadia Putri"
              className="form-control"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            />
            {formErrors.nama && <div className="error-text">{formErrors.nama}</div>}
            <div className="helper-text">1 sampai 60 karakter</div>
          </div>

          <div className="form-group">
            <label htmlFor="pb-wa">
              Nomor WhatsApp (ID Dokumen) *
              {editingPembeli && <span style={{ color: 'var(--text-dim)' }}> (Tidak dapat diubah)</span>}
            </label>
            <input
              id="pb-wa"
              type="text"
              placeholder="Contoh: 081355512345"
              className="form-control"
              disabled={Boolean(editingPembeli)}
              value={formData.no_whatsapp}
              onChange={(e) => setFormData({ ...formData, no_whatsapp: e.target.value.replace(/\D/g, '') })}
            />
            {formErrors.no_whatsapp && <div className="error-text">{formErrors.no_whatsapp}</div>}
            <div className="helper-text">Diawali 08, panjang 10 sampai 13 digit angka</div>
          </div>

          <div className="form-group">
            <label htmlFor="pb-email">Alamat Email *</label>
            <input
              id="pb-email"
              type="email"
              maxLength={80}
              placeholder="Contoh: nadia.putri@contoh.id"
              className="form-control"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            {formErrors.email && <div className="error-text">{formErrors.email}</div>}
            <div className="helper-text">Mengandung tanda @ dan maksimal 80 karakter</div>
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
              id="btn-submit-pembeli"
            >
              {submitting ? 'Menyimpan...' : editingPembeli ? 'Perbarui Pembeli' : 'Simpan Pembeli'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Dialog Konfirmasi Hapus Pembeli */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Konfirmasi Hapus Pembeli"
        message={`Apakah Anda yakin ingin menghapus data pembeli "${deleteTarget?.nama}" (${deleteTarget?.no_whatsapp || deleteTarget?.id})? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus Pembeli"
        confirmVariant="danger"
        isLoading={submitting}
      />
    </div>
  );
}
