import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '../services/authService'
import { FormField, TextInput, SubmitBtn } from '../components/FormComponents'
import logo from '../assets/logo.jpg'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
})

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async ({ email }) => {
    setLoading(true)
    try {
      await authService.forgotPassword({ email })
      setSent(true)
      toast.success('Reset link sent! Check your inbox.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card p-8 sm:p-10">
          {}
          <div className="flex items-center gap-3 mb-8">
            <img src={logo} alt="Leo Data Tech" className="w-10 h-10 object-contain rounded-xl border border-border p-0.5" />
            <div>
              <p className="font-display font-bold text-base text-text-primary leading-none">
                Inven<span className="text-brand-orange">Leo</span> by Leo Data Tech
              </p>
              <p className="text-xs text-text-muted mt-0.5">Inventory management system</p>
            </div>
          </div>

          {}
          <div className="w-12 h-12 rounded-2xl bg-brand-orange-light flex items-center justify-center mb-5">
            <Mail size={22} className="text-brand-orange" />
          </div>

          <h1 className="font-display text-2xl font-bold text-text-primary tracking-tight mb-1">
            Forgot your password?
          </h1>
          <p className="text-sm text-text-secondary mb-7">
            Enter your email and we'll send you a link to reset your password.
          </p>

          {sent ? (
            <div className="bg-success-bg border border-success-border rounded-xl p-4 text-sm text-success-text mb-6">
              ✅ If your email is registered, a reset link has been sent. Check your inbox (and spam folder).
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <FormField label="Email address" error={errors.email?.message}>
                <TextInput
                  {...register('email')}
                  type="email"
                  placeholder="you@company.com"
                  hasError={!!errors.email}
                  autoComplete="email"
                />
              </FormField>
              <SubmitBtn loading={loading}>Send reset link</SubmitBtn>
            </form>
          )}

          <Link
            to="/login"
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-brand-orange mt-6 transition-colors no-underline"
          >
            <ArrowLeft size={14} />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
