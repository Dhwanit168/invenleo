import { useEffect, useState } from 'react'
import {
  ResponsiveContainer, ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area, Cell
} from 'recharts'
import {
  TrendingUp, Package, LayoutGrid,
  AlertTriangle, Clock, CheckCircle, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import { forecastService } from '../services/forecastService'
import PageHeader from '../components/PageHeader'

const fmt    = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`
const fmtNum = (n) => Number(n || 0).toLocaleString('en-IN')

const ORANGE      = '#C4600A'
const ORANGE_LIGHT= '#F5C89A'
const BLUE        = '#185FA5'
const BLUE_LIGHT  = '#B5D4F4'
const GRAY        = '#9CA0AE'

const urgencyStyle = (u) => {
  if (u === 'critical') return { bg: 'bg-error-bg', text: 'text-error-text', border: 'border-error-border', label: 'Critical' }
  if (u === 'warning')  return { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  label: 'Reorder Soon' }
  return { bg: 'bg-success-bg', text: 'text-success-text', border: 'border-success-border', label: 'OK' }
}

function StatMini({ label, value, sub, icon: Icon, color = 'orange' }) {
  const c = color === 'blue' ? 'text-brand-blue bg-brand-blue-light' : 'text-brand-orange bg-brand-orange-light'
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">{label}</p>
          <p className="text-xl font-bold text-text-primary font-display">{value}</p>
          {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${c}`}>
          <Icon size={16} />
        </div>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-border rounded-xl p-3 shadow-card text-xs">
      <p className="font-bold text-text-primary mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.name.toLowerCase().includes('revenue') ? fmt(p.value) : fmtNum(p.value)}
        </p>
      ))}
    </div>
  )
}

