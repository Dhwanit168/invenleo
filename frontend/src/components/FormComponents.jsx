import { forwardRef, useState, useEffect, useRef } from 'react'
import { Eye, EyeOff, CheckCircle2, Circle, AlertCircle, CheckCheck, ChevronDown, Plus } from 'lucide-react'

export function FormField({ label, error, hint, children, className = '', labelClassName = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className={`text-sm font-medium text-text-primary ${labelClassName}`}>{label}</label>}
      {children}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-error-text">
          <AlertCircle size={12} className="shrink-0" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-text-muted">{hint}</p>
      )}
    </div>
  )
}

export const TextInput = forwardRef(function TextInput(
  { hasError, className = '', ...props }, ref
) {
  return (
    <input
      ref={ref}
      {...props}
      className={`input-base ${hasError ? 'input-error' : ''} ${className}`}
    />
  )
})

export const PasswordInput = forwardRef(function PasswordInput(
  { hasError, ...props }, ref
) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        ref={ref}
        {...props}
        type={show ? 'text' : 'password'}
        className={`input-base pr-11 ${hasError ? 'input-error' : ''}`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow(s => !s)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
})

export function SubmitBtn({ loading, children, className = '' }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={`btn-primary w-full flex items-center justify-center gap-2
        ${loading ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Please wait…
        </>
      ) : children}
    </button>
  )
}

export function Divider({ text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-text-muted whitespace-nowrap">{text}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

export function SuccessAlert({ message }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-3 bg-success-bg border border-success-border rounded-xl text-sm text-success-text">
      <CheckCheck size={16} className="shrink-0 text-success-dot" />
      {message}
    </div>
  )
}

export const PASSWORD_CHECKS = [
  { label: '6+ characters',     test: pw => pw.length >= 6 },
  { label: 'Uppercase letter',  test: pw => /[A-Z]/.test(pw) },
  { label: 'Number',            test: pw => /[0-9]/.test(pw) },
  { label: 'Special character', test: pw => /[^A-Za-z0-9]/.test(pw) },
]

const STRENGTH_META = [
  { label: '',       color: 'bg-border',          textColor: 'text-text-muted'      },
  { label: 'Weak',   color: 'bg-red-400',          textColor: 'text-red-500'         },
  { label: 'Fair',   color: 'bg-amber-400',        textColor: 'text-amber-600'       },
  { label: 'Good',   color: 'bg-brand-blue',       textColor: 'text-brand-blue'      },
  { label: 'Strong', color: 'bg-success-dot',      textColor: 'text-success-text'    },
]

export function PasswordStrength({ password }) {
  if (!password) return null
  const passed = PASSWORD_CHECKS.filter(c => c.test(password)).length
  const meta   = STRENGTH_META[passed] ?? STRENGTH_META[0]

  return (
    <div className="mt-2 space-y-2">
      {}
      <div className="flex gap-1 h-1.5">
        {[1, 2, 3, 4].map(n => (
          <div
            key={n}
            className={`flex-1 rounded-full transition-colors duration-300 ${n <= passed ? meta.color : 'bg-border'}`}
          />
        ))}
      </div>
      {meta.label && (
        <p className={`text-xs font-semibold ${meta.textColor}`}>
          {meta.label} password
        </p>
      )}
      {}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-0.5">
        {PASSWORD_CHECKS.map(c => {
          const ok = c.test(password)
          return (
            <span
              key={c.label}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors
                ${ok ? 'text-success-text' : 'text-text-muted'}`}
            >
              {ok
                ? <CheckCircle2 size={12} className="shrink-0 text-success-dot" />
                : <Circle       size={12} className="shrink-0" />
              }
              {c.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export const CustomDropdown = ({
  value,
  onChange,
  options = [],
  className = '',
  placeholder = 'Select...',
  hasError,
  disabled = false,
  actionOption,        // ← NEW: { label, onClick }
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

useEffect(() => { if (disabled) setIsOpen(false) }, [disabled])

  const selectedOption = options.find(o => String(o.value) === String(value))

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 border rounded-xl text-left outline-none transition-all flex items-center justify-between text-sm shadow-sm
          ${disabled
            ? 'bg-surface border-border text-text-muted cursor-not-allowed opacity-60'
            : hasError
              ? 'bg-white border-error-text ring-2 ring-error-text/15 cursor-pointer'
              : 'bg-white border-border hover:border-border-hover focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 cursor-pointer'
          }`}
      >
        <span className={`truncate ${selectedOption ? 'text-text-primary' : 'text-text-muted'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={`shrink-0 text-text-muted transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-border rounded-xl shadow-card overflow-hidden">
          <div className="max-h-60 overflow-y-auto py-1">
            {options.length === 0 && !actionOption && (
              <div className="px-4 py-3 text-sm text-text-muted text-center italic">{placeholder}</div>
            )}
            {options.map((opt) => {
              const isSelected = String(value) === String(opt.value)
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setIsOpen(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-150 ${isSelected ? 'bg-brand-orange text-white font-semibold' : 'text-text-secondary hover:bg-surface hover:text-text-primary'}`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>

          {}
          {actionOption && (
            <div className="border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  actionOption.onClick()
                }}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-brand-orange hover:bg-orange-50 transition-colors flex items-center gap-2"
              >
                <Plus size={14} className="shrink-0" />
                {actionOption.label}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
