import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import {
  FormField, TextInput, PasswordInput, SubmitBtn, Divider,
} from '../components/FormComponents'
import logo from '../assets/logo.jpg'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await login(data)
      toast.success('Welcome back! 👋')
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="card p-8 sm:p-10">
            {}
            <Link to="/" className="flex items-center gap-3 mb-7 no-underline hover:opacity-90 transition-opacity">
              <img src={logo} alt="Leo Data Tech" className="w-10 h-10 object-contain rounded-xl border border-border p-0.5 bg-white" />
              <div>
                <p className="font-display font-bold text-base text-text-primary leading-none">
                  Inven<span className="text-brand-orange">Leo</span> by Leo Data Tech
                </p>
                <p className="text-xs text-text-muted mt-0.5">Inventory management system</p>
              </div>
            </Link>

            <h1 className="font-display text-2xl font-bold text-text-primary tracking-tight mb-1">
              Welcome back
            </h1>
            <p className="text-sm text-text-secondary mb-7">
              Sign in to your inventory dashboard
            </p>

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

              <FormField label="Password" error={errors.password?.message}>
                <PasswordInput
                  {...register('password')}
                  placeholder="Enter your password"
                  hasError={!!errors.password}
                  autoComplete="current-password"
                />
              </FormField>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs font-semibold text-brand-orange hover:text-brand-orange-hover no-underline transition-colors">
                  Forgot password?
                </Link>
              </div>

              <SubmitBtn loading={loading}>Sign in to InvenLeo</SubmitBtn>
            </form>

<p className="text-center text-sm text-text-secondary mt-7">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-brand-orange hover:text-brand-orange-hover no-underline">
                Create one free
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-text-muted mt-5 mb-8">
            🔒 Your data is encrypted and stored securely
          </p>
        </div>
      </main>
    </div>
  )
}
