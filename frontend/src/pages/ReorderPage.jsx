import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingCart, RefreshCw, Check, X, Clock,
  Building2, Package, ChevronDown, AlertTriangle,
  Inbox, Filter
} from 'lucide-react'
import toast from 'react-hot-toast'
import { reorderService } from '../services/reorderService'
import ReorderConfirmModal from '../components/ReorderConfirmModal'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'

const STATUS_TABS = [
  { key: 'pending',   label: 'Pending',   color: 'warning' },
  { key: 'approved',  label: 'Approved',  color: 'success' },
  { key: 'cancelled', label: 'Cancelled', color: 'error'   },
  { key: 'all',       label: 'All',       color: 'default' },
]

const statusBadge = (status) => {
  const map = {
    pending:   { label: 'Pending',   variant: 'warning' },
    approved:  { label: 'Approved',  variant: 'success' },
    cancelled: { label: 'Cancelled', variant: 'error'   },
    dismissed: { label: 'Dismissed', variant: 'default' },
  }
  const b = map[status] || { label: status, variant: 'default' }
  return <Badge label={b.label} variant={b.variant} dot />
}

export default function ReorderPage() {
  const [suggestions,     setSuggestions]     = useState([])
  const [loading,         setLoading]         = useState(true)
  const [scanning,        setScanning]        = useState(false)
  const [activeTab,       setActiveTab]       = useState('pending')
  const [modalSuggestion, setModalSuggestion] = useState(null)
  const [expanded,        setExpanded]        = useState(null)

  const fetchSuggestions = useCallback(async (status = activeTab) => {
    setLoading(true)
    try {
      const { data } = await reorderService.getSuggestions({ status, limit: 100 })
      setSuggestions(data.suggestions || [])
    } catch {
      toast.error('Failed to load reorder suggestions')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => { fetchSuggestions(activeTab) }, [activeTab])

  const handleScanNow = async () => {
    setScanning(true)
    try {
      const { data } = await reorderService.checkStock()
      toast.success(data.message || 'Stock scan complete')
      fetchSuggestions(activeTab)
    } catch {
      toast.error('Stock scan failed')
    } finally {
      setScanning(false)
    }
  }

  const handleApprove = async (id, quantity, notes) => {
    try {
      const { data } = await reorderService.approve(id, quantity, notes)
      toast.success(`Purchase Order ${data.purchase?.purchaseNumber} created!`)
      setModalSuggestion(null)
      fetchSuggestions(activeTab)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to approve reorder')
      throw err
    }
  }

  const handleCancel = async (id) => {
    try {
      await reorderService.cancel(id)
      toast.success('Reorder suggestion dismissed')
      setModalSuggestion(null)
      fetchSuggestions(activeTab)
    } catch {
      toast.error('Failed to cancel suggestion')
    }
  }

  const pendingCount = suggestions.filter(s => s.status === 'pending').length

  return (
    <div>
      <PageHeader
        title="Auto Reorder"
        subtitle="Smart reorder suggestions based on stock thresholds"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleScanNow}
              disabled={scanning}
              className="btn-ghost flex items-center gap-2 text-sm"
            >
              <RefreshCw size={14} className={scanning ? 'animate-spin' : ''} />
              {scanning ? 'Scanning…' : 'Scan Now'}
            </button>
            <Link to="/purchases/new" className="btn-primary flex items-center gap-2 text-sm">
              <ShoppingCart size={14} /> New Purchase
            </Link>
          </div>
        }
      />

      <div className="flex items-center gap-1 mb-5 border-b border-border">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? 'border-brand-orange text-brand-orange'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
            {tab.key === 'pending' && pendingCount > 0 && (
              <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 card animate-pulse" />)}
        </div>
      ) : suggestions.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-4">
            <Inbox size={24} className="text-text-muted" />
          </div>
          <p className="text-base font-bold text-text-primary mb-1">
            {activeTab === 'pending' ? 'No pending reorder suggestions' : 'No suggestions found'}
          </p>
          <p className="text-sm text-text-secondary mb-4">
            {activeTab === 'pending'
              ? 'All stock levels are above threshold, or click "Scan Now" to check.'
              : 'Try a different status filter.'}
          </p>
          {activeTab === 'pending' && (
            <button onClick={handleScanNow} disabled={scanning} className="btn-ghost text-sm mx-auto flex items-center gap-2">
              <RefreshCw size={13} className={scanning ? 'animate-spin' : ''} />
              Scan Stock Now
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {suggestions.map(s => {
            const product  = s.product  || {}
            const variant  = s.variant  || {}
            const supplier = s.supplier || {}
            const varLabel = [variant.color, variant.size].filter(Boolean).join(' / ')
            const isOpen   = expanded === s._id

            return (
              <div key={s._id} className="card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    s.status === 'pending'   ? 'bg-amber-50' :
                    s.status === 'approved'  ? 'bg-success-bg' : 'bg-surface'
                  }`}>
                    {s.status === 'pending'  && <AlertTriangle size={16} className="text-amber-500" />}
                    {s.status === 'approved' && <Check size={16} className="text-success-dot" />}
                    {s.status === 'cancelled'&& <X size={16} className="text-text-muted" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-text-primary">{product.name || '—'}</span>
                      {varLabel && <span className="text-xs text-text-muted">({varLabel})</span>}
                      {statusBadge(s.status)}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-text-muted font-mono">{variant.sku || '—'}</span>
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <Building2 size={10} /> {supplier.name || '—'}
                      </span>
                      <span className={`text-xs font-medium ${
                        s.currentStock === 0 ? 'text-error-text' : 'text-amber-600'
                      }`}>
                        Stock: {s.currentStock} / {s.threshold}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-text-muted">Qty</p>
                      <p className="text-sm font-bold text-text-primary">
                        {s.approvedQuantity || s.suggestedQuantity}
                      </p>
                    </div>

                    {s.status === 'pending' && (
                      <button
                        onClick={() => setModalSuggestion(s)}
                        className="bg-brand-orange hover:opacity-90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity flex items-center gap-1.5 cursor-pointer"
                      >
                        <ShoppingCart size={12} /> Review
                      </button>
                    )}

                    {s.purchaseOrder && (
                      <Link
                        to={`/purchases/${s.purchaseOrder._id}`}
                        className="text-xs text-brand-orange font-medium hover:underline"
                      >
                        {s.purchaseOrder.purchaseNumber}
                      </Link>
                    )}

                    <button
                      onClick={() => setExpanded(isOpen ? null : s._id)}
                      className="p-1.5 rounded-lg hover:bg-surface text-text-muted transition-colors"
                    >
                      <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-border bg-surface px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-text-muted mb-0.5">Product</p>
                      <p className="font-medium text-text-primary">{product.name}</p>
                    </div>
                    <div>
                      <p className="text-text-muted mb-0.5">Supplier</p>
                      <p className="font-medium text-text-primary">{supplier.name}</p>
                      {supplier.email && <p className="text-text-muted">{supplier.email}</p>}
                      {supplier.phone && <p className="text-text-muted">{supplier.phone}</p>}
                    </div>
                    <div>
                      <p className="text-text-muted mb-0.5">Suggested Qty</p>
                      <p className="font-medium text-text-primary">{s.suggestedQuantity}</p>
                      {s.approvedQuantity && s.approvedQuantity !== s.suggestedQuantity && (
                        <p className="text-brand-orange">Approved: {s.approvedQuantity}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-text-muted mb-0.5">Triggered</p>
                      <p className="font-medium text-text-primary">
                        {new Date(s.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                      </p>
                      {s.resolvedAt && (
                        <p className="text-text-muted">
                          Resolved: {new Date(s.resolvedAt).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                        </p>
                      )}
                    </div>
                    {s.notes && (
                      <div className="col-span-2 sm:col-span-4">
                        <p className="text-text-muted mb-0.5">Notes</p>
                        <p className="text-text-primary">{s.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ReorderConfirmModal
        open={!!modalSuggestion}
        suggestion={modalSuggestion}
        onApprove={handleApprove}
        onCancel={handleCancel}
        onClose={() => setModalSuggestion(null)}
      />
    </div>
  )
}
