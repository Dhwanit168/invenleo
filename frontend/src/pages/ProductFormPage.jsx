import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { productService } from '../services/productService'
import { supplierService } from '../services/supplierService'
import { FormField, TextInput, SubmitBtn, CustomDropdown } from '../components/FormComponents'
import PageHeader from '../components/PageHeader'

const variantSchema = z.object({
  _id:      z.string().optional(),
  color:    z.string().optional().or(z.literal('')),
  size:     z.string().optional().or(z.literal('')),
  sku:      z.string().optional().or(z.literal('')),
  price:    z.preprocess(v => (v === '' ? undefined : v), z.coerce.number().min(0).optional()),
  costPrice: z.preprocess(v => (v === '' ? undefined : v), z.coerce.number().min(0).optional()),
  quantity: z.coerce.number().min(0).default(0),
  lowStockThreshold: z.coerce.number().min(0).default(10),
  reorderQuantity: z.preprocess(v => (v === '' ? undefined : v), z.coerce.number().min(1).optional()),
})

const schema = z.object({
  name:         z.string().min(1, 'Product name is required'),
  category:     z.string().min(1, 'Category is required'),
  description:  z.string().optional(),
  basePrice:    z.coerce.number().min(0, 'Price must be ≥ 0'),
  baseCostPrice: z.coerce.number().min(0).default(0),
  supplier:     z.string().optional(),
  variants:     z.array(variantSchema).optional(),
})

export default function ProductFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { variants: [] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'variants' })

const fetchSuppliers = useCallback(() => {
    supplierService.getAll({ limit: 200 })
      .then(({ data }) => setSuppliers(data.suppliers))
      .catch(() => {})
  }, [])

  useEffect(() => { fetchSuppliers() }, [fetchSuppliers])

