
const VARIANTS = {
  success:  'bg-success-bg text-success-text border-success-border',
  warning:  'bg-amber-50 text-amber-700 border-amber-200',
  error:    'bg-error-bg text-error-text border-error-border',
  info:     'bg-brand-blue-light text-brand-blue border-brand-blue/20',
  default:  'bg-surface text-text-secondary border-border',
}

export default function Badge({ label, variant = 'default', dot = false }) {
  const cls = VARIANTS[variant] || VARIANTS.default
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />}
      {label}
    </span>
  )
}
