import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Eye, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import useDebounce from '../hooks/useDebounce'
import { purchaseService } from '../services/purchaseService'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const statusVariant = (s) => {
  if (s === 'received') return 'success'
  if (s === 'pending')  return 'warning'
  if (s === 'cancelled') return 'error'
  return 'default'
}

export default function PurchaseListPage() {
  const [purchases, setPurchases] = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')

  const debouncedSearch = useDebounce(search, 500)

  useEffect(() => {
    purchaseService.getAll({ limit: 100 })
      .then(({ data }) => { setPurchases(data.purchases); setTotal(data.total) })
      .catch(() => toast.error('Failed to load purchases'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = purchases.filter(p =>
    p.purchaseNumber?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    p.supplier?.name?.toLowerCase().includes(debouncedSearch.toLowerCase())
  )

  const columns = [
    { key: 'purchaseNumber', label: 'Purchase #' },
    { key: 'supplier', label: 'Supplier', render: r => r.supplier?.name || '—' },
    { key: 'totalAmount', label: 'Amount', render: r => fmt(r.totalAmount) },
    { key: 'status', label: 'Status', render: r => <Badge label={r.status} variant={statusVariant(r.status)} dot /> },
    { key: 'createdAt', label: 'Date', render: r => new Date(r.createdAt).toLocaleDateString('en-IN') },
    {
      key: 'actions', label: '', sortable: false,
      render: r => (
        <Link to={`/purchases/${r._id}`} className="p-1.5 rounded-lg hover:bg-surface text-text-secondary hover:text-text-primary transition-colors inline-flex">
          <Eye size={14} />
        </Link>
      )
    },
  ]

  return (
    <div>
      <PageHeader
        title="Purchases"
        subtitle={`${total} purchase order${total !== 1 ? 's' : ''}`}
        action={
          <Link to="/purchases/new" className="btn-primary flex items-center gap-2">
            <Plus size={15} /> New purchase
          </Link>
        }
      />

      <div className="mb-4">
        <div className="relative w-full sm:max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search purchase or supplier…"
            className="input-base pl-9"
          />
        </div>
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} emptyMsg="No purchases found" />
    </div>
  )
}
