import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatWidget from './ChatWidget';

const PRIMARY_LINKS = [
  { to: '/dashboard', label: 'Dashboard', roles: null, end: true },
  {
    to: '/dashboard/customers',
    label: 'Customers',
    roles: ['SuperAdmin', 'Admin', 'BranchManager', 'Teller', 'Auditor'],
  },
  {
    to: '/dashboard/accounts',
    label: 'Accounts',
    roles: ['SuperAdmin', 'Admin', 'BranchManager', 'Teller', 'Auditor'],
  },
  {
    to: '/dashboard/transactions',
    label: 'Transactions',
    roles: ['SuperAdmin', 'Admin', 'BranchManager', 'Teller'],
  },
  {
    to: '/dashboard/approvals',
    label: 'Approvals',
    roles: ['SuperAdmin', 'Admin', 'BranchManager'],
  },
  {
    to: '/dashboard/audit',
    label: 'Audit Log',
    roles: ['SuperAdmin', 'Admin', 'BranchManager', 'Auditor'],
  },
];

const ADMIN_LINKS = [
  { to: '/dashboard/employees', label: 'Employees' },
  { to: '/dashboard/branches', label: 'Branches' },
  { to: '/dashboard/settings', label: 'System Settings' },
];

function initials(name = '') {
  const parts = name.trim().split(/\s+/);

  return (
    ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'U'
  );
}

