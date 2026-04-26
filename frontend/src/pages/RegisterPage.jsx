import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, Users, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import {
  FormField,
  TextInput,
  PasswordInput,
  SubmitBtn,
  PasswordStrength,
} from '../components/FormComponents'
import logo from '../assets/logo.jpg'

const registerSchema = z
  .object({
    username: z.string().min(3, 'Username must be at least 3 characters').max(30),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    role: z.enum(['staff', 'manager'], { required_error: 'Please select a role' }),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[0-9]/, 'Must contain a number')
      .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(d => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

const REGISTER_PERKS = [
  'Free starter plan — no credit card needed',
  'Up to 500 SKUs on the free plan',
  'Real-time stock alerts included',
]

const ROLES = [
  {
    id: 'manager',
    label: 'Manager',
    description: 'Inventory & purchases access',
    icon: ShieldCheck,
  },
  {
    id: 'staff',
    label: 'Staff',
    description: 'Warehouse & sales team',
    icon: Users,
  },
]

function RoleSelector({ value, onChange, hasError }) {
  return (
    <div className={`grid grid-cols-2 gap-2.5 ${hasError ? 'ring-2 ring-error-text/20 rounded-xl' : ''}`}>
      {ROLES.map(({ id, label, description, icon: Icon }) => {
        const selected = value === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl border text-left
              transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/20
              ${selected
                ? 'bg-brand-blue border-brand-blue text-white shadow-md scale-[1.02]'
                : 'bg-surface border-border text-text-secondary hover:border-brand-blue/40 hover:bg-white hover:shadow-sm'
              }
            `}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${selected ? 'bg-white/20' : 'bg-white border border-border'
              }`}>
              <Icon size={15} className={selected ? 'text-white' : 'text-brand-blue'} />
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-semibold leading-tight ${selected ? 'text-white' : 'text-text-primary'
                }`}>{label}</p>
              <p className={`text-[11px] leading-tight mt-0.5 truncate ${selected ? 'text-white/70' : 'text-text-muted'
                }`}>{description}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default function RegisterPage() {
  const { register: registerAuth } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm({ resolver: zodResolver(registerSchema) })

  const password = watch('password', '')

  const onSubmit = async ({ username, email, password, role }) => {
    setLoading(true)
    try {
      
      await registerAuth({ username, email, password, role })
      toast.success('Account created! Please sign in to continue. 🚀')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {}
          <div className="hidden lg:block">
            <div className="mb-8">
              <Link to="/" className="flex items-center gap-3 mb-6 no-underline hover:opacity-90 transition-opacity">
                <img src={logo} alt="Leo Data Tech" className="w-12 h-12 object-contain rounded-xl border border-border p-0.5 bg-white" />
                <div>
                  <p className="font-display font-bold text-base text-text-primary leading-none">
                    Inven<span className="text-brand-orange">Leo</span> by Leo Data Tech
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">Start your 14-day free trial</p>
                </div>
              </Link>

              <h2 className="font-display text-3xl font-bold text-text-primary tracking-tight mb-3">
                Take control of your inventory today.
              </h2>
              <p className="text-text-muted text-sm leading-relaxed">
                Join our community of professionals and start managing your inventory smarter with InvenLeo.
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              {REGISTER_PERKS.map(p => (
                <li key={p} className="flex items-center gap-3 text-sm text-text-secondary">
                  <CheckCircle2 size={17} className="text-success-dot shrink-0" />
                  {p}
                </li>
              ))}
            </ul>

            {}
            <div className="card p-5 mt-8">
              <p className="text-sm text-text-secondary leading-relaxed mb-4 italic">
                "Leo Data Tech cut our stockout incidents by 80% within the first month.
                The alerts and real-time view are genuinely game-changing."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-orange-light flex items-center justify-center text-brand-orange font-semibold text-sm">
                  RS
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-primary">Rahul Sharma</p>
                  <p className="text-xs text-text-muted">Operations Manager, TechMart</p>
                </div>
              </div>
            </div>
          </div>

          {}
          <div>
            <Link to="/" className="flex items-center gap-3 mb-6 lg:hidden no-underline hover:opacity-90 transition-opacity">
              <img src={logo} alt="Leo Data Tech" className="w-9 h-9 object-contain rounded-xl border border-border p-0.5 bg-white" />
              <span className="font-display font-bold text-base text-text-primary">
                Inven<span className="text-brand-orange">Leo</span> by Leo Data Tech
              </span>
            </Link>

            <div className="card p-8 sm:p-10">
              <h1 className="font-display text-2xl font-bold text-text-primary tracking-tight mb-1">
                Create your account
              </h1>
              <p className="text-sm text-text-secondary mb-7">
                Free forever on the starter plan. No credit card required.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

                {}
                <FormField label="I am joining as" error={errors.role?.message}>
                  <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                      <RoleSelector
                        value={field.value}
                        onChange={field.onChange}
                        hasError={!!errors.role}
                      />
                    )}
                  />

                </FormField>

                {}
                <FormField label="Username" error={errors.username?.message}>
                  <TextInput
                    {...register('username')}
                    placeholder="Rahul Sharma"
                    hasError={!!errors.username}
                    autoComplete="username"
                  />
                </FormField>

                {}
                <FormField label="Work email" error={errors.email?.message}>
                  <TextInput
                    {...register('email')}
                    type="email"
                    placeholder="you@company.com"
                    hasError={!!errors.email}
                    autoComplete="email"
                  />
                </FormField>

                {}
                <FormField label="Password" error={errors.password?.message}>
                  <PasswordInput
                    {...register('password')}
                    placeholder="Create a strong password"
                    hasError={!!errors.password}
                    autoComplete="new-password"
                  />
                  <PasswordStrength password={password} />
                </FormField>

                {}
                <FormField label="Confirm password" error={errors.confirmPassword?.message}>
                  <PasswordInput
                    {...register('confirmPassword')}
                    placeholder="Repeat your password"
                    hasError={!!errors.confirmPassword}
                    autoComplete="new-password"
                  />
                </FormField>

                {}
                <p className="text-xs text-text-muted bg-surface rounded-xl px-4 py-3 leading-relaxed">
                  By creating an account you agree to our{' '}
                  <a href="#" className="text-brand-orange hover:text-brand-orange-hover no-underline hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-brand-orange hover:text-brand-orange-hover no-underline hover:underline">Privacy Policy</a>.
                </p>

                <SubmitBtn loading={loading}>Create my account</SubmitBtn>
              </form>

              <p className="text-center text-sm text-text-secondary mt-6">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-brand-orange hover:text-brand-orange-hover no-underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
