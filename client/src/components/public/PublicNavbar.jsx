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
    <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b border-paper-line">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-baseline gap-2" onClick={() => setOpen(false)}>
          <span className="font-display text-xl text-ink-900">Meridian</span>
          <span className="font-mono text-[10px] tracking-[0.25em] text-brass-dark uppercase">Bank</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `text-sm font-medium transition ${isActive ? 'text-ink-900' : 'text-slate-soft hover:text-ink-900'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-5">
          <Link to="/login" className="text-xs font-mono uppercase tracking-wide text-slate-soft hover:text-ink-900 transition">
            Employee Portal
          </Link>
          <Link
            to="/customer/login"
            className="text-sm font-medium text-ink-900 border border-paper-line px-4 py-2 rounded-sm hover:border-ink-900 transition"
          >
            Sign In
          </Link>
          <Link
            to="/customer/register"
            className="text-sm font-medium bg-brass text-ink-900 px-4 py-2 rounded-sm hover:bg-brass-dark transition"
          >
            Register
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5"
        >
          <span className={`block h-[1.5px] w-6 bg-ink-900 transition ${open ? 'translate-y-[6.5px] rotate-45' : ''}`} />
          <span className={`block h-[1.5px] w-6 bg-ink-900 transition ${open ? 'opacity-0' : ''}`} />
          <span className={`block h-[1.5px] w-6 bg-ink-900 transition ${open ? '-translate-y-[6.5px] -rotate-45' : ''}`} />
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-paper-line bg-paper px-6 py-5 space-y-4">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `block text-base font-medium ${isActive ? 'text-ink-900' : 'text-slate-soft'}`}
            >
              {l.label}
            </NavLink>
          ))}
          <div className="pt-3 border-t border-paper-line flex flex-col gap-3">
            <Link to="/login" onClick={() => setOpen(false)} className="text-xs font-mono uppercase tracking-wide text-slate-soft">
              Employee Portal
            </Link>
            <Link
              to="/customer/login"
              onClick={() => setOpen(false)}
              className="text-center text-sm font-medium text-ink-900 border border-paper-line px-4 py-2.5 rounded-sm"
            >
              Sign In
            </Link>
            <Link
              to="/customer/register"
              onClick={() => setOpen(false)}
              className="text-center text-sm font-medium bg-brass text-ink-900 px-4 py-2.5 rounded-sm"
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}