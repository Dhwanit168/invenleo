import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import useDebounce from '../hooks/useDebounce'
import { saleService } from '../services/saleService'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const statusVariant = (s) => {
  if (s === 'completed') return 'success'
  if (s === 'pending')   return 'warning'
  if (s === 'cancelled') return 'error'
  return 'default'
}

export default function SaleListPage() {
  const [sales, setSales]   = useState([])
  const [total, setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  const debouncedSearch = useDebounce(search, 500)

  const fetchSales = async () => {
    setLoading(true)
    try {
      const { data } = await saleService.getAll({ limit: 100 })
      setSales(data.sales)
      setTotal(data.total)
    } catch {
      toast.error('Failed to load sales')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSales() }, [])

  const filtered = sales.filter(s =>
    s.saleNumber?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    s.customer?.toLowerCase().includes(debouncedSearch.toLowerCase())
  )

  const columns = [
    { key: 'saleNumber', label: 'Sale #' },
    { key: 'customer', label: 'Customer' },
    { key: 'totalAmount', label: 'Amount',   render: r => fmt(r.totalAmount) },
    { key: 'paymentMethod', label: 'Payment', render: r => r.paymentMethod?.replace('_', ' ') },
    { key: 'status',  label: 'Status', render: r => <Badge label={r.status} variant={statusVariant(r.status)} dot /> },
    { key: 'createdAt', label: 'Date', render: r => new Date(r.createdAt).toLocaleDateString('en-IN') },
    {
      key: 'actions', label: '', sortable: false,
      render: r => (
        <Link to={`/sales/${r._id}`} className="p-1.5 rounded-lg hover:bg-surface text-text-secondary hover:text-text-primary transition-colors inline-flex">
          <Eye size={14} />
        </Link>
      )
    },
  ]

  return (
    <div>
      <PageHeader
        title="Sales"
        subtitle={`${total} total sale${total !== 1 ? 's' : ''}`}
        action={
          <Link to="/sales/new" className="btn-primary flex items-center gap-2">
            <Plus size={15} /> New sale
          </Link>
        }
      />

      <div className="mb-4">
        <div className="relative w-full sm:max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search sale or customer…"
            className="input-base pl-9"
          />
        </div>
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} emptyMsg="No sales found" />
    </div>
  )
}
