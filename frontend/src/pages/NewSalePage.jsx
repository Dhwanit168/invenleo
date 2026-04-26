import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { saleService } from '../services/saleService'
import { variantService } from '../services/variantService'
import { productService } from '../services/productService'
import { FormField, TextInput, SubmitBtn, CustomDropdown } from '../components/FormComponents'
import PageHeader from '../components/PageHeader'

const itemSchema = z.object({
  product: z.string().min(1, 'Select a product'),
  variant: z.string().min(1, 'Select a variant'),
  quantity: z.coerce.number().min(1, 'At least 1'),
})

const schema = z.object({
  customer: z.string().optional(),
  paymentMethod: z.string().default('cash'),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Add at least one item'),
})

function useItemSelections(fieldCount) {
  const [selections, setSelections] = useState(() =>
    Array.from({ length: fieldCount }, () => ({ productId: '', variants: [], loadingVariants: false }))
  )

  const ensureLength = useCallback((len) => {
    setSelections(prev => {
      if (prev.length === len) return prev
      if (prev.length < len) {
        return [...prev, ...Array.from({ length: len - prev.length }, () => ({ productId: '', variants: [], loadingVariants: false }))]
      }
      return prev.slice(0, len)
    })
  }, [])

  const setProductId = useCallback((index, productId) => {
    setSelections(prev => {
      const next = [...prev]
      next[index] = { productId, variants: [], loadingVariants: !!productId }
      return next
    })
  }, [])

  const setVariants = useCallback((index, variants) => {
    setSelections(prev => {
      const next = [...prev]
      next[index] = { ...next[index], variants, loadingVariants: false }
      return next
    })
  }, [])

  return { selections, ensureLength, setProductId, setVariants }
}

export default function NewSalePage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { items: [{ product: '', variant: '', quantity: 1 }], paymentMethod: 'cash' },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const { selections, ensureLength, setProductId, setVariants } = useItemSelections(fields.length)

  useEffect(() => { ensureLength(fields.length) }, [fields.length, ensureLength])

  useEffect(() => {
    productService.getAll({ limit: 500, isActive: true })
      .then(({ data }) => setProducts(Array.isArray(data) ? data : data.products || []))
      .catch(() => {})
  }, [])

  const handleProductChange = useCallback(async (index, productId, onVariantChange) => {
    setProductId(index, productId)
    onVariantChange('')

    if (!productId) return

    try {
      const { data } = await variantService.getByProduct(productId)
      const list = Array.isArray(data) ? data : data.variants || []
      setVariants(index, list)
    } catch {
      setVariants(index, [])
      toast.error('Failed to load variants')
    }
  }, [setProductId, setVariants])

  const buildVariantOptions = (rowVariants) => {
    if (rowVariants.length === 0) return []

    return rowVariants.filter(v => v.quantity > 0).map(v => ({
      value: v._id,
      label: [
        v.color && v.size ? `${v.color} / ${v.size}` : v.color || v.size || v.sku,
        `- ${v.quantity} in stock`,
      ].join(' '),
    }))
  }

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      items: values.items.map(({ product: _p, ...rest }) => rest),
    }

    setLoading(true)
    try {
      await saleService.create(payload)
      toast.success('Sale recorded successfully!')
      navigate('/sales')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create sale')
    } finally {
      setLoading(false)
    }
  }

  const productOptions = products.map(p => ({ value: p._id, label: p.name }))

  return (
    <div>
      <div className="mb-4">
        <Link to="/sales" className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand-orange no-underline">
          <ArrowLeft size={14} /> Back to sales
        </Link>
      </div>

      <PageHeader title="New Sale" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
        <div className="card p-6 space-y-4">
          <p className="text-sm font-bold text-text-primary">Sale Info</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Customer name">
              <TextInput {...register('customer')} placeholder="Walk-in Customer" />
            </FormField>
            <FormField label="Payment method">
              <Controller
                name="paymentMethod"
                control={control}
                render={({ field }) => (
                  <CustomDropdown
                    value={field.value}
                    onChange={field.onChange}
                    options={[
                      { value: 'cash', label: 'Cash' },
                      { value: 'card', label: 'Card' },
                      { value: 'bank_transfer', label: 'Bank Transfer' },
                      { value: 'other', label: 'Other' },
                    ]}
                  />
                )}
              />
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea {...register('notes')} rows={2} placeholder="Optional notes..." className="input-base resize-none" />
          </FormField>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-text-primary">Items</p>
            <button
              type="button"
              onClick={() => append({ product: '', variant: '', quantity: 1 })}
              className="btn-ghost flex items-center gap-2 text-xs py-1.5 px-3"
            >
              <Plus size={13} /> Add item
            </button>
          </div>

          {errors.items?.root && (
            <p className="text-xs text-error-text mb-3">{errors.items.root.message}</p>
          )}

          <div className="space-y-4">
            {fields.map((field, i) => {
              const sel = selections[i] ?? { productId: '', variants: [], loadingVariants: false }
              const variantOptions = buildVariantOptions(sel.variants)
              const variantDisabled = !sel.productId || sel.loadingVariants
              const currentVariantId = watch(`items.${i}.variant`)

              return (
                <div key={field.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_80px_auto] gap-3 items-end p-3 rounded-xl bg-surface border border-border">
                  <Controller
                    name={`items.${i}.product`}
                    control={control}
                    render={({ field: productField }) => (
                      <Controller
                        name={`items.${i}.variant`}
                        control={control}
                        render={({ field: variantField }) => (
                          <FormField
                            label="Product"
                            labelClassName={i > 0 ? 'sm:hidden' : ''}
                            error={errors.items?.[i]?.product?.message}
                          >
                            <CustomDropdown
                              value={productField.value}
                              onChange={(pid) => {
                                productField.onChange(pid)
                                handleProductChange(i, pid, variantField.onChange)
                              }}
                              placeholder="Select product"
                              hasError={!!errors.items?.[i]?.product}
                              options={productOptions}
                            />
                          </FormField>
                        )}
                      />
                    )}
                  />

                  <Controller
                    name={`items.${i}.variant`}
                    control={control}
                    render={({ field: variantField }) => (
                      <FormField
                        label="Variant"
                        labelClassName={i > 0 ? 'sm:hidden' : ''}
                        error={errors.items?.[i]?.variant?.message}
                      >
                        <CustomDropdown
                          value={variantField.value}
                          onChange={variantField.onChange}
                          placeholder={
                            !sel.productId ? 'Select product first'
                            : sel.loadingVariants ? 'Loading...'
                            : variantOptions.length === 0 ? 'No variants available'
                            : 'Select variant'
                          }
                          hasError={!!errors.items?.[i]?.variant}
                          options={variantDisabled ? [] : variantOptions}
                          disabled={variantDisabled}
                        />
                      </FormField>
                    )}
                  />

                  <FormField label="Qty" labelClassName={i > 0 ? 'sm:hidden' : ''} error={errors.items?.[i]?.quantity?.message}>
                    <TextInput {...register(`items.${i}.quantity`)} type="number" min="1" max={sel.variants.find(v => v._id === currentVariantId)?.quantity || undefined} placeholder="1" />
                  </FormField>

                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="mb-0.5 p-2 rounded-lg hover:bg-error-bg text-text-muted hover:text-error-text transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <SubmitBtn loading={loading}>Record sale</SubmitBtn>
          <Link to="/sales" className="btn-ghost">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
