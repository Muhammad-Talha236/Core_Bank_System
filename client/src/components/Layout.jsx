import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatWidget from './ChatWidget';
const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', roles: null },
  { to: '/dashboard/customers', label: 'Customers', roles: ['SuperAdmin', 'Admin', 'BranchManager', 'Teller', 'Auditor'] },
  { to: '/dashboard/accounts', label: 'Accounts', roles: ['SuperAdmin', 'Admin', 'BranchManager', 'Teller', 'Auditor'] },
  { to: '/dashboard/transactions', label: 'Transactions', roles: ['SuperAdmin', 'Admin', 'BranchManager', 'Teller'] },
  { to: '/dashboard/approvals', label: 'Pending Approvals', roles: ['SuperAdmin', 'Admin', 'BranchManager'] },
  { to: '/dashboard/audit', label: 'Audit Log', roles: ['SuperAdmin', 'Admin', 'BranchManager', 'Auditor'] },
  { to: '/dashboard/employees', label: 'Employees', roles: ['SuperAdmin'] },
  { to: '/dashboard/branches', label: 'Branches', roles: ['SuperAdmin'] },
];

export default function Layout() {
  const { employee, logout } = useAuth();

  const visibleItems = NAV_ITEMS.filter(item => !item.roles || item.roles.includes(employee.role));

  return (
    <div className="h-screen flex bg-paper overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-ink-900 flex flex-col shrink-0 h-full overflow-y-auto">
        <div className="px-6 py-6 border-b border-white/10">
          <p className="font-display text-xl text-paper">Meridian Bank</p>
          <p className="font-mono text-[10px] tracking-widest text-brass uppercase mt-1">Core Banking</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-sm text-sm font-medium transition ${
                  isActive
                    ? 'bg-brass text-ink-900'
                    : 'text-paper/70 hover:bg-white/5 hover:text-paper'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-paper text-sm font-medium truncate">{employee.name}</p>
          <p className="font-mono text-[11px] text-brass uppercase tracking-wide">{employee.role}</p>
          {employee.branchName && (
            <p className="text-paper/50 text-xs mt-1">{employee.branchName}</p>
          )}
          <NavLink
            to="/dashboard/change-password"
            className="mt-3 block text-xs text-paper/60 hover:text-brass transition"
          >
            Change Password
          </NavLink>
          <button
            onClick={logout}
            className="mt-2 w-full text-left text-xs text-paper/60 hover:text-ledger-red transition"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto h-full">
        <Outlet />
      </main>
      <ChatWidget />
    </div>
  );
}