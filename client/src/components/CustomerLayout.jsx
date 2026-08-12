import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext';

const LINKS = [
  { to: '/customer/portal', label: 'Dashboard', end: true },
  { to: '/customer/portal/transfer', label: 'Send Money' },
  { to: '/customer/portal/bills', label: 'Bill Payments' },
  { to: '/customer/portal/security', label: 'Security' },
];

function initials(name = '') {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'U';
}

export default function CustomerLayout() {
  const { customer, logout } = useCustomerAuth();
  const [userOpen, setUserOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const userRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onClick(e) {
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const linkClass = ({ isActive }) =>
    `relative px-3.5 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
      isActive ? 'text-ink-900' : 'text-slate-soft hover:text-ink-900 hover:bg-ink-50'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-paper-line shadow-sm">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 shrink-0 cursor-pointer select-none" onClick={() => navigate('/customer/portal')}>
            <div className="w-8 h-8 rounded-md bg-ink-900 flex items-center justify-center">
              <span className="font-display text-brass text-base font-bold">M</span>
            </div>
            <div className="hidden sm:block leading-none">
              <p className="font-display text-base text-ink-900">Meridian Bank</p>
              <p className="font-mono text-[9px] tracking-widest text-brass-dark uppercase mt-0.5">Online Banking</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
                {({ isActive }) => (
                  <>
                    {link.label}
                    <span
                      className="absolute left-3.5 right-3.5 -bottom-[1px] h-[2px] bg-brass rounded-full origin-left transition-transform duration-200"
                      style={{ transform: isActive ? 'scaleX(1)' : 'scaleX(0)' }}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block" ref={userRef}>
              <button onClick={() => setUserOpen((v) => !v)} className="flex items-center gap-2.5 pl-2 pr-1 py-1 rounded-full hover:bg-ink-50 transition-colors">
                <div className="text-right leading-none hidden md:block">
                  <p className="text-sm font-medium text-ink-900">{customer?.name}</p>
                  <p className="font-mono text-[10px] text-brass-dark uppercase tracking-wide mt-0.5">Online Client</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-ink-900 border-2 border-brass/40 flex items-center justify-center shrink-0">
                  <span className="font-mono text-xs text-brass font-semibold">{initials(customer?.name)}</span>
                </div>
              </button>
              {userOpen && (
                <div className="animate-slide-down absolute top-full right-0 mt-2 w-52 bg-white border border-paper-line rounded-lg shadow-xl py-1.5 overflow-hidden">
                  <NavLink to="/customer/portal/security" onClick={() => setUserOpen(false)} className="block px-4 py-2.5 text-sm text-slate hover:bg-ink-50 transition-colors">
                    Security Settings
                  </NavLink>
                  <button onClick={logout} className="w-full text-left px-4 py-2.5 text-sm text-ledger-red hover:bg-ledger-red-100 transition-colors">
                    Sign out
                  </button>
                </div>
              )}
            </div>

            <button onClick={() => setMobileOpen((v) => !v)} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-md hover:bg-ink-50 transition-colors" aria-label="Menu">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="#0B1F3A" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden animate-slide-down border-t border-paper-line bg-white px-4 py-3 space-y-1">
            {LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `block px-3 py-2.5 rounded-md text-sm font-medium ${isActive ? 'bg-brass-100 text-brass-dark' : 'text-slate hover:bg-ink-50'}`}>
                {link.label}
              </NavLink>
            ))}
            <div className="pt-2 mt-2 border-t border-paper-line flex items-center justify-between">
              <p className="text-sm font-medium text-ink-900">{customer?.name}</p>
              <button onClick={logout} className="text-sm text-ledger-red font-medium">Sign out</button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-[1300px] w-full mx-auto px-6 py-8 flex-1">
        <Outlet />
      </main>
    </div>
  );
}