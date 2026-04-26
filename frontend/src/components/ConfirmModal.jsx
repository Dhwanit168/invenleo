import { AlertTriangle, X } from 'lucide-react'

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  loading = false,
  confirmLabel = 'Delete',
  variant = 'danger',
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-border max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        {}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-surface text-text-muted transition-colors"
        >
          <X size={16} />
        </button>

        {}
        <div className="w-12 h-12 rounded-2xl bg-error-bg flex items-center justify-center mb-4">
          <AlertTriangle size={22} className="text-error-text" />
        </div>

        <h2 className="font-display text-lg font-bold text-text-primary mb-1">{title}</h2>
        <p className="text-sm text-text-secondary mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 btn-ghost"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-error-text hover:opacity-90 text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition-opacity cursor-pointer disabled:opacity-60"
          >
            {loading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
