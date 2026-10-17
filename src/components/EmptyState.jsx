import React from 'react';
import { Plus } from 'lucide-react';

export default function EmptyState({
  icon: Icon,
  title = "Belum Ada Data",
  description = "Mulai tambahkan data pertama Anda ke dalam sistem.",
  actionLabel,
  onAction,
  id
}) {
  return (
    <div className="empty-state" id={id || "empty-state-view"}>
      {Icon && (
        <div className="empty-icon">
          <Icon size={32} />
        </div>
      )}
      <h2 className="empty-title">{title}</h2>
      <p className="empty-desc">{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn btn-primary" id="btn-empty-action">
          <Plus size={16} />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
