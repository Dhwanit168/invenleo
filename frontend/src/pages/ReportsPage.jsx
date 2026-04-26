import { useEffect, useRef, useState } from 'react'
import { reportService } from '../services/reportService'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import toast from 'react-hot-toast'
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const COLORS = ['#C4600A', '#185FA5', '#639922', '#EF9F27', '#A32D2D', '#5A5D6E']

function DateRangeFilter({ start, end, onStart, onEnd, onClear }) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <label className="text-xs font-medium text-text-secondary min-w-[32px]">From</label>
        <input type="date" value={start} onChange={e => onStart(e.target.value)}
          className="input-base text-sm py-1.5 px-3 flex-1 sm:w-auto" />
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <label className="text-xs font-medium text-text-secondary min-w-[32px]">To</label>
        <input type="date" value={end} onChange={e => onEnd(e.target.value)}
          className="input-base text-sm py-1.5 px-3 flex-1 sm:w-auto" />
      </div>
      {(start || end) && (
        <button onClick={onClear} className="text-xs text-text-secondary hover:text-brand-orange transition-colors ml-auto sm:ml-0">
          Clear
        </button>
      )}
    </div>
  )
}

function ExportButton({ tab, startDate, endDate }) {
  const [exporting, setExporting] = useState(false)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const triggerExport = async (filtered) => {
    setOpen(false)
    setExporting(true)
    try {
      const params = {}
      if (filtered && startDate) params.startDate = startDate
      if (filtered && endDate)   params.endDate   = endDate

      let res
      if (tab === 'sales')          res = await reportService.exportSales(params)
      else if (tab === 'purchases') res = await reportService.exportPurchases(params)
      else                          res = await reportService.exportStock(params)

      let filename = ''
      const cd = res.headers?.['content-disposition'] || ''
      const match = cd.match(/filename="?([^"]+)"?/)
      if (match) {
        filename = match[1]
      } else {
        const today = new Date().toISOString().split('T')[0]
        const suffix = filtered && (startDate || endDate) ? '_filtered' : ''
        filename = `${tab}_report${suffix}_${today}.xlsx`
      }

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      toast.success('Report downloaded successfully!')
    } catch (err) {
      console.error('Export error:', err)
      toast.error('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const hasFilter = !!(startDate || endDate)

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-stretch rounded-lg overflow-hidden border border-brand-orange">
        <button
          onClick={() => triggerExport(hasFilter)}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white text-sm font-medium
                     hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {exporting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Exporting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M8 12l4 4m0 0l4-4m-4 4V4" />
              </svg>
              Export Report
            </>
          )}
        </button>
        <button
          onClick={() => !exporting && setOpen(o => !o)}
          disabled={exporting}
          className="px-2 py-2 bg-brand-orange border-l border-orange-600 text-white
                     hover:bg-brand-orange/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          aria-label="Export options"
        >
          <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <button
            onClick={() => triggerExport(false)}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-text-primary
                       hover:bg-surface transition-colors text-left"
          >
            <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
            </svg>
            Export All
          </button>
          <button
            onClick={() => triggerExport(true)}
            disabled={!hasFilter}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-text-primary
                       hover:bg-surface transition-colors text-left
                       disabled:opacity-40 disabled:cursor-not-allowed"
            title={!hasFilter ? 'Select a date range first' : ''}
          >
            <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Export Filtered
            {!hasFilter && <span className="ml-auto text-xs text-text-muted">(no filter)</span>}
          </button>
        </div>
      )}
    </div>
  )
}