export default function Layout() {
  const { employee, logout } = useAuth();

  const isSuperAdmin = employee.role === 'SuperAdmin';

  const [adminOpen, setAdminOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const adminRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (
        adminRef.current &&
        !adminRef.current.contains(e.target)
      ) {
        setAdminOpen(false);
      }

      if (
        userRef.current &&
        !userRef.current.contains(e.target)
      ) {
        setUserOpen(false);
      }
    }

    document.addEventListener('mousedown', onClick);

    return () => {
      document.removeEventListener('mousedown', onClick);
    };
  }, []);

  const visibleLinks = PRIMARY_LINKS.filter(
    (link) =>
      !link.roles || link.roles.includes(employee.role)
  );

  const linkClass = ({ isActive }) =>
    `relative px-3.5 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
      isActive
        ? 'text-ink-900'
        : 'text-slate-soft hover:text-ink-900 hover:bg-ink-50'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-paper">

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-paper-line shadow-sm">

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">

            <div className="w-8 h-8 rounded-md bg-ink-900 flex items-center justify-center">
              <span className="font-display text-brass text-base font-bold">
                M
              </span>
            </div>

            <div className="hidden sm:block leading-none">
              <p className="font-display text-base text-ink-900">
                Meridian Bank
              </p>

              <p className="font-mono text-[9px] tracking-widest text-brass-dark uppercase mt-0.5">
                Core Banking
              </p>
            </div>

          </div>

          {/* Primary nav - desktop */}
          <nav className="hidden lg:flex items-center gap-1">

            {visibleLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={linkClass}
              >
                {({ isActive }) => (
                  <>
                    {link.label}

                    <span
                      className="absolute left-3.5 right-3.5 -bottom-[1px] h-[2px] bg-brass rounded-full origin-left transition-transform duration-200"
                      style={{
                        transform: isActive
                          ? 'scaleX(1)'
                          : 'scaleX(0)',
                      }}
                    />
                  </>
                )}
              </NavLink>
            ))}

            {/* Admin dropdown */}
            {isSuperAdmin && (
              <div
                className="relative"
                ref={adminRef}
              >
                <button
                  onClick={() =>
                    setAdminOpen((v) => !v)
                  }
                  className={`flex items-center gap-1 px-3.5 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                    adminOpen
                      ? 'text-ink-900 bg-ink-50'
                      : 'text-slate-soft hover:text-ink-900 hover:bg-ink-50'
                  }`}
                >
                  Admin

                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 12 12"
                    className={`transition-transform duration-200 ${
                      adminOpen ? 'rotate-180' : ''
                    }`}
                  >
                    <path
                      d="M2 4l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>

                {adminOpen && (
                  <div className="animate-slide-down absolute top-full right-0 mt-2 w-48 bg-white border border-paper-line rounded-lg shadow-xl py-1.5 overflow-hidden">

                    {ADMIN_LINKS.map((link) => (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        onClick={() => setAdminOpen(false)}
                        className={({ isActive }) =>
                          `block px-4 py-2.5 text-sm transition-colors ${
                            isActive
                              ? 'bg-brass-100 text-brass-dark font-medium'
                              : 'text-slate hover:bg-ink-50'
                          }`
                        }
                      >
                        {link.label}
                      </NavLink>
                    ))}

                  </div>
                )}
              </div>
            )}

          </nav>

          {/* Right: user menu */}
          <div className="flex items-center gap-3">

            <div
              className="relative hidden sm:block"
              ref={userRef}
            >
              <button
                onClick={() =>
                  setUserOpen((v) => !v)
                }
                className="flex items-center gap-2.5 pl-2 pr-1 py-1 rounded-full hover:bg-ink-50 transition-colors"
              >

                <div className="text-right leading-none hidden md:block">
                  <p className="text-sm font-medium text-ink-900">
                    {employee.name}
                  </p>

                  <p className="font-mono text-[10px] text-brass-dark uppercase tracking-wide mt-0.5">
                    {employee.role}
                  </p>
                </div>

                <div className="w-9 h-9 rounded-full bg-ink-900 border-2 border-brass/40 flex items-center justify-center shrink-0">
                  <span className="font-mono text-xs text-brass font-semibold">
                    {initials(employee.name)}
                  </span>
                </div>

              </button>

              {userOpen && (
                <div className="animate-slide-down absolute top-full right-0 mt-2 w-56 bg-white border border-paper-line rounded-lg shadow-xl py-1.5 overflow-hidden">

                  <div className="px-4 py-3 border-b border-paper-line">
                    <p className="text-sm font-medium text-ink-900">
                      {employee.name}
                    </p>

                    <p className="text-xs text-slate-soft">
                      {employee.branchName || 'All Branches'}
                    </p>
                  </div>

                  <NavLink
                    to="/dashboard/change-password"
                    onClick={() => setUserOpen(false)}
                    className="block px-4 py-2.5 text-sm text-slate hover:bg-ink-50 transition-colors"
                  >
                    Change Password
                  </NavLink>

                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2.5 text-sm text-ledger-red hover:bg-ledger-red-100 transition-colors"
                  >
                    Sign out
                  </button>

                </div>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() =>
                setMobileOpen((v) => !v)
              }
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-md hover:bg-ink-50 transition-colors"
              aria-label="Menu"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M3 5h14M3 10h14M3 15h14"
                  stroke="#0B1F3A"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>

          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="lg:hidden animate-slide-down border-t border-paper-line bg-white px-4 py-3 space-y-1">

            {visibleLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2.5 rounded-md text-sm font-medium ${
                    isActive
                      ? 'bg-brass-100 text-brass-dark'
                      : 'text-slate hover:bg-ink-50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            {/* Admin links on mobile */}
            {isSuperAdmin &&
              ADMIN_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2.5 rounded-md text-sm font-medium ${
                      isActive
                        ? 'bg-brass-100 text-brass-dark'
                        : 'text-slate hover:bg-ink-50'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}

            {/* Mobile user section */}
            <div className="pt-2 mt-2 border-t border-paper-line flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-ink-900">
                  {employee.name}
                </p>

                <p className="font-mono text-[10px] text-brass-dark uppercase">
                  {employee.role}
                </p>
              </div>

              <button
                onClick={logout}
                className="text-sm text-ledger-red font-medium"
              >
                Sign out
              </button>

            </div>

          </div>
        )}

      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      <ChatWidget />
    </div>
  );
}