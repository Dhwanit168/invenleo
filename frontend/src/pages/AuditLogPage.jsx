import { useEffect, useState } from 'react'
import { Search, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import useDebounce from '../hooks/useDebounce'
import { auditService } from '../services/auditService'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'
import { CustomDropdown } from '../components/FormComponents'

const ACTION_VARIANT = {
  PRODUCT_CREATE: 'success',
  PRODUCT_UPDATE: 'info',
  PRODUCT_DELETE: 'error',
  SALE_CREATE: 'success',
  PURCHASE_CREATE: 'success',
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actions, setActions] = useState([])
  const [filters, setFilters] = useState({ action: '', user: '', startDate: '', endDate: '' })

  const debouncedFilters = useDebounce(filters, 500)

  const fetchLogs = async (f = filters) => {
    setLoading(true)
    try {
      const params = { limit: 100 }
      if (f.action) params.action = f.action
      if (f.user) params.user = f.user
      if (f.startDate) params.startDate = f.startDate
      if (f.endDate) params.endDate = f.endDate
      const { data } = await auditService.getLogs(params)
      setLogs(data.logs)
      setTotal(data.total)
    } catch {
      toast.error('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs(debouncedFilters)
  }, [debouncedFilters])

  useEffect(() => {
    auditService.getActions().then(({ data }) => setActions(data)).catch(() => { })
  }, [])

  const handleFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const columns = [
    {
      key: 'action', label: 'Action',
      render: r => <Badge label={r.action} variant={ACTION_VARIANT[r.action] || 'default'} />
    },
    {
      key: 'description', label: 'Description', render: r => (
        <span className="text-sm text-text-secondary">{r.description}</span>
      )
    },
    { key: 'username', label: 'User', render: r => r.user?.username || r.username || '—' },
    { key: 'role', label: 'Role', render: r => r.user?.role || '—' },
    { key: 'createdAt', label: 'Time', render: r => new Date(r.createdAt).toLocaleString('en-IN') },
  ]

  return (
    <div>
      <PageHeader title="Audit Log" subtitle={`${total} event${total !== 1 ? 's' : ''}`} />

      {}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={filters.user}
            onChange={e => handleFilter('user', e.target.value)}
            placeholder="Filter by user…"
            className="input-base pl-8 text-sm py-1.5 w-48"
          />
        </div>

        <div className="w-48">
          <CustomDropdown
            value={filters.action}
            onChange={val => handleFilter('action', val)}
            options={[{ value: '', label: 'All actions' }, ...actions.map(a => ({ value: a, label: a }))]}
            placeholder="All actions"
          />
        </div>

        <input
          type="date"
          value={filters.startDate}
          onChange={e => handleFilter('startDate', e.target.value)}
          className="input-base text-sm py-1.5 w-auto"
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={e => handleFilter('endDate', e.target.value)}
          className="input-base text-sm py-1.5 w-auto"
        />

        {(filters.action || filters.user || filters.startDate || filters.endDate) && (
          <button
            onClick={() => {
              const reset = { action: '', user: '', startDate: '', endDate: '' }
              setFilters(reset)
              fetchLogs(reset)
            }}
            className="text-xs text-text-secondary hover:text-brand-orange transition-colors px-2"
          >
            Clear filters
          </button>
        )}
      </div>

      <DataTable columns={columns} data={logs} loading={loading} emptyMsg="No audit log entries" />
    </div>
  )
}
