import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom' 
import {
  Package, TrendingUp, AlertTriangle, IndianRupee, Users
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts'
import { dashboardService } from '../services/dashboardService'
import StatCard from '../components/StatCard'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import toast from 'react-hot-toast'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-border rounded-xl p-4 shadow-xl text-xs min-w-[160px]">
      <p className="font-bold text-text-primary mb-2 text-sm border-b border-border pb-1.5">{label}</p>
      <div className="space-y-1.5">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-text-secondary">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              {p.name}:
            </span>
            <span className="font-bold text-text-primary">{fmt(p.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardService.getStats()
      .then(({ data }) => setData(data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  const stats = data?.stats || {}

  const totalRevenue = data?.monthlyChart?.reduce((s, m) => s + (m.revenue ?? 0), 0) ?? 0
  const totalCost    = data?.monthlyChart?.reduce((s, m) => s + (m.cost    ?? 0), 0) ?? 0
  const totalProfit  = totalRevenue - totalCost
  const profitIsPositive = totalProfit >= 0

  return (
    <div className="page-fade space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`Overview · ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`}
      />

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Monthly Revenue"
          value={loading ? '—' : fmt(stats.monthlyRevenue || 0)}
          icon={IndianRupee}
          trend={`Today: ${fmt(stats.todayRevenue || 0)}`}
          trendUp
        />
        <StatCard
          label="Monthly Profit"
          value={loading ? '—' : fmt(stats.monthlyProfit || 0)}
          icon={TrendingUp}
          trend={`Today: ${fmt(stats.todayProfit || 0)}`}
          trendUp={stats.todayProfit >= 0}
        />
        <StatCard
          label="Total Suppliers"
          value={loading ? '—' : stats.totalSuppliers ?? '—'}
          icon={Users}
          sub="Active suppliers"
        />
        <StatCard
          label="Total Products"
          value={loading ? '—' : stats.totalProducts ?? '—'}
          icon={Package}
          sub="Active SKUs"
        />
        <StatCard
          label="Low Stock Items"
          value={loading ? '—' : stats.lowStockVariants ?? '—'}
          icon={AlertTriangle}
          trend={stats.outOfStockVariants ? `${stats.outOfStockVariants} out of stock` : undefined}
          trendUp={false}
        />
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {}
        <div className="lg:col-span-2 card p-5 sm:p-8">
          <div className="flex items-start justify-between mb-8 flex-wrap gap-3">
            <p className="text-sm font-bold text-text-primary">Revenue — Last 6 Months</p>
            {!loading && (
              <div className="flex items-center gap-5 text-right">
                <div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">6-mo Revenue</p>
                  <p className="text-sm font-bold text-brand-orange">{fmt(totalRevenue)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">6-mo Cost</p>
                  <p className="text-sm font-bold text-text-secondary">{fmt(totalCost)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Net Profit</p>
                  <p className={`text-sm font-bold ${profitIsPositive ? 'text-success-text' : 'text-error-text'}`}>
                    {profitIsPositive ? '+' : ''}{fmt(totalProfit)}
                  </p>
                </div>
              </div>
            )}
          </div>
          {loading ? (
            <div className="h-52 bg-surface rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={data?.monthlyChart || []}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#C4600A" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#C4600A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#639922" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#639922" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#A32D2D" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#A32D2D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E2E5EC" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 11, fill: '#9CA0AE', fontWeight: 500 }} 
                  axisLine={false} 
                  tickLine={false} 
                  dy={10} 
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#9CA0AE', fontWeight: 500 }} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} 
                  dx={-5}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#F97316', strokeWidth: 1, strokeDasharray: '5 5' }} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Revenue" 
                  stroke="#C4600A" 
                  strokeWidth={2.5} 
                  fill="url(#revGrad)" 
                  activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, shadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="profit"  
                  name="Net Profit" 
                  stroke={profitIsPositive ? "#639922" : "#A32D2D"}
                  strokeWidth={2} 
                  fill={profitIsPositive ? "url(#profitGrad)" : "url(#lossGrad)"}
                  strokeDasharray="4 2"
                  baseValue={0}
                  activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-text-primary">Low Stock Alerts</p>
            <Link to="/alerts" className="text-xs text-brand-orange font-semibold hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-10 bg-surface rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {(data?.lowStockItems || []).slice(0, 6).map(item => (
                <div key={item._id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-xs font-semibold text-text-primary">{item.product?.name}</p>
                    <p className="text-[11px] text-text-muted">{item.sku}</p>
                  </div>
                  <Badge
                    label={`${item.quantity} left`}
                    variant={item.quantity === 0 ? 'error' : 'warning'}
                    dot
                  />
                </div>
              ))}
              {!data?.lowStockItems?.length && (
                <p className="text-sm text-text-muted text-center py-6">All stock levels are healthy.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-text-primary">Recent Sales</p>
            <Link to="/sales" className="text-xs text-brand-orange font-semibold hover:underline">View all</Link>
          </div>
          <div className="space-y-1">
            {loading
              ? [1,2,3].map(i => <div key={i} className="h-11 bg-surface rounded-xl animate-pulse mb-1" />)
              : (data?.recentSales || []).map(s => (
                <Link
                  key={s._id}
                  to={`/sales/${s._id}`}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-surface transition-colors group no-underline"
                >
                  <div>
                    <p className="text-xs font-semibold text-text-primary group-hover:text-brand-orange transition-colors">{s.saleNumber}</p>
                    <p className="text-[11px] text-text-muted">{s.customer} · {new Date(s.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  <span className="text-xs font-bold text-brand-orange">{fmt(s.totalAmount)}</span>
                </Link>
              ))
            }
            {!loading && !data?.recentSales?.length && (
              <p className="text-sm text-text-muted text-center py-6">No sales yet</p>
            )}
          </div>
        </div>

        {}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-text-primary">Recent Purchases</p>
            <Link to="/purchases" className="text-xs text-brand-orange font-semibold hover:underline">View all</Link>
          </div>
          <div className="space-y-1">
            {loading
              ? [1,2,3].map(i => <div key={i} className="h-11 bg-surface rounded-xl animate-pulse mb-1" />)
              : (data?.recentPurchases || []).map(p => (
                <Link
                  key={p._id}
                  to={`/purchases/${p._id}`}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-surface transition-colors group no-underline"
                >
                  <div>
                    <p className="text-xs font-semibold text-text-primary group-hover:text-brand-orange transition-colors">{p.purchaseNumber}</p>
                    <p className="text-[11px] text-text-muted">{p.supplier?.name} · {new Date(p.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  <span className="text-xs font-bold text-text-secondary">{fmt(p.totalAmount)}</span>
                </Link>
              ))
            }
            {!loading && !data?.recentPurchases?.length && (
              <p className="text-sm text-text-muted text-center py-6">No purchases yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
