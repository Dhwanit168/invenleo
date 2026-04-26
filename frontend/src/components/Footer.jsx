import { Link } from 'react-router-dom'
import logo from '../assets/logo.jpg'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <img src={logo} alt="Leo Data Tech" className="w-7 h-7 object-contain rounded-md border border-border p-0.5" />
            <span className="font-display text-sm font-bold text-text-primary">
              Inven<span className="text-brand-orange">Leo</span>
            </span>
          </Link>
          <p className="text-sm text-text-secondary">
            © 2024 Leo Data Tech. All rights reserved.
          </p>
          <div className="flex gap-5">
            {['Privacy', 'Terms', 'Contact'].map(l => (
              <a key={l} href="#" className="text-xs text-text-muted hover:text-text-secondary no-underline transition-colors">
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
