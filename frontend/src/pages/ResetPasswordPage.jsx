import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { KeyRound, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '../services/authService'
import { FormField, PasswordInput, SubmitBtn, PasswordStrength } from '../components/FormComponents'
import logo from '../assets/logo.jpg'

const schema = z.object({
  password: z.string()
    .min(6, 'Password must be at least 6 characters'),
  confirm: z.string().min(1, 'Please confirm your password'),
}).refine(d => d.password === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
})

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm({ resolver: zodResolver(schema) })
  const password = watch('password', '')

  const onSubmit = async ({ password }) => {
    setLoading(true)
    try {
      await authService.resetPassword(token, { password })
      toast.success('Password reset! Please sign in.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password')
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

          <div className="w-12 h-12 rounded-2xl bg-brand-orange-light flex items-center justify-center mb-5">
            <KeyRound size={22} className="text-brand-orange" />
          </div>

          <h1 className="font-display text-2xl font-bold text-text-primary tracking-tight mb-1">
            Set new password
          </h1>
          <p className="text-sm text-text-secondary mb-7">
            Choose a strong password for your account.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField label="New password" error={errors.password?.message}>
              <PasswordInput
                {...register('password')}
                placeholder="Create a strong password"
                hasError={!!errors.password}
                autoComplete="new-password"
              />
              <PasswordStrength password={password} />
            </FormField>

            <FormField label="Confirm password" error={errors.confirm?.message}>
              <PasswordInput
                {...register('confirm')}
                placeholder="Repeat your password"
                hasError={!!errors.confirm}
                autoComplete="new-password"
              />
            </FormField>

            <SubmitBtn loading={loading}>Reset password</SubmitBtn>
          </form>

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
