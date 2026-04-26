import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { supplierService } from '../services/supplierService'
import { FormField, TextInput, SubmitBtn } from '../components/FormComponents'
import PageHeader from '../components/PageHeader'

const schema = z.object({
  name:          z.string().min(1, 'Supplier name is required'),
  email:         z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone:         z.string().optional(),
  contactPerson: z.string().optional(),
  notes:         z.string().optional(),
  address: z.object({
    street:  z.string().optional(),
    city:    z.string().optional(),
    state:   z.string().optional(),
    country: z.string().optional(),
    zip:     z.string().optional(),
  }).optional(),
})

export default function SupplierFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { address: {} },
  })

  useEffect(() => {
    if (!isEdit) return
    supplierService.getById(id).then(({ data }) => {
      reset({
        name:          data.name,
        email:         data.email || '',
        phone:         data.phone || '',
        contactPerson: data.contactPerson || '',
        notes:         data.notes || '',
        address: {
          street:  data.address?.street  || '',
          city:    data.address?.city    || '',
          state:   data.address?.state   || '',
          country: data.address?.country || '',
          zip:     data.address?.zip     || '',
        },
      })
    }).catch(() => { toast.error('Supplier not found'); navigate('/suppliers') })
  }, [id, isEdit])

  const onSubmit = async (values) => {
    setLoading(true)
    try {
      if (isEdit) {
        await supplierService.update(id, values)
        toast.success('Supplier updated')
      } else {
        await supplierService.create(values)
        toast.success('Supplier created')
      }
      navigate('/suppliers')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-4">
        <Link to="/suppliers" className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand-orange no-underline">
          <ArrowLeft size={14} /> Back to suppliers
        </Link>
      </div>

      <PageHeader title={isEdit ? 'Edit Supplier' : 'New Supplier'} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        {}
        <div className="card p-6 space-y-4">
          <p className="text-sm font-bold text-text-primary">Supplier Details</p>
          <FormField label="Supplier name" error={errors.name?.message}>
            <TextInput {...register('name')} placeholder="e.g. TechParts Ltd." hasError={!!errors.name} />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Email" error={errors.email?.message}>
              <TextInput {...register('email')} type="email" placeholder="supplier@company.com" hasError={!!errors.email} />
            </FormField>
            <FormField label="Phone">
              <TextInput {...register('phone')} placeholder="+91 98765 43210" />
            </FormField>
          </div>
          <FormField label="Contact Person">
            <TextInput {...register('contactPerson')} placeholder="e.g. Rajesh Kumar" />
          </FormField>
          <FormField label="Notes">
            <textarea {...register('notes')} rows={3} placeholder="Any additional notes…" className="input-base resize-none" />
          </FormField>
        </div>

        {}
        <div className="card p-6 space-y-4">
          <p className="text-sm font-bold text-text-primary">Address <span className="font-normal text-text-muted">(optional)</span></p>
          <FormField label="Street">
            <TextInput {...register('address.street')} placeholder="123 Main Street" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="City">
              <TextInput {...register('address.city')} placeholder="Mumbai" />
            </FormField>
            <FormField label="State">
              <TextInput {...register('address.state')} placeholder="Maharashtra" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Country">
              <TextInput {...register('address.country')} placeholder="India" />
            </FormField>
            <FormField label="ZIP / PIN">
              <TextInput {...register('address.zip')} placeholder="400001" />
            </FormField>
          </div>
        </div>

        <div className="flex gap-3">
          <SubmitBtn loading={loading}>{isEdit ? 'Save changes' : 'Create supplier'}</SubmitBtn>
          <Link to="/suppliers" className="btn-ghost">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
