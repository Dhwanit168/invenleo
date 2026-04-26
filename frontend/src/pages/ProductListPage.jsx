import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Pencil, Trash2, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { productService } from '../services/productService'
import { useAuth } from '../context/AuthContext'
import useDebounce from '../hooks/useDebounce'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'
import ConfirmModal from '../components/ConfirmModal'

const stockBadge = (p) => {
  if (p.totalQty === 0)    return <Badge label="Out of stock" variant="error" dot />
  if (p.hasLowStock)       return <Badge label="Low stock"    variant="warning" dot />
  return                          <Badge label="In stock"     variant="success" dot />
}

export default function ProductListPage() {
  const { isAdminOrManager } = useAuth()
  const navigate = useNavigate()

  const [products, setProducts] = useState([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const debouncedSearch = useDebounce(search, 500)

  const fetchProducts = async (q = '') => {
    setLoading(true)
    try {
      const { data } = await productService.getAll({ search: q, limit: 100 })
      setProducts(data.products)
      setTotal(data.total)
    } catch {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    fetchProducts(debouncedSearch) 
  }, [debouncedSearch])

  const handleSearch = (e) => {
    setSearch(e.target.value)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await productService.delete(deleteId)
      toast.success('Product deleted')
      setDeleteId(null)
      fetchProducts(search)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    { key: 'name', label: 'Product' },
    { key: 'category', label: 'Category' },
    { key: 'basePrice', label: 'Base Price', render: r => `₹${Number(r.basePrice).toLocaleString('en-IN')}` },
    { key: 'totalQty', label: 'Stock', render: r => r.totalQty ?? 0 },
    { key: 'status', label: 'Status', sortable: false, render: stockBadge },
    {
      key: 'actions', label: '', sortable: false,
      render: (row) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/products/${row._id}`}
            className="p-1.5 rounded-lg hover:bg-surface text-text-secondary hover:text-text-primary transition-colors"
            title="View"
          >
            <Eye size={14} />
          </Link>
          {isAdminOrManager && (
            <>
              <Link
                to={`/products/${row._id}/edit`}
                className="p-1.5 rounded-lg hover:bg-brand-orange-light text-text-secondary hover:text-brand-orange transition-colors"
                title="Edit"
              >
                <Pencil size={14} />
              </Link>
              <button
                onClick={() => setDeleteId(row._id)}
                className="p-1.5 rounded-lg hover:bg-error-bg text-text-secondary hover:text-error-text transition-colors"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      )
    },
  ]

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${total} active product${total !== 1 ? 's' : ''}`}
        action={
          isAdminOrManager && (
            <Link to="/products/new" className="btn-primary flex items-center gap-2">
              <Plus size={15} /> Add product
            </Link>
          )
        }
      />

      {}
      <div className="mb-4">
        <div className="relative w-full sm:max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={handleSearch}
            placeholder="Search products…"
            className="input-base pl-9"
          />
        </div>
      </div>

      <DataTable columns={columns} data={products} loading={loading} emptyMsg="No products found" />

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete product?"
        message="This will soft-delete the product and all its variants. You cannot undo this."
      />
    </div>
  )
}
