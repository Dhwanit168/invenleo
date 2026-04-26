import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Pencil, Trash2, ArrowLeft, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { productService } from '../services/productService'
import { variantService } from '../services/variantService'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import ConfirmModal from '../components/ConfirmModal'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdminOrManager, isAdmin } = useAuth()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    productService.getById(id)
      .then(({ data }) => setProduct(data))
      .catch(() => { toast.error('Product not found'); navigate('/products') })
      .finally(() => setLoading(false))
  }, [id])

  const handleDeleteVariant = async () => {
    setDeleting(true)
    try {
      await variantService.delete(deleteId)
      toast.success('Variant deleted')
      setDeleteId(null)
      const { data } = await productService.getById(id)
      setProduct(data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return (
    <div className="space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-16 card animate-pulse" />)}
    </div>
  )
  if (!product) return null

  const totalQty = product.variants?.reduce((s, v) => s + v.quantity, 0) ?? 0

  return (
    <div>
      <div className="mb-4">
        <Link to="/products" className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand-orange transition-colors no-underline">
          <ArrowLeft size={14} /> Back to products
        </Link>
      </div>

      <PageHeader
        title={product.name}
        subtitle={product.category}
        action={
          isAdminOrManager && (
            <Link to={`/products/${id}/edit`} className="btn-primary flex items-center gap-2">
              <Pencil size={14} /> Edit product
            </Link>
          )
        }
      />

      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Base Price</p>
          <p className="font-display text-2xl font-bold text-text-primary">{fmt(product.basePrice)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Base Cost</p>
          <p className="font-display text-2xl font-bold text-text-primary">{fmt(product.baseCostPrice)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Total Stock</p>
          <p className="font-display text-2xl font-bold text-text-primary">{totalQty} units</p>
        </div>
      </div>

      {product.description && (
        <div className="card p-5 mb-6">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Description</p>
          <p className="text-sm text-text-secondary">{product.description}</p>
        </div>
      )}

      {product.supplier && (
        <div className="card p-5 mb-6">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Supplier</p>
          <p className="text-sm font-semibold text-text-primary">{product.supplier.name}</p>
          {product.supplier.email && <p className="text-xs text-text-muted">{product.supplier.email}</p>}
        </div>
      )}

      {}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <p className="text-sm font-bold text-text-primary">Variants ({product.variants?.length || 0})</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-surface border-b border-border">
                {['SKU', 'Color', 'Size', 'Price', 'Cost', 'Stock', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {product.variants?.map(v => (
                <tr key={v._id} className="hover:bg-surface/60">
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">{v.sku}</td>
                  <td className="px-4 py-3">{v.color || '—'}</td>
                  <td className="px-4 py-3">{v.size || '—'}</td>
                  <td className="px-4 py-3">{v.price ? fmt(v.price) : <span className="text-text-muted text-xs">Base</span>}</td>
                  <td className="px-4 py-3">{fmt(v.costPrice)}</td>
                  <td className="px-4 py-3 font-semibold">{v.quantity}</td>
                  <td className="px-4 py-3">
                    {v.quantity === 0
                      ? <Badge label="Out of stock" variant="error" dot />
                      : v.quantity <= v.lowStockThreshold
                        ? <Badge label="Low stock" variant="warning" dot />
                        : <Badge label="In stock" variant="success" dot />
                    }
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin && (
                      <button
                        onClick={() => setDeleteId(v._id)}
                        className="p-1.5 rounded-lg hover:bg-error-bg text-text-secondary hover:text-error-text transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!product.variants?.length && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-text-muted text-sm">No variants</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteVariant}
        loading={deleting}
        title="Delete variant?"
        message="This will permanently delete this variant."
      />
    </div>
  )
}
