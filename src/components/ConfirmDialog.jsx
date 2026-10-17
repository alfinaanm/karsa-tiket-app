import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Konfirmasi Aksi",
  message = "Apakah Anda yakin ingin melanjutkan tindakan ini?",
  confirmLabel = "Ya, Lanjutkan",
  confirmVariant = "danger",
  isLoading = false
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: confirmVariant === 'danger' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(99, 102, 241, 0.15)',
            color: confirmVariant === 'danger' ? '#f43f5e' : '#6366f1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <AlertTriangle size={22} />
        </div>
        <div>
          <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: 1.5 }}>
            {message}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button
          type="button"
          onClick={onClose}
          className="btn btn-secondary"
          disabled={isLoading}
        >
          Batal
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`btn ${confirmVariant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
          disabled={isLoading}
        >
          {isLoading ? 'Memproses...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
