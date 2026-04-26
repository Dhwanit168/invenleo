import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { saleService } from '../services/saleService'
import { invoiceService } from '../services/invoiceService'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const statusVariant = (s) => {
  if (s === 'completed') return 'success'
  if (s === 'pending')   return 'warning'
  if (s === 'cancelled') return 'error'
  return 'default'
}

export default function SaleDetailPage() {
  const { id } = useParams()
  const [sale, setSale]     = useState(null)
  const [loading, setLoading] = useState(true)

const [downloading, setDownloading] = useState(false)

  const handleDownloadInvoice = async () => {
    if (!sale) return
    setDownloading(true)
    try {
      await invoiceService.downloadSaleInvoice(sale._id, sale.saleNumber)
      toast.success('Invoice downloaded!')
    } catch {
      toast.error('Failed to generate invoice')
    } finally {
      setDownloading(false)
    }
  }

useEffect(() => {
    saleService.getById(id)
      .then(({ data }) => setSale(data))
      .catch(() => toast.error('Sale not found'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="space-y-4">
      {[1,2].map(i => <div key={i} className="h-24 card animate-pulse" />)}
    </div>
  )
  if (!sale) return null

  return (
    <div>
      <div className="mb-4">
        <Link to="/sales" className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand-orange no-underline">
          <ArrowLeft size={14} /> Back to sales
        </Link>
      </div>

      <PageHeader
        title={`Sale ${sale.saleNumber}`}
        subtitle={new Date(sale.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}
        action={
          <button
            onClick={handleDownloadInvoice}
            disabled={downloading}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Download size={16} />
            {downloading ? 'Generating…' : 'Download Invoice'}
          </button>
        }
      />

      {}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Customer</p>
          <p className="text-sm font-semibold text-text-primary">{sale.customer}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Payment</p>
          <p className="text-sm font-semibold text-text-primary capitalize">{sale.paymentMethod?.replace('_', ' ')}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Status</p>
          <Badge label={sale.status} variant={statusVariant(sale.status)} dot />
        </div>
        <div className="card p-4">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Total</p>
          <p className="font-display text-lg font-bold text-brand-orange">{fmt(sale.totalAmount)}</p>
        </div>
      </div>

      {sale.notes && (
        <div className="card p-4 mb-6">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Notes</p>
          <p className="text-sm text-text-secondary">{sale.notes}</p>
        </div>
      )}

      {}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-bold text-text-primary">Items ({sale.items?.length})</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-surface border-b border-border">
                {['Product', 'SKU', 'Variant', 'Qty', 'Unit Price', 'Total'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sale.items?.map((item, i) => (
                <tr key={i} className="hover:bg-surface/60">
                  <td className="px-4 py-3 font-medium">{item.product?.name || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">{item.variant?.sku}</td>
                  <td className="px-4 py-3 text-text-secondary">{[item.variant?.color, item.variant?.size].filter(Boolean).join(' / ') || '—'}</td>
                  <td className="px-4 py-3 font-semibold">{item.quantity}</td>
                  <td className="px-4 py-3">{fmt(item.unitPrice)}</td>
                  <td className="px-4 py-3 font-bold text-brand-orange">{fmt(item.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-surface border-t border-border">
                <td colSpan={5} className="px-4 py-3 text-right text-sm font-bold text-text-primary">Grand Total</td>
                <td className="px-4 py-3 font-display font-bold text-brand-orange text-base">{fmt(sale.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
