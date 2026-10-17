import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorState({
  title = "Terjadi Kesalahan",
  message = "Gagal memuat data dari server. Periksa koneksi internet Anda.",
  onRetry
}) {
  return (
    <div className="error-state" id="error-state-view">
      <div className="error-icon">
        <AlertCircle size={32} />
      </div>
      <h2 className="error-title">{title}</h2>
      <p className="error-desc">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary" id="btn-coba-lagi">
          <RefreshCw size={16} />
          <span>Coba Lagi</span>
        </button>
      )}
    </div>
  );
}
