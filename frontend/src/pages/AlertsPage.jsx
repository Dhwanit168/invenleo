import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { productService } from '../services/productService'
import { variantService } from '../services/variantService'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'

export default function AlertsPage() {
  const [variants, setVariants] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {

    variantService.getAll({ limit: 500 })
      .then(({ data }) => {
        const all = Array.isArray(data) ? data : data.variants || []

        const low = all.filter(v => v.quantity <= v.lowStockThreshold && v.isActive !== false)
        setVariants(low)
      })
      .catch(() => toast.error('Failed to load alerts'))
      .finally(() => setLoading(false))
  }, [])

  const outOfStock = variants.filter(v => v.quantity === 0)
  const lowStock   = variants.filter(v => v.quantity > 0)

  const VariantCard = ({ v }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-xl hover:border-border-hover transition-colors bg-white gap-4">
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${v.quantity === 0 ? 'bg-error-bg' : 'bg-amber-50'}`}>
          <AlertTriangle size={16} className={v.quantity === 0 ? 'text-error-text' : 'text-amber-600'} />
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">{v.product?.name || 'Unknown Product'}</p>
          <p className="text-xs text-text-muted font-mono">{v.sku}</p>
          {(v.color || v.size) && (
            <p className="text-xs text-text-secondary mt-0.5">{[v.color, v.size].filter(Boolean).join(' / ')}</p>
          )}
        </div>
      </div>
      <div className="text-left sm:text-right">
        <Badge
          label={v.quantity === 0 ? 'Out of stock' : `${v.quantity} left`}
          variant={v.quantity === 0 ? 'error' : 'warning'}
          dot
        />
        <p className="text-[10px] text-text-muted mt-1">Threshold: {v.lowStockThreshold}</p>
      </div>
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Stock Alerts"
        subtitle={`${variants.length} item${variants.length !== 1 ? 's' : ''} need attention`}
        action={
          <Link to="/products" className="btn-ghost flex items-center gap-2 text-sm">
            <Package size={14} /> View products
          </Link>
        }
      />

      {loading && (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 card animate-pulse" />)}
        </div>
      )}

      {!loading && variants.length === 0 && (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-success-bg flex items-center justify-center mx-auto mb-4">
            <Package size={28} className="text-success-dot" />
          </div>
          <p className="text-lg font-bold text-text-primary mb-1">All stock levels look good!</p>
          <p className="text-sm text-text-secondary">No low stock or out-of-stock items at the moment.</p>
        </div>
      )}

      {!loading && outOfStock.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-error-text" />
            <p className="text-sm font-bold text-text-primary">Out of Stock ({outOfStock.length})</p>
          </div>
          <div className="space-y-2">
            {outOfStock.map(v => <VariantCard key={v._id} v={v} />)}
          </div>
        </div>
      )}

      {!loading && lowStock.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <p className="text-sm font-bold text-text-primary">Low Stock ({lowStock.length})</p>
          </div>
          <div className="space-y-2">
            {lowStock.map(v => <VariantCard key={v._id} v={v} />)}
          </div>
        </div>
      )}
    </div>
  )
}
