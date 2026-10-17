import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div className="toast-container">
      <div className={`toast ${isError ? 'toast-error' : 'toast-success'}`}>
        {isError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