function OverviewTab() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    forecastService.getOverview()
      .then(({ data }) => setData(data))
      .catch(() => toast.error('Failed to load overview forecast'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="h-64 card animate-pulse rounded-2xl mt-4" />

  const combined = data?.combined || []
  const lastActual = data?.history?.[data.history.length - 1]
  const firstForecast = data?.forecast?.[0]
  const revenueGrowth = lastActual && firstForecast
    ? (((firstForecast.revenue - lastActual.revenue) / (lastActual.revenue || 1)) * 100).toFixed(1)
    : null

  return (
    <div className="space-y-6 mt-4">
      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatMini
          label="Last Month Revenue"
          value={fmt(lastActual?.revenue || 0)}
          sub="Actual"
          icon={TrendingUp}
        />
        <StatMini
          label="Next Month Forecast"
          value={fmt(data?.forecast?.[0]?.revenue || 0)}
          sub="Predicted (WMA)"
          icon={TrendingUp}
          color="blue"
        />
        <StatMini
          label="Revenue Trend"
          value={revenueGrowth !== null ? `${revenueGrowth > 0 ? '+' : ''}${revenueGrowth}%` : '—'}
          sub="vs last month"
          icon={TrendingUp}
          color={revenueGrowth >= 0 ? 'orange' : 'blue'}
        />
        <StatMini
          label="Units Forecast (30d)"
          value={fmtNum(data?.forecast?.[0]?.units || 0)}
          sub="Predicted units sold"
          icon={Package}
          color="blue"
        />
      </div>

      {}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-bold text-text-primary">Revenue — History + 3-Month Forecast</p>
          <span className="flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{background: ORANGE}} /> Actual</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{background: BLUE_LIGHT, border: `1px dashed ${BLUE}`}} /> Forecast</span>
          </span>
        </div>
        <p className="text-xs text-text-muted mb-4">Dashed bars = forecasted months using weighted moving average</p>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={combined}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E5EC" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: GRAY }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: GRAY }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="revenue"
              name="Revenue"
              radius={[4,4,0,0]}
              fillOpacity={1}
            >
              {combined.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.isForecast ? BLUE_LIGHT : ORANGE} />
              ))}
            </Bar>
            <Line
              dataKey="revenue"
              name="Trend"
              type="monotone"
              stroke={ORANGE}
              strokeWidth={2}
              dot={false}
              strokeDasharray="4 2"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {}
      <div className="card p-5">
        <p className="text-sm font-bold text-text-primary mb-1">Units Sold — History + 3-Month Forecast</p>
        <p className="text-xs text-text-muted mb-4">Total units sold per month with projected demand</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={combined}>
            <defs>
              <linearGradient id="unitsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={BLUE} stopOpacity={0.12} />
                <stop offset="95%" stopColor={BLUE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E5EC" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: GRAY }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: GRAY }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="units" name="Units" stroke={BLUE} strokeWidth={2} fill="url(#unitsGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-bold text-text-primary">3-Month Forecast Details</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-surface border-b border-border">
              {['Month', 'Forecast Revenue', 'Forecast Units', 'Method'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(data?.forecast || []).map((row, i) => (
              <tr key={i} className="hover:bg-surface/60">
                <td className="px-4 py-3 font-semibold text-brand-blue">{row.label}</td>
                <td className="px-4 py-3 font-bold text-brand-orange">{fmt(row.revenue)}</td>
                <td className="px-4 py-3">{fmtNum(row.units)}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-brand-blue-light text-brand-blue font-medium px-2 py-0.5 rounded-lg">Weighted Moving Avg</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  )
}

function ProductsTab() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')  // all | critical | warning | ok

  useEffect(() => {
    forecastService.getProducts()
      .then(({ data }) => setData(data))
      .catch(() => toast.error('Failed to load product forecast'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="h-64 card animate-pulse rounded-2xl mt-4" />

  const products = data?.products || []
  const critical  = products.filter(p => p.urgency === 'critical').length
  const warning   = products.filter(p => p.urgency === 'warning').length
  const visible   = filter === 'all' ? products : products.filter(p => p.urgency === filter)

  return (
    <div className="space-y-6 mt-4">
      {}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 border-l-4 border-error-border">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Critical (&lt;7 days)</p>
          <p className="text-2xl font-bold text-error-text font-display">{critical}</p>
          <p className="text-xs text-text-muted">products</p>
        </div>
        <div className="card p-4 border-l-4 border-amber-300">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Reorder Soon (&lt;30 days)</p>
          <p className="text-2xl font-bold text-amber-600 font-display">{warning}</p>
          <p className="text-xs text-text-muted">products</p>
        </div>
        <div className="card p-4 border-l-4 border-success-border">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Stock OK</p>
          <p className="text-2xl font-bold text-success-text font-display">{products.length - critical - warning}</p>
          <p className="text-xs text-text-muted">products</p>
        </div>
      </div>

      {}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all',      label: 'All Products' },
          { key: 'critical', label: 'Critical Only' },
          { key: 'warning',  label: 'Reorder Soon' },
          { key: 'ok',       label: 'Stock OK' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
              filter === key
                ? 'bg-brand-orange text-white border-brand-orange'
                : 'bg-white text-text-secondary border-border hover:border-border-hover'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {}
      <div className="space-y-3">
        {visible.length === 0 && (
          <div className="card p-8 text-center text-text-muted text-sm">No products found for this filter.</div>
        )}
        {visible.map((product) => {
          const s = urgencyStyle(product.urgency)
          const UrgencyIcon = product.urgency === 'critical' ? AlertTriangle : product.urgency === 'warning' ? Clock : CheckCircle

const chartData = product.monthLabels.map((label, i) => ({
            label,
            actual: product.monthlyValues[i]
          }))
          chartData.push({ label: 'Forecast', forecast: product.forecast30 })

          return (
            <div key={product.productId} className="card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                {}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-sm font-bold text-text-primary truncate">{product.name}</p>
                    <span className="text-xs bg-surface text-text-muted border border-border px-2 py-0.5 rounded-lg shrink-0">{product.category}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Current Stock</p>
                      <p className="text-base font-bold text-text-primary">{fmtNum(product.currentStock)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Avg Monthly Sales</p>
                      <p className="text-base font-bold text-text-primary">{fmtNum(product.avgMonthly)} units</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">30-Day Forecast</p>
                      <p className="text-base font-bold text-brand-orange">{fmtNum(product.forecast30)} units</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Days of Stock Left</p>
                      <p className={`text-base font-bold ${product.urgency === 'critical' ? 'text-error-text' : product.urgency === 'warning' ? 'text-amber-600' : 'text-success-text'}`}>
                        {product.daysLeft !== null ? `~${product.daysLeft}d` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {}
                <div className="flex flex-col items-end gap-3 shrink-0">
                  <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border ${s.bg} ${s.text} ${s.border}`}>
                    <UrgencyIcon size={12} />
                    {s.label}
                  </span>

                  {}
                  <div style={{ width: 180, height: 60 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <Bar dataKey="actual"   name="Actual"   fill={ORANGE}     radius={[3,3,0,0]} />
                        <Bar dataKey="forecast" name="Forecast" fill={BLUE_LIGHT} radius={[3,3,0,0]} />
                        <XAxis dataKey="label" tick={{ fontSize: 9, fill: GRAY }} axisLine={false} tickLine={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CategoriesTab() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    forecastService.getCategories()
      .then(({ data }) => setData(data))
      .catch(() => toast.error('Failed to load category forecast'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="h-64 card animate-pulse rounded-2xl mt-4" />

  const categories = data?.categories || []

  return (
    <div className="space-y-6 mt-4">
      {categories.length === 0 && (
        <div className="card p-8 text-center text-text-muted text-sm">No sales data found.</div>
      )}
      {categories.map((cat) => {
        const combined = [
          ...cat.history.map(h => ({ label: h.label, actual: h.units })),
          ...cat.forecast.map(f => ({ label: f.label, forecast: f.units })),
        ]
        const totalHistoric = cat.history.reduce((s, h) => s + h.units, 0)
        const totalForecast = cat.forecast.reduce((s, f) => s + f.units, 0)

        return (
          <div key={cat.category} className="card p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <p className="text-sm font-bold text-text-primary">{cat.category}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Last 6 months: <span className="font-semibold text-text-secondary">{fmtNum(totalHistoric)} units</span>
                  &nbsp;·&nbsp;
                  Next 3 months forecast: <span className="font-semibold text-brand-orange">{fmtNum(totalForecast)} units</span>
                </p>
              </div>
              <span className="text-xs bg-brand-orange-light text-brand-orange border border-brand-orange-border font-semibold px-3 py-1 rounded-lg">
                WMA Forecast
              </span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <ComposedChart data={combined}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E5EC" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: GRAY }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: GRAY }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="actual"   name="Actual Units"   fill={ORANGE}     radius={[4,4,0,0]} />
                <Bar dataKey="forecast" name="Forecast Units" fill={BLUE_LIGHT} radius={[4,4,0,0]} />
                <Line dataKey="actual"   type="monotone" stroke={ORANGE} strokeWidth={1.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )
      })}
    </div>
  )
}

export default function ForecastPage() {
  const [tab, setTab] = useState('overview')

  const tabs = [
    { key: 'overview',    label: 'Revenue Overview',   Icon: TrendingUp  },
    { key: 'products',    label: 'Product Forecasts',  Icon: Package     },
    { key: 'categories',  label: 'Category Trends',    Icon: LayoutGrid  },
  ]

  return (
    <div>
      <PageHeader
        title="Demand Forecasting"
        subtitle="Weighted moving average predictions based on your sales history"
      />

      {}
      <div className="card p-4 mb-5 flex items-start gap-3 border-l-4 border-brand-orange">
        <TrendingUp size={18} className="text-brand-orange shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-text-primary">How forecasts are calculated</p>
          <p className="text-xs text-text-muted mt-0.5">
            Forecasts use a <strong>Weighted Moving Average (WMA)</strong> on the last 3 months of sales data.
            More recent months are weighted higher. Product-level forecasts also show estimated days of stock remaining
            based on average daily sales rate. Data refreshes on every page load.
          </p>
        </div>
      </div>

      {}
      <div className="flex gap-1 bg-surface p-1 rounded-xl mb-2 w-fit">
        {tabs.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all ${
              tab === key
                ? 'bg-white text-text-primary shadow-card'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview'   && <OverviewTab />}
      {tab === 'products'   && <ProductsTab />}
      {tab === 'categories' && <CategoriesTab />}
    </div>
  )
}
