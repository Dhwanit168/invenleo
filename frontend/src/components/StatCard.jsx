
export default function StatCard({ label, value, sub, icon: Icon, trend, trendUp }) {
  return (
    <div className="card p-5 flex flex-col gap-3 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <p className="text-xs font-bold text-text-muted uppercase tracking-wider leading-tight">{label}</p>
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-brand-orange-light flex items-center justify-center shrink-0">
            <Icon size={17} className="text-brand-orange" />
          </div>
        )}
      </div>
      <p className="font-display text-2xl font-bold text-text-primary leading-none">{value}</p>
      {(sub || trend) && (
        <div className={`flex items-center gap-1 text-xs font-semibold ${
          trend
            ? trendUp ? 'text-success-text' : 'text-error-text'
            : 'text-text-muted font-medium'
        }`}>
          {trend && (
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${trendUp ? 'bg-success-text' : 'bg-error-text'}`} />
          )}
          {trend || sub}
        </div>
      )}
    </div>
  )
}
