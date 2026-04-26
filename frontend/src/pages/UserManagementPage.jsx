import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, X, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '../services/authService'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'
import { FormField, TextInput, SubmitBtn, PasswordInput, CustomDropdown } from '../components/FormComponents'

const ROLES = ['admin', 'manager', 'staff']

const ROLE_VARIANT = { admin: 'error', manager: 'info', staff: 'default' }

const createSchema = z.object({
  username: z.string().min(3, 'Min 3 characters').max(30),
  email:    z.string().email('Valid email required'),
  password: z.string().min(6, 'Min 6 characters'),
  role:     z.enum(['admin', 'manager', 'staff']).default('staff'),
})

const editSchema = z.object({
  role:      z.enum(['admin', 'manager', 'staff']),
  isActive:  z.boolean(),
  isBlocked: z.boolean(),
})

function CreateUserModal({ open, onClose, onCreated }) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({ resolver: zodResolver(createSchema) })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await authService.createUser(data)
      toast.success('User created!')
      reset()
      onCreated()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-border max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="font-display font-bold text-lg text-text-primary">Create User</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface text-text-muted"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Username" error={errors.username?.message}>
            <TextInput {...register('username')} placeholder="johndoe" hasError={!!errors.username} />
          </FormField>
          <FormField label="Email" error={errors.email?.message}>
            <TextInput {...register('email')} type="email" placeholder="john@company.com" hasError={!!errors.email} />
          </FormField>
          <FormField label="Password" error={errors.password?.message}>
            <PasswordInput {...register('password')} placeholder="At least 6 characters" hasError={!!errors.password} />
          </FormField>
          <FormField label="Role">
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <CustomDropdown
                  value={field.value}
                  onChange={field.onChange}
                  options={ROLES.map(r => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))}
                  hasError={!!errors.role}
                />
              )}
            />
          </FormField>
          <div className="flex gap-3 pt-1">
            <SubmitBtn loading={loading}>Create user</SubmitBtn>
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditUserModal({ user, open, onClose, onUpdated }) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    resolver: zodResolver(editSchema),
  })

  useEffect(() => {
    if (user) reset({ role: user.role, isActive: user.isActive, isBlocked: user.isBlocked || false })
  }, [user])

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await authService.updateUserRole(user._id, data)
      toast.success('User updated!')
      onUpdated()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  if (!open || !user) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-border max-w-sm w-full p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="font-display font-bold text-lg text-text-primary">Edit User</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface text-text-muted"><X size={16} /></button>
        </div>
        <p className="text-sm text-text-secondary mb-4">Editing: <strong>{user.username}</strong> ({user.email})</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Role">
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <CustomDropdown
                  value={field.value}
                  onChange={field.onChange}
                  options={ROLES.map(r => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))}
                  hasError={!!errors.role}
                />
              )}
            />
          </FormField>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...register('isActive')} className="w-4 h-4 accent-brand-orange" />
              <span className="text-text-primary font-medium">Active</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...register('isBlocked')} className="w-4 h-4 accent-error-text" />
              <span className="text-error-text font-medium">Blocked</span>
            </label>
          </div>
          <div className="flex gap-3 pt-1">
            <SubmitBtn loading={loading}>Save changes</SubmitBtn>
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function UserManagementPage() {
  const [users, setUsers]     = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser]     = useState(null)

  const fetchUsers = async (q = '') => {
    setLoading(true)
    try {
      const { data } = await authService.getUsers({ search: q, limit: 100 })
      setUsers(data.users)
      setTotal(data.total)
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const columns = [
    { key: 'username', label: 'Username' },
    { key: 'email',    label: 'Email' },
    {
      key: 'role', label: 'Role',
      render: r => <Badge label={r.role} variant={ROLE_VARIANT[r.role] || 'default'} />
    },
    {
      key: 'isActive', label: 'Status',
      render: r => r.isBlocked
        ? <Badge label="Blocked" variant="error" dot />
        : r.isActive
        ? <Badge label="Active"  variant="success" dot />
        : <Badge label="Inactive" variant="default" dot />
    },
    {
      key: 'createdAt', label: 'Joined',
      render: r => new Date(r.createdAt).toLocaleDateString('en-IN')
    },
    {
      key: 'actions', label: '', sortable: false,
      render: row => (
        <button
          onClick={() => setEditUser(row)}
          className="p-1.5 rounded-lg hover:bg-brand-orange-light text-text-secondary hover:text-brand-orange transition-colors"
        >
          <Pencil size={14} />
        </button>
      )
    },
  ]

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle={`${total} user${total !== 1 ? 's' : ''}`}
        action={
          <button onClick={() => setCreateOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Create user
          </button>
        }
      />

      <div className="mb-4">
        <div className="relative w-full sm:max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); fetchUsers(e.target.value) }}
            placeholder="Search users…"
            className="input-base pl-9"
          />
        </div>
      </div>

      <DataTable columns={columns} data={users} loading={loading} emptyMsg="No users found" />

      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => { setCreateOpen(false); fetchUsers(search) }}
      />
      <EditUserModal
        user={editUser}
        open={!!editUser}
        onClose={() => setEditUser(null)}
        onUpdated={() => { setEditUser(null); fetchUsers(search) }}
      />
    </div>
  )
}
