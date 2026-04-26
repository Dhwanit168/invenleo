import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import logo from '../assets/logo.jpg'

const navLinks = [
  { id: 'features', label: 'Features' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'about', label: 'About' }
]

export default function Navbar() {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {}
        <Link 
          to="/" 
          onClick={() => pathname === '/' && window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2.5 no-underline shrink-0"
        >
          <img
            src={logo}
            alt="Leo Data Tech"
            className="w-9 h-9 object-contain rounded-lg border border-border p-0.5 bg-white"
          />
          <span className="font-display font-bold text-lg text-text-primary tracking-tight">
            Inven<span className="text-brand-orange">Leo</span> by Leo Data Tech
          </span>
        </Link>

        {}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={(e) => {
                const el = document.getElementById(link.id)
                if (el) {
                  e.preventDefault()
                  el.scrollIntoView({ behavior: 'smooth' })
                }
              }}
              className="px-3.5 py-2 text-sm font-medium text-text-secondary hover:text-brand-orange rounded-lg transition-colors no-underline"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {}
        <div className="hidden md:flex items-center gap-2">
          <Link
            to="/login"
            className={`px-4 py-2 text-sm font-medium rounded-xl border transition-colors no-underline
              ${pathname === '/login'
                ? 'border-brand-orange text-brand-orange bg-brand-orange-light'
                : 'border-border text-text-primary hover:bg-surface'}`}
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors no-underline
              ${pathname === '/register'
                ? 'bg-brand-orange-hover text-white'
                : 'bg-brand-orange hover:bg-brand-orange-hover text-white'}`}
          >
            Get started
          </Link>
        </div>

        {}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-surface transition-colors text-text-primary"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-border px-4 py-4 flex flex-col gap-2">
          {navLinks.map(link => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className="px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-brand-orange rounded-lg no-underline"
              onClick={(e) => {
                setMenuOpen(false)
                const el = document.getElementById(link.id)
                if (el) {
                  e.preventDefault()
                  el.scrollIntoView({ behavior: 'smooth' })
                }
              }}
            >
              {link.label}
            </a>
          ))}
          <div className="border-t border-border pt-3 mt-1 flex flex-col gap-2">
            <Link
              to="/login"
              className="px-4 py-2.5 text-sm font-medium border border-border rounded-xl text-center text-text-primary no-underline hover:bg-surface"
              onClick={() => setMenuOpen(false)}
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="px-4 py-2.5 text-sm font-semibold bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl text-center no-underline"
              onClick={() => setMenuOpen(false)}
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
