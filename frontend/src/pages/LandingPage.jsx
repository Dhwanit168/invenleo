import { Link } from 'react-router-dom'
import { Package, BarChart3, Bell, Truck, ShieldCheck, Smartphone, ArrowRight, CheckCircle2 } from 'lucide-react'
import Navbar  from '../components/Navbar'
import Footer  from '../components/Footer'

const FEATURES = [
  { Icon: Package,     title: 'Real-time stock tracking',  desc: 'Monitor inventory levels across all locations instantly with live updates and smart threshold alerts.' },
  { Icon: BarChart3,   title: 'Smart analytics',           desc: 'Make data-driven decisions with visual reports on stock movement, trends, and demand forecasts.' },
  { Icon: Bell,        title: 'Automated alerts',          desc: 'Never run out unexpectedly. Set custom thresholds for low-stock and automatic reorder triggers.' },
  { Icon: Truck,       title: 'Supplier management',       desc: 'Centralise supplier contacts, purchase orders, and delivery timelines in one clean dashboard.' },
  { Icon: ShieldCheck, title: 'Role-based access',         desc: 'Assign permissions by role — admins, managers, and warehouse staff see exactly what they need.' },
  { Icon: Smartphone,  title: 'Works anywhere',            desc: 'Desktop or mobile, Leo Data Tech is fully responsive and optimised for teams always on the move.' },
]

const STATS = [
  { value: '10K+', label: 'Products tracked'     },
  { value: '500+', label: 'Businesses trust us'  },
  { value: '99.9%', label: 'Uptime guarantee'    },
  { value: '24/7',  label: 'Support available'   },
]

const MOCK_CARDS = [
  { label: 'Total SKUs',   val: '1,284', delta: '+12 this week',     ok: true  },
  { label: 'Total value',  val: '₹4.2L', delta: '+3.4% vs last mo.', ok: true  },
  { label: 'Low stock',    val: '23',    delta: '⚠ Needs reorder',   ok: false },
  { label: 'Orders today', val: '8',     delta: '↑5 from yesterday', ok: true  },
]

const PLAN_FEATURES = [
  'Up to 500 SKUs',
  'Real-time stock sync',
  'Automated low-stock alerts',
  'Supplier & order tracking',
  'CSV import / export',
  'Email support',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />

      {}
      <section className="bg-gradient-to-b from-white to-surface pt-16 pb-20 px-4 sm:px-6 text-center border-b border-border">
        <div className="max-w-3xl mx-auto">

          {}
          <div className="inline-flex items-center gap-2 bg-brand-orange-light border border-brand-orange-border rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-brand-orange" />
            <span className="text-xs font-bold text-brand-orange tracking-widest uppercase">Now in Early Access</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-[56px] font-bold leading-[1.1] text-text-primary tracking-tight mb-5">
            Smarter inventory starts here.<br />
            <span className="text-brand-orange">InvenLeo by Leo Data Tech</span>
          </h1>

          <p className="text-lg text-text-secondary leading-relaxed max-w-xl mx-auto mb-10">
            Take full control of every product, supplier,
            and order — so nothing slips through the cracks.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center">
              Start for free <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn-ghost w-full sm:w-auto text-center">
              Sign in to dashboard
            </Link>
          </div>

          {}
          <div className="mt-16 card overflow-hidden max-w-3xl mx-auto text-left">
            <div className="bg-white border-b border-border px-4 py-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-300" />
              <span className="w-3 h-3 rounded-full bg-amber-300" />
              <span className="w-3 h-3 rounded-full bg-green-300" />
              <div className="ml-3 h-5 bg-surface rounded-lg border border-border w-52" />
            </div>
            <div className="bg-surface p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {MOCK_CARDS.map(s => (
                <div key={s.label} className="bg-white rounded-xl p-4 border border-border">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">{s.label}</p>
                  <p className="font-display text-2xl font-bold text-text-primary leading-none mb-1">{s.val}</p>
                  <p className={`text-xs font-medium ${s.ok ? 'text-success-text' : 'text-brand-orange'}`}>{s.delta}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {}
      <section id="features" className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="section-label mb-3">Everything you need</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
              Built for serious operations
            </h2>
            <p className="text-base text-text-secondary mt-3 max-w-md mx-auto">
              From a single store to a multi-warehouse enterprise, Leo Data Tech scales with you.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ Icon, title, desc }) => (
              <div key={title} className="card p-6 hover:border-border-hover transition-colors">
                <div className="w-10 h-10 rounded-xl bg-brand-orange-light flex items-center justify-center mb-4">
                  <Icon size={20} className="text-brand-orange" />
                </div>
                <h3 className="text-sm font-semibold text-text-primary mb-2">{title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {}
      <section id="pricing" className="py-16 px-4 sm:px-6 bg-white border-y border-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="section-label mb-3">Simple pricing</p>
            <h2 className="font-display text-3xl font-bold text-text-primary tracking-tight">
              Free to start. Affordable to grow.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {}
            <div className="card p-7">
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Starter</p>
              <p className="font-display text-4xl font-bold text-text-primary mb-1">₹0 <span className="text-lg font-normal text-text-muted">/mo</span></p>
              <p className="text-sm text-text-secondary mb-6">Perfect for small teams getting started</p>
              <ul className="space-y-3 mb-7">
                {PLAN_FEATURES.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-text-secondary">
                    <CheckCircle2 size={15} className="text-success-dot shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="btn-ghost block text-center">Get started free</Link>
            </div>
            {}
            <div className="card p-7 border-brand-orange bg-brand-orange-light relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-brand-orange text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Popular
              </div>
              <p className="text-xs font-bold text-brand-orange uppercase tracking-widest mb-3">Pro</p>
              <p className="font-display text-4xl font-bold text-text-primary mb-1">₹1,499 <span className="text-lg font-normal text-text-muted">/mo</span></p>
              <p className="text-sm text-text-secondary mb-6">Everything in Starter, plus unlimited power</p>
              <ul className="space-y-3 mb-7">
                {['Unlimited SKUs', 'Multi-warehouse support', 'Advanced analytics & reports', 'API access & integrations', 'Role-based permissions', 'Priority phone support'].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-text-secondary">
                    <CheckCircle2 size={15} className="text-brand-orange shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="btn-primary block text-center">Start Pro trial</Link>
            </div>
          </div>
        </div>
      </section>

      {}
      <section id="about" className="bg-brand-orange py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`text-center py-3 ${i < STATS.length - 1 ? 'md:border-r md:border-white/25' : ''}`}
            >
              <p className="font-display text-[34px] font-bold text-white leading-none">{s.value}</p>
              <p className="text-sm text-white/75 mt-1.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto bg-text-primary rounded-3xl px-8 sm:px-12 py-12 sm:py-14 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">Ready to take control?</h3>
            <p className="text-text-muted text-sm">Join hundreds of teams managing smarter with InvenLeo.</p>
          </div>
          <Link to="/register" className="btn-primary shrink-0 flex items-center gap-2">
            Create free account <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
