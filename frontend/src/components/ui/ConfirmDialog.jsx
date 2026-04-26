import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = 'Xác nhận', danger = false }) {
  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-sm">
      <div className="text-center space-y-4">
        <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
          danger ? 'bg-neon-red/10 text-neon-red' : 'bg-neon-amber/10 text-neon-amber'
        }`}>
          <AlertTriangle size={28} />
        </div>
        <h3 className="text-lg font-bold text-white">{title || 'Xác nhận'}</h3>
        {message && <p className="text-sm text-slate-400">{message}</p>}
        <div className="flex gap-3 justify-center pt-2">
          <button onClick={onClose} className="btn-ghost">Hủy</button>
          <button onClick={() => { onConfirm(); onClose(); }} className={danger ? 'btn-danger' : 'btn-primary'}>
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