export default function ReportsPage() {
  const [tab, setTab]             = useState('sales')
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate]     = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const params = {}
      if (startDate) params.startDate = startDate
      if (endDate)   params.endDate   = endDate

      const res = tab === 'sales'
        ? await reportService.sales(params)
        : tab === 'purchases'
        ? await reportService.purchases(params)
        : await reportService.stock(params)
      setData(res.data)
    } catch {
      toast.error('Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [tab, startDate, endDate])

  const tabs = [
    { key: 'sales',     label: 'Sales Report' },
    { key: 'purchases', label: 'Purchases Report' },
    { key: 'stock',     label: 'Stock Report' },
  ]

  const Skeleton = () => (
    <div className="space-y-4">
      <div className="h-48 card animate-pulse" />
      <div className="h-48 card animate-pulse" />
    </div>
  )

  return (
    <div>
      {}
      <div className="flex items-start justify-between gap-4 mb-0">
        <PageHeader title="Reports" subtitle="Financial and inventory analytics" />
        <div className="pt-1">
          <ExportButton tab={tab} startDate={startDate} endDate={endDate} />
        </div>
      </div>

      {}
      <div className="flex gap-1 p-1 bg-surface border border-border rounded-xl mb-6 w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setData(null) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              tab === t.key
                ? 'bg-white text-brand-orange shadow-card border border-border'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <DateRangeFilter
        start={startDate} end={endDate}
        onStart={setStartDate} onEnd={setEndDate}
        onClear={() => { setStartDate(''); setEndDate('') }}
      />

      {loading && <Skeleton />}

      {}
      {!loading && tab === 'sales' && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-5">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Total Revenue</p>
              <p className="font-display text-2xl font-bold text-brand-orange">{fmt(data.totalRevenue)}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Transactions</p>
              <p className="font-display text-2xl font-bold text-text-primary">{data.totalTransactions}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Avg. Order Value</p>
              <p className="font-display text-2xl font-bold text-text-primary">
                {data.totalTransactions ? fmt(data.totalRevenue / data.totalTransactions) : '₹0'}
              </p>
            </div>
          </div>

          {data.dailySales?.length > 0 && (
            <div className="card p-5">
              <p className="text-sm font-bold text-text-primary mb-4">Daily Sales</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.dailySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E5EC" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA0AE' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA0AE' }} axisLine={false} tickLine={false}
                    tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                  <Tooltip formatter={v => [fmt(v), 'Revenue']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #E2E5EC', fontSize: 12 }} />
                  <Bar dataKey="total" fill="#C4600A" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {data.topVariants?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <p className="text-sm font-bold text-text-primary">Top Selling Variants</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-surface border-b border-border">
                      {['#', 'Product', 'SKU', 'Variant', 'Qty Sold', 'Revenue'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.topVariants.map((v, i) => (
                      <tr key={i} className="hover:bg-surface/60">
                        <td className="px-4 py-2.5 text-text-muted text-xs">{i + 1}</td>
                        <td className="px-4 py-2.5 font-medium">{v.name}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-text-secondary">{v.sku}</td>
                        <td className="px-4 py-2.5 text-text-secondary">{[v.color, v.size].filter(Boolean).join(' / ') || '—'}</td>
                        <td className="px-4 py-2.5 font-semibold">{v.quantity}</td>
                        <td className="px-4 py-2.5 font-bold text-brand-orange">{fmt(v.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {}
      {!loading && tab === 'purchases' && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-5">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Total Spent</p>
              <p className="font-display text-2xl font-bold text-text-primary">{fmt(data.totalSpent)}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Orders</p>
              <p className="font-display text-2xl font-bold text-text-primary">{data.totalOrders}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Avg. Order</p>
              <p className="font-display text-2xl font-bold text-text-primary">
                {data.totalOrders ? fmt(data.totalSpent / data.totalOrders) : '₹0'}
              </p>
            </div>
          </div>

          {data.bySupplier?.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-5">
                <p className="text-sm font-bold text-text-primary mb-4">Spend by Supplier</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data.bySupplier} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                      {data.bySupplier.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={v => fmt(v)} contentStyle={{ borderRadius: 12, border: '1px solid #E2E5EC', fontSize: 12 }} />
                    <Legend iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <p className="text-sm font-bold text-text-primary">By Supplier</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-surface border-b border-border">
                        {['Supplier', 'Orders', 'Total Spent'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.bySupplier.map((s, i) => (
                        <tr key={i} className="hover:bg-surface/60">
                          <td className="px-4 py-2.5 font-medium">{s.name}</td>
                          <td className="px-4 py-2.5">{s.count}</td>
                          <td className="px-4 py-2.5 font-bold">{fmt(s.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {}
      {!loading && tab === 'stock' && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Total Variants</p>
              <p className="font-display text-2xl font-bold text-text-primary">{data.totalVariants}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Stock Value</p>
              <p className="font-display text-2xl font-bold text-brand-orange">{fmt(data.totalStockValue)}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Low Stock</p>
              <p className="font-display text-2xl font-bold text-amber-600">{data.lowStockCount}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Out of Stock</p>
              <p className="font-display text-2xl font-bold text-error-text">{data.outOfStockCount}</p>
            </div>
          </div>

          {data.byCategory?.length > 0 && (
            <div className="card p-5">
              <p className="text-sm font-bold text-text-primary mb-4">Stock Value by Category</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.byCategory} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E5EC" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA0AE' }} axisLine={false} tickLine={false}
                    tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                  <YAxis type="category" dataKey="category" width={100} tick={{ fontSize: 11, fill: '#5A5D6E' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => [fmt(v), 'Value']} contentStyle={{ borderRadius: 12, border: '1px solid #E2E5EC', fontSize: 12 }} />
                  <Bar dataKey="value" fill="#185FA5" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {data.lowStockVariants?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <p className="text-sm font-bold text-text-primary">Low Stock Variants</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-surface border-b border-border">
                      {['Product', 'SKU', 'Color', 'Size', 'Qty', 'Threshold', 'Status'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.lowStockVariants.map(v => (
                      <tr key={v._id} className="hover:bg-surface/60">
                        <td className="px-4 py-2.5 font-medium">{v.product?.name}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-text-secondary">{v.sku}</td>
                        <td className="px-4 py-2.5">{v.color || '—'}</td>
                        <td className="px-4 py-2.5">{v.size || '—'}</td>
                        <td className="px-4 py-2.5 font-bold">{v.quantity}</td>
                        <td className="px-4 py-2.5 text-text-muted">{v.lowStockThreshold}</td>
                        <td className="px-4 py-2.5">
                          <Badge
                            label={v.quantity === 0 ? 'Out of stock' : 'Low stock'}
                            variant={v.quantity === 0 ? 'error' : 'warning'}
                            dot
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && data && (
        (tab === 'sales' && data.totalTransactions === 0) ||
        (tab === 'purchases' && data.totalOrders === 0) ||
        (tab === 'stock' && data.totalVariants === 0)
      ) ? (
        <div className="card p-12 text-center text-text-muted">
          No data for the selected period.
        </div>
      ) : null}
    </div>
  )
}
