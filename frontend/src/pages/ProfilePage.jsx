import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Lock, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import { FormField, TextInput, PasswordInput, SubmitBtn } from '../components/FormComponents'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'

const profileSchema = z.object({
  username: z.string().min(3, 'Min 3 characters').max(30).optional().or(z.literal('')),
  email:    z.string().email('Valid email required').optional().or(z.literal('')),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword:     z.string().min(6, 'Min 6 characters'),
  confirmPassword: z.string().min(1, 'Confirm your password'),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

const ROLE_VARIANT = { admin: 'error', manager: 'info', staff: 'default' }

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: user?.username || '', email: user?.email || '' },
  })

  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) })

  const onProfileSubmit = async (data) => {

    const payload = {}
    if (data.username && data.username !== user.username) payload.username = data.username
    if (data.email    && data.email    !== user.email)    payload.email    = data.email
    if (!Object.keys(payload).length) { toast('No changes to save'); return }

    setProfileLoading(true)
    try {
      const { data: res } = await authService.updateProfile(payload)
      updateUser(res.user)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally {
      setProfileLoading(false)
    }
  }

  const onPasswordSubmit = async (data) => {
    setPasswordLoading(true)
    try {
      await authService.updateProfile({
        currentPassword: data.currentPassword,
        newPassword:     data.newPassword,
      })
      toast.success('Password changed!')
      passwordForm.reset()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Profile" subtitle="Manage your account settings" />

      <div className="max-w-2xl space-y-6">
        {}
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-orange-light flex items-center justify-center text-brand-orange font-display font-bold text-2xl shrink-0">
              {user?.username?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-display font-bold text-lg text-text-primary">{user?.username}</p>
              <p className="text-sm text-text-secondary">{user?.email}</p>
              <div className="mt-1.5">
                <Badge label={user?.role} variant={ROLE_VARIANT[user?.role] || 'default'} />
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <User size={16} className="text-brand-orange" />
            <p className="text-sm font-bold text-text-primary">Personal Information</p>
          </div>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
            <FormField label="Username" error={profileForm.formState.errors.username?.message}>
              <TextInput
                {...profileForm.register('username')}
                placeholder="johndoe"
                hasError={!!profileForm.formState.errors.username}
              />
            </FormField>
            <FormField label="Email address" error={profileForm.formState.errors.email?.message}>
              <TextInput
                {...profileForm.register('email')}
                type="email"
                placeholder="you@company.com"
                hasError={!!profileForm.formState.errors.email}
              />
            </FormField>
            <div className="flex justify-end">
              <SubmitBtn loading={profileLoading} className="w-auto px-6">
                <Save size={14} className="mr-1" /> Save changes
              </SubmitBtn>
            </div>
          </form>
        </div>

        {}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Lock size={16} className="text-brand-orange" />
            <p className="text-sm font-bold text-text-primary">Change Password</p>
          </div>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            <FormField label="Current password" error={passwordForm.formState.errors.currentPassword?.message}>
              <PasswordInput
                {...passwordForm.register('currentPassword')}
                placeholder="Your current password"
                hasError={!!passwordForm.formState.errors.currentPassword}
                autoComplete="current-password"
              />
            </FormField>
            <FormField label="New password" error={passwordForm.formState.errors.newPassword?.message}>
              <PasswordInput
                {...passwordForm.register('newPassword')}
                placeholder="At least 6 characters"
                hasError={!!passwordForm.formState.errors.newPassword}
                autoComplete="new-password"
              />
            </FormField>
            <FormField label="Confirm new password" error={passwordForm.formState.errors.confirmPassword?.message}>
              <PasswordInput
                {...passwordForm.register('confirmPassword')}
                placeholder="Repeat your new password"
                hasError={!!passwordForm.formState.errors.confirmPassword}
                autoComplete="new-password"
              />
            </FormField>
            <div className="flex justify-end">
              <SubmitBtn loading={passwordLoading} className="w-auto px-6">
                <Lock size={14} className="mr-1" /> Update password
              </SubmitBtn>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
