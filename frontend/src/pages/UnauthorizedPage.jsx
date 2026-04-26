import { useNavigate } from 'react-router-dom'
import { ShieldOff, ArrowLeft } from 'lucide-react'

export default function UnauthorizedPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-3xl bg-error-bg flex items-center justify-center mx-auto mb-6">
          <ShieldOff size={36} className="text-error-text" />
        </div>
        <h1 className="font-display text-3xl font-bold text-text-primary mb-2">Access Denied</h1>
        <p className="text-text-secondary mb-8">
          You don't have permission to view this page. Contact your administrator if you think this is a mistake.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-2">
            <ArrowLeft size={15} /> Go back
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Go to dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