useEffect(() => {
    if (!isEdit) return
    productService.getById(id).then(({ data }) => {
      reset({
        name:         data.name,
        category:     data.category,
        description:  data.description || '',
        basePrice:    data.basePrice,
        baseCostPrice: data.baseCostPrice || 0,
        supplier:     data.supplier?._id || '',
        variants:     data.variants?.map(v => ({
          _id:      v._id,
          color:    v.color || '',
          size:     v.size  || '',
          sku:      v.sku,
          price:    v.price ?? '',
          costPrice: v.costPrice || 0,
          quantity: v.quantity,
          lowStockThreshold: v.lowStockThreshold,
          reorderQuantity: v.reorderQuantity || '',
        })) || [],
      })
    }).catch(() => { toast.error('Product not found'); navigate('/products') })
  }, [id, isEdit])

  const onSubmit = async (values) => {
    setLoading(true)
    try {
      const payload = { ...values }
      if (!payload.supplier) delete payload.supplier

      if (isEdit) {
        await productService.update(id, payload)
        toast.success('Product updated')
      } else {
        await productService.create(payload)
        toast.success('Product created')
      }
      navigate('/products')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSupplier = useCallback(() => {
    navigate('/suppliers/new', { state: { returnTo: isEdit ? `/products/${id}/edit` : '/products/new' } })
  }, [navigate, isEdit, id])

  return (
    <div>
      <div className="mb-4">
        <Link to="/products" className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand-orange no-underline">
          <ArrowLeft size={14} /> Back to products
        </Link>
      </div>

      <PageHeader title={isEdit ? 'Edit Product' : 'New Product'} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
        {}
        <div className="card p-6 space-y-4">
          <p className="text-sm font-bold text-text-primary">Product Details</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Product name" error={errors.name?.message}>
              <TextInput {...register('name')} placeholder="e.g. Running Shoes" hasError={!!errors.name} />
            </FormField>
            <FormField label="Category" error={errors.category?.message}>
              <TextInput {...register('category')} placeholder="e.g. Footwear" hasError={!!errors.category} />
            </FormField>
          </div>

          <FormField label="Description">
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Optional description…"
              className="input-base resize-none"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Base Price (₹)" error={errors.basePrice?.message}>
              <TextInput {...register('basePrice')} type="number" min="0" step="0.01" placeholder="0.00" hasError={!!errors.basePrice} />
            </FormField>
            <FormField label="Base Cost Price (₹)">
              <TextInput {...register('baseCostPrice')} type="number" min="0" step="0.01" placeholder="0.00" />
            </FormField>
            <FormField label="Supplier">
              <Controller
                name="supplier"
                control={control}
                render={({ field }) => (
                  <CustomDropdown
                    value={field.value}
                    onChange={field.onChange}
                    options={suppliers.map(s => ({ value: s._id, label: s.name }))}
                    placeholder="— None —"
                    actionOption={{
                      label: 'Add Supplier',
                      onClick: handleAddSupplier,
                    }}
                  />
                )}
              />
            </FormField>
          </div>
        </div>

        {}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-text-primary">Variants</p>
            <button
              type="button"
              onClick={() => append({ color:'', size:'', sku:'', price:'', costPrice:0, quantity:0, lowStockThreshold:10, reorderQuantity: '' })}
              className="btn-ghost flex items-center gap-2 text-xs py-1.5 px-3"
            >
              <Plus size={13} /> Add variant
            </button>
          </div>

          {fields.length === 0 && (
            <p className="text-sm text-text-muted text-center py-6">
              No variants added. Click "Add variant" to begin.
            </p>
          )}

          <div className="space-y-4">
            {fields.map((field, i) => (
              <div key={field.id} className="border border-border rounded-xl p-4 relative">
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-error-bg text-text-muted hover:text-error-text transition-colors"
                >
                  <Trash2 size={13} />
                </button>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FormField label="Color" error={errors.variants?.[i]?.color?.message}>
                    <TextInput {...register(`variants.${i}.color`)} placeholder="e.g. Red" hasError={!!errors.variants?.[i]?.color} />
                  </FormField>
                  <FormField label="Size" error={errors.variants?.[i]?.size?.message}>
                    <TextInput {...register(`variants.${i}.size`)} placeholder="e.g. L" hasError={!!errors.variants?.[i]?.size} />
                  </FormField>
                  <FormField label="SKU (auto if blank)" error={errors.variants?.[i]?.sku?.message}>
                    <TextInput {...register(`variants.${i}.sku`)} placeholder="Leave blank to auto" hasError={!!errors.variants?.[i]?.sku} />
                  </FormField>
                  <FormField label="Quantity" error={errors.variants?.[i]?.quantity?.message}>
                    <TextInput {...register(`variants.${i}.quantity`)} type="number" min="0" placeholder="0" hasError={!!errors.variants?.[i]?.quantity} />
                  </FormField>
                  <FormField label="Price (₹)" error={errors.variants?.[i]?.price?.message}>
                    <TextInput {...register(`variants.${i}.price`)} type="number" min="0" step="0.01" placeholder="Override…" hasError={!!errors.variants?.[i]?.price} />
                  </FormField>
                  <FormField label="Cost Price (₹)" error={errors.variants?.[i]?.costPrice?.message}>
                    <TextInput {...register(`variants.${i}.costPrice`)} type="number" min="0" step="0.01" placeholder="0.00" hasError={!!errors.variants?.[i]?.costPrice} />
                  </FormField>
                  <FormField label="Low Stock Threshold" error={errors.variants?.[i]?.lowStockThreshold?.message}>
                    <TextInput {...register(`variants.${i}.lowStockThreshold`)} type="number" min="0" placeholder="10" hasError={!!errors.variants?.[i]?.lowStockThreshold} />
                  </FormField>
                  <FormField label="Reorder Qty" error={errors.variants?.[i]?.reorderQuantity?.message}>
                    <TextInput
                      {...register(`variants.${i}.reorderQuantity`)}
                      type="number"
                      min="1"
                      placeholder="50"
                      hasError={!!errors.variants?.[i]?.reorderQuantity}
                    />
                  </FormField>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <SubmitBtn loading={loading}>{isEdit ? 'Save changes' : 'Create product'}</SubmitBtn>
          <Link to="/products" className="btn-ghost">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
