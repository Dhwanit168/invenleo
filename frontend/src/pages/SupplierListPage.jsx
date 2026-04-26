import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Pencil, Trash2, Phone, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { supplierService } from '../services/supplierService'
import { useAuth } from '../context/AuthContext'
import useDebounce from '../hooks/useDebounce'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import ConfirmModal from '../components/ConfirmModal'

export default function SupplierListPage() {
  const { isAdminOrManager, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [suppliers, setSuppliers] = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [deleteId, setDeleteId]   = useState(null)
  const [deleting, setDeleting]   = useState(false)
  
  const debouncedSearch = useDebounce(search, 500)

  const fetchSuppliers = async (q = '') => {
    setLoading(true)
    try {
      const { data } = await supplierService.getAll({ search: q, limit: 200 })
      setSuppliers(data.suppliers)
      setTotal(data.total)
    } catch {
      toast.error('Failed to load suppliers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    fetchSuppliers(debouncedSearch) 
  }, [debouncedSearch])

  const handleSearch = (e) => {
    setSearch(e.target.value)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await supplierService.delete(deleteId)
      toast.success('Supplier deleted')
      setDeleteId(null)
      fetchSuppliers(search)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    { key: 'name', label: 'Supplier' },
    { key: 'contactPerson', label: 'Contact Person', render: r => r.contactPerson || '—' },
    {
      key: 'email', label: 'Email', sortable: false,
      render: r => r.email
        ? <a href={`mailto:${r.email}`} className="flex items-center gap-1 text-brand-blue hover:underline text-xs no-underline"><Mail size={12} />{r.email}</a>
        : '—'
    },
    {
      key: 'phone', label: 'Phone', sortable: false,
      render: r => r.phone
        ? <span className="flex items-center gap-1 text-xs"><Phone size={12} className="text-text-muted" />{r.phone}</span>
        : '—'
    },
    {
      key: 'actions', label: '', sortable: false,
      render: row => (
        <div className="flex items-center gap-2">
          {isAdminOrManager && (
            <Link
              to={`/suppliers/${row._id}/edit`}
              className="p-1.5 rounded-lg hover:bg-brand-orange-light text-text-secondary hover:text-brand-orange transition-colors"
              title="Edit"
            >
              <Pencil size={14} />
            </Link>
          )}
          {isAdmin && (
            <button
              onClick={() => setDeleteId(row._id)}
              className="p-1.5 rounded-lg hover:bg-error-bg text-text-secondary hover:text-error-text transition-colors"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )
    },
  ]

  return (
    <div>
      <PageHeader
        title="Suppliers"
        subtitle={`${total} active supplier${total !== 1 ? 's' : ''}`}
        action={
          isAdminOrManager && (
            <Link to="/suppliers/new" className="btn-primary flex items-center gap-2">
              <Plus size={15} /> Add supplier
            </Link>
          )
        }
      />

      <div className="mb-4">
        <div className="relative w-full sm:max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={handleSearch}
            placeholder="Search suppliers…"
            className="input-base pl-9"
          />
        </div>
      </div>

      <DataTable columns={columns} data={suppliers} loading={loading} emptyMsg="No suppliers found" />

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete supplier?"
        message="This will deactivate the supplier. Associated products will not be affected."
      />
    </div>
  )
}
