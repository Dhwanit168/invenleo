import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { purchaseService } from '../services/purchaseService'
import { invoiceService } from '../services/invoiceService'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const statusVariant = (s) => {
  if (s === 'received')  return 'success'
  if (s === 'pending')   return 'warning'
  if (s === 'cancelled') return 'error'
  return 'default'
}

export default function PurchaseDetailPage() {
  const { id } = useParams()
  const [purchase, setPurchase] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [downloading, setDownloading] = useState(false)

  const handleDownloadPO = async () => {
    if (!purchase) return
    setDownloading(true)
    try {
      await invoiceService.downloadPurchaseInvoice(purchase._id, purchase.purchaseNumber)
      toast.success('Purchase order downloaded!')
    } catch {
      toast.error('Failed to generate purchase order PDF')
    } finally {
      setDownloading(false)
    }
  }

  useEffect(() => {
    purchaseService.getById(id)
      .then(({ data }) => setPurchase(data))
      .catch(() => toast.error('Purchase not found'))
      .finally(() => setLoading(false))
  }, [id])

  const handleMarkReceived = async () => {
    try {
      setLoading(true)
      const { data } = await purchaseService.updateStatus(id, 'received')
      setPurchase(data)
      toast.success('Purchase marked as received. Stock updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !purchase) return (
    <div className="space-y-4">
      {[1, 2].map(i => <div key={i} className="h-24 card animate-pulse" />)}
    </div>
  )
  if (!purchase) return null

  return (
    <div>
      <div className="mb-4">
        <Link to="/purchases" className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand-orange no-underline">
          <ArrowLeft size={14} /> Back to purchases
        </Link>
      </div>

      <PageHeader
        title={`Purchase ${purchase.purchaseNumber}`}
        subtitle={new Date(purchase.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}
        action={
          <div className="flex items-center gap-2">
            {purchase.status === 'pending' && (
              <button onClick={handleMarkReceived} disabled={loading} className="btn-primary flex items-center gap-2 text-sm">
                <CheckCircle size={16} /> Mark as Received
              </button>
            )}
            <button
              onClick={handleDownloadPO}
              disabled={downloading}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Download size={16} />
              {downloading ? 'Generating…' : 'Download PO'}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Supplier</p>
          <p className="text-sm font-semibold text-text-primary">{purchase.supplier?.name || '—'}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Invoice #</p>
          <p className="text-sm font-semibold text-text-primary">{purchase.invoiceNumber || '—'}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Status</p>
          <Badge label={purchase.status} variant={statusVariant(purchase.status)} dot />
        </div>
        <div className="card p-4">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Total</p>
          <p className="font-display text-lg font-bold text-text-primary">{fmt(purchase.totalAmount)}</p>
        </div>
      </div>

      {purchase.notes && (
        <div className="card p-4 mb-6">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Notes</p>
          <p className="text-sm text-text-secondary">{purchase.notes}</p>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-bold text-text-primary">Items ({purchase.items?.length})</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-surface border-b border-border">
                {['Product', 'SKU', 'Variant', 'Qty', 'Unit Cost', 'Total'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {purchase.items?.map((item, i) => (
                <tr key={i} className="hover:bg-surface/60">
                  <td className="px-4 py-3 font-medium">{item.product?.name || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">{item.variant?.sku}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {[item.variant?.color, item.variant?.size].filter(Boolean).join(' / ') || '—'}
                  </td>
                  <td className="px-4 py-3 font-semibold">{item.quantity}</td>
                  <td className="px-4 py-3">{fmt(item.unitCost)}</td>
                  <td className="px-4 py-3 font-bold">{fmt(item.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-surface border-t border-border">
                <td colSpan={5} className="px-4 py-3 text-right text-sm font-bold text-text-primary">Grand Total</td>
                <td className="px-4 py-3 font-display font-bold text-text-primary text-base">{fmt(purchase.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {purchase.createdBy && (
        <p className="text-xs text-text-muted mt-4">
          Created by <span className="font-medium">{purchase.createdBy.username}</span>
        </p>
      )}
    </div>
  )
}
