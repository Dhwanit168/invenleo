import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { purchaseService } from '../services/purchaseService'
import { supplierService } from '../services/supplierService'
import { variantService } from '../services/variantService'
import { productService } from '../services/productService'
import { FormField, TextInput, SubmitBtn, CustomDropdown } from '../components/FormComponents'
import PageHeader from '../components/PageHeader'

const itemSchema = z.object({
  product: z.string().min(1, 'Select a product'),
  variant: z.string().min(1, 'Select a variant'),
  quantity: z.coerce.number().min(1, 'At least 1'),
  unitCost: z.preprocess(
    (value) => (value === '' || value == null ? undefined : value),
    z.coerce.number().min(0).optional()
  ),
})

const schema = z.object({
  supplier: z.string().min(1, 'Supplier is required'),
  invoiceNumber: z.string().optional(),
  status: z.string().default('received'),
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

export default function NewPurchasePage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, control, setValue, getValues, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { items: [{ product: '', variant: '', quantity: 1, unitCost: '' }], status: 'received' },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const { selections, ensureLength, setProductId, setVariants } = useItemSelections(fields.length)

  useEffect(() => { ensureLength(fields.length) }, [fields.length, ensureLength])

const fetchData = useCallback(() => {
    Promise.all([
      supplierService.getAll({ limit: 200 }),
      productService.getAll({ limit: 500, isActive: true }),
    ]).then(([sup, prod]) => {
      setSuppliers(sup.data.suppliers || [])
      setProducts(Array.isArray(prod.data) ? prod.data : prod.data.products || [])
    }).catch(() => {})
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleProductChange = useCallback(async (index, productId, onVariantChange) => {
    setProductId(index, productId)
    onVariantChange('')
    setValue(`items.${index}.unitCost`, undefined, { shouldValidate: true, shouldDirty: true })

    if (!productId) return

    try {
      const { data } = await variantService.getByProduct(productId)
      const list = Array.isArray(data) ? data : data.variants || []
      setVariants(index, list)
    } catch {
      setVariants(index, [])
      toast.error('Failed to load variants')
    }
  }, [setProductId, setValue, setVariants])

  const buildVariantOptions = (rowVariants) =>
    rowVariants.map(v => ({
      value: v._id,
      label: [
        v.color && v.size
          ? `${v.color} / ${v.size}`
          : v.color || v.size || v.sku,
        `- ${v.quantity} in stock`,
      ].join(' '),
    }))

  const resolveUnitCost = useCallback((productId, variantId, rowVariants = []) => {
    const selectedVariant = rowVariants.find(v => v._id === variantId)
    const selectedProduct = products.find(p => p._id === productId)

    if (selectedVariant && Number(selectedVariant.costPrice) > 0) {
      return selectedVariant.costPrice
    }

    if (selectedProduct?.baseCostPrice != null) {
      return selectedProduct.baseCostPrice
    }

    if (selectedVariant?.costPrice != null) {
      return selectedVariant.costPrice
    }

    return undefined
  }, [products])

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      items: values.items.map(({ product, unitCost, ...rest }, index) => ({
        ...rest,
        ...(unitCost != null ? { unitCost } : {}),
        ...(unitCost == null ? { unitCost: resolveUnitCost(product, rest.variant, selections[index]?.variants || []) } : {}),
      })),
    }

    setLoading(true)
    try {
      await purchaseService.create(payload)
      toast.success('Purchase order created!')
      navigate('/purchases')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create purchase')
    } finally {
      setLoading(false)
    }
  }

  const productOptions = products.map(p => ({ value: p._id, label: p.name }))
  const supplierOptions = suppliers.map(s => ({ value: s._id, label: s.name }))

const handleAddSupplier = useCallback(() => {
    navigate('/suppliers/new', { state: { returnTo: '/purchases/new' } })
  }, [navigate])

  const handleAddProduct = useCallback(() => {
    navigate('/products/new', { state: { returnTo: '/purchases/new' } })
  }, [navigate])

  return (
    <div>
      <div className="mb-4">
        <Link to="/purchases" className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand-orange no-underline">
          <ArrowLeft size={14} /> Back to purchases
        </Link>
      </div>

      <PageHeader title="New Purchase Order" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
        <div className="card p-6 space-y-4">
          <p className="text-sm font-bold text-text-primary">Purchase Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Supplier" error={errors.supplier?.message}>
              <Controller
                name="supplier"
                control={control}
                render={({ field }) => (
                  <CustomDropdown
                    value={field.value}
                    onChange={field.onChange}
                    options={supplierOptions}
                    placeholder="Select supplier"
                    hasError={!!errors.supplier}

                    actionOption={{
                      label: 'Add Supplier',
                      onClick: handleAddSupplier,
                    }}
                  />
                )}
              />
            </FormField>
            <FormField label="Invoice Number">
              <TextInput {...register('invoiceNumber')} placeholder="e.g. INV-2024-001" />
            </FormField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Status">
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <CustomDropdown
                    value={field.value}
                    onChange={field.onChange}
                    options={[
                      { value: 'received', label: 'Received (stock updated)' },
                      { value: 'pending', label: 'Pending' },
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
              onClick={() => append({ product: '', variant: '', quantity: 1, unitCost: '' })}
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

              return (
                <div key={field.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_80px_100px_auto] gap-3 items-end p-3 rounded-xl bg-surface border border-border">
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
                              actionOption={{
                                label: 'Add Product',
                                onClick: handleAddProduct,
                              }}
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
                          onChange={(variantId) => {
                            variantField.onChange(variantId)
                            const currentUnitCost = getValues(`items.${i}.unitCost`)

                            if (currentUnitCost == null || currentUnitCost === '') {
                              const nextUnitCost = resolveUnitCost(
                                sel.productId,
                                variantId,
                                sel.variants
                              )

                              if (nextUnitCost != null) {
                                setValue(`items.${i}.unitCost`, nextUnitCost, {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                })
                              }
                            }
                          }}
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
                    <TextInput {...register(`items.${i}.quantity`)} type="number" min="1" placeholder="1" />
                  </FormField>

                  <FormField label="Unit Cost (Rs)" labelClassName={i > 0 ? 'sm:hidden' : ''}>
                    <TextInput {...register(`items.${i}.unitCost`)} type="number" min="0" step="0.01" placeholder="Auto" />
                  </FormField>

                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="p-2 rounded-lg hover:bg-error-bg text-text-muted hover:text-error-text transition-colors mb-0.5"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <SubmitBtn loading={loading}>Create purchase order</SubmitBtn>
          <Link to="/purchases" className="btn-ghost">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
