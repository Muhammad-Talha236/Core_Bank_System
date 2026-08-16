import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/features', label: 'Features' },
  { to: '/about', label: 'About' },
];

export default function PublicNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-paper-line shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 sm:h-[72px] flex items-center justify-between gap-6">

        {/* Brand */}
        <Link
          to="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2.5 shrink-0 group"
        >
          <div className="w-9 h-9 rounded-md bg-ink-900 flex items-center justify-center shadow-sm transition-transform duration-200 group-hover:scale-105">
            <span className="font-display text-brass text-lg font-bold">
              M
            </span>
          </div>

          <div className="leading-none">
            <p className="font-display text-lg sm:text-xl text-ink-900">
              Meridian Bank
            </p>
            <p className="font-mono text-[8px] sm:text-[9px] tracking-[0.22em] text-brass-dark uppercase mt-1">
              Core Banking
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `relative px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-ink-900'
                    : 'text-slate-soft hover:text-ink-900 hover:bg-ink-50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}

                  <span
                    className={`absolute left-4 right-4 -bottom-[1px] h-[2px] bg-brass rounded-full transition-transform duration-200 origin-left ${
                      isActive ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3 shrink-0">

          <Link
            to="/login"
            className="px-3.5 py-2 text-xs font-mono uppercase tracking-wide text-slate-soft hover:text-ink-900 hover:bg-ink-50 rounded-md transition-all duration-200"
          >
            Employee Portal
          </Link>

          <div className="w-px h-6 bg-paper-line" />

          <Link
            to="/customer/login"
            className="px-4 py-2.5 text-sm font-medium text-ink-900 border border-paper-line rounded-md hover:border-ink-900 hover:bg-ink-50 transition-all duration-200"
          >
            Sign In
          </Link>

          <Link
            to="/customer/register"
            className="px-4 py-2.5 text-sm font-medium bg-brass text-ink-900 rounded-md shadow-sm hover:bg-brass-dark hover:shadow-md transition-all duration-200"
          >
            Register
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-[5px] rounded-md hover:bg-ink-50 transition-colors"
        >
          <span
            className={`block h-[1.5px] w-5 bg-ink-900 transition-all duration-200 ${
              open ? 'translate-y-[6.5px] rotate-45' : ''
            }`}
          />

          <span
            className={`block h-[1.5px] w-5 bg-ink-900 transition-all duration-200 ${
              open ? 'opacity-0 scale-0' : ''
            }`}
          />

          <span
            className={`block h-[1.5px] w-5 bg-ink-900 transition-all duration-200 ${
              open ? '-translate-y-[6.5px] -rotate-45' : ''
            }`}
          />
        </button>
      </div>

      {/* Mobile Navigation */}
      {open && (
        <div className="md:hidden animate-slide-down border-t border-paper-line bg-white/95 backdrop-blur-xl shadow-lg">
          <div className="px-4 sm:px-6 py-5 space-y-1">

            {/* Links */}
            <nav className="space-y-1">
              {LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brass-100 text-brass-dark'
                        : 'text-slate hover:text-ink-900 hover:bg-ink-50'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Actions */}
            <div className="pt-4 mt-3 border-t border-paper-line space-y-2">

              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center w-full px-4 py-3 rounded-md text-xs font-mono uppercase tracking-wide text-slate-soft hover:text-ink-900 hover:bg-ink-50 transition-colors"
              >
                Employee Portal
              </Link>

              <Link
                to="/customer/login"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center w-full px-4 py-3 rounded-md text-sm font-medium text-ink-900 border border-paper-line hover:border-ink-900 hover:bg-ink-50 transition-colors"
              >
                Sign In
              </Link>

              <Link
                to="/customer/register"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center w-full px-4 py-3 rounded-md text-sm font-medium bg-brass text-ink-900 hover:bg-brass-dark transition-colors"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}