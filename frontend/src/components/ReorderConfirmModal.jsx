import { useState } from 'react'
import {
  ShoppingCart, X, Building2, Package,
  AlertTriangle, Edit3, Check
} from 'lucide-react'

export default function ReorderConfirmModal({
  open,
  suggestion,
  onApprove,
  onCancel,
  onClose,
}) {
  const [editingQty, setEditingQty] = useState(false)
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState(null)

  if (!open || !suggestion) return null

  const s = suggestion
  const product = s.product || {}
  const variant = s.variant || {}
  const supplier = s.supplier || {}
  const suggested = s.suggestedQuantity || 50
  const finalQty = editingQty ? Number(quantity) || suggested : suggested

  const variantLabel = [variant.color, variant.size].filter(Boolean).join(' / ')

  const handleApprove = async () => {
    setAction('approve')
    setLoading(true)
    try {
      await onApprove(s._id, finalQty, notes)
    } finally {
      setLoading(false)
      setAction(null)
    }
  }

  const handleCancel = async () => {
    setAction('cancel')
    setLoading(true)
    try {
      await onCancel(s._id)
    } finally {
      setLoading(false)
      setAction(null)
    }
  }

  const stockPct = Math.min(100, Math.round((s.currentStock / (s.threshold || 1)) * 100))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl border border-border w-full max-w-md animate-in fade-in zoom-in-95 duration-150">

        <div className="flex items-start justify-between p-6 pb-4 border-b border-border">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-amber-500" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-text-primary leading-tight">
                Stock Below Threshold
              </h2>
              <p className="text-xs text-text-muted mt-0.5">Reorder suggestion</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface text-text-muted transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">

          <div className="bg-surface rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Package size={14} className="text-text-muted shrink-0" />
              <span className="text-sm font-semibold text-text-primary">{product.name || '—'}</span>
            </div>
            {variantLabel && (
              <p className="text-xs text-text-secondary pl-5">{variantLabel}</p>
            )}
            <p className="text-xs text-text-muted font-mono pl-5">{variant.sku || '—'}</p>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-text-secondary font-medium">Current stock</span>
              <span className={`font-bold ${s.currentStock === 0 ? 'text-error-text' : 'text-amber-600'}`}>
                {s.currentStock} units
                <span className="text-text-muted font-normal"> / threshold {s.threshold}</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${s.currentStock === 0 ? 'bg-error-text' : 'bg-amber-400'
                  }`}
                style={{ width: `${stockPct}%` }}
              />
            </div>
          </div>

          <div className="bg-surface rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 size={14} className="text-text-muted shrink-0" />
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Preferred Supplier</span>
            </div>
            <p className="text-sm font-semibold text-text-primary">{supplier.name || '—'}</p>
            {supplier.contactPerson && (
              <p className="text-xs text-text-secondary mt-0.5">Contact: {supplier.contactPerson}</p>
            )}
            {supplier.email && (
              <p className="text-xs text-text-muted mt-0.5">{supplier.email}</p>
            )}
            {supplier.phone && (
              <p className="text-xs text-text-muted">{supplier.phone}</p>
            )}
          </div>

          <div className="border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Reorder Quantity
              </span>
              <button
                onClick={() => {
                  setEditingQty(!editingQty)
                  if (!editingQty) setQuantity(String(suggested))
                }}
                className="flex items-center gap-1 text-xs text-brand-orange font-medium hover:opacity-70 transition-opacity"
              >
                <Edit3 size={11} />
                {editingQty ? 'Use suggested' : 'Edit'}
              </button>
            </div>

            {editingQty ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  className="w-28 px-3 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                  autoFocus
                />
                <span className="text-xs text-text-muted">units</span>
              </div>
            ) : (
              <p className="text-2xl font-bold text-text-primary">
                {suggested}
                <span className="text-sm text-text-muted font-normal ml-1">units</span>
              </p>
            )}
          </div>

          <textarea
            placeholder="Add a note (optional)…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2.5 text-sm border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand-orange/30 placeholder:text-text-muted"
          />
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 btn-ghost text-sm py-2.5 disabled:opacity-50"
          >
            {loading && action === 'cancel' && (
              <span className="w-3 h-3 border-2 border-text-muted/30 border-t-text-muted rounded-full animate-spin" />
            )}
            Skip
          </button>

          <button
            onClick={handleApprove}
            disabled={loading || (editingQty && (!quantity || Number(quantity) < 1))}
            className="flex-[2] flex items-center justify-center gap-2 bg-brand-orange hover:opacity-90 text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition-opacity disabled:opacity-50 cursor-pointer"
          >
            {loading && action === 'approve' ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ShoppingCart size={15} />
            )}
            Approve Reorder
          </button>
        </div>
      </div>
    </div>
  )
}
