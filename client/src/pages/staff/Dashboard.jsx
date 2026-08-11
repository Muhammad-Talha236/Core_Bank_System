import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/ui/StatCard';

export default function Dashboard() {
  const { employee } = useAuth();
  return employee.role === 'SuperAdmin' ? <SuperAdminDashboard /> : <StandardDashboard />;
}

function SuperAdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [customersRes, accountsRes, employeesRes, branchesRes] = await Promise.all([
          api.get('/customers'), api.get('/accounts'), api.get('/employees'), api.get('/branches'),
        ]);
        const customers = customersRes.data, accounts = accountsRes.data, employees = employeesRes.data, branches = branchesRes.data;
        const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.Balance), 0);
        const byBranch = branches.map((b) => ({
          branchId: b.BranchID, name: b.BranchName, code: b.BranchCode,
          customers: customers.filter((c) => c.BranchID === b.BranchID).length,
          accounts: accounts.filter((a) => a.BranchID === b.BranchID).length,
          balance: accounts.filter((a) => a.BranchID === b.BranchID).reduce((s, a) => s + parseFloat(a.Balance), 0),
        }));
        const roleCounts = employees.reduce((acc, e) => { acc[e.RoleName] = (acc[e.RoleName] || 0) + 1; return acc; }, {});
        setData({
          totalCustomers: customers.length, totalAccounts: accounts.length, totalBalance,
          totalEmployees: employees.length, totalBranches: branches.length, byBranch, roleCounts,
          lockedCount: employees.filter((e) => e.Status === 'Locked').length,
          suspendedCount: employees.filter((e) => e.Status === 'Suspended').length,
        });
      } catch { setError('Could not load system overview.'); }
    }
    load();
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div className="mb-8 animate-fade-up">
        <p className="eyebrow mb-1">System-Wide</p>
        <h1 className="font-display text-3xl text-ink-900">SuperAdmin Overview</h1>
        <p className="text-slate-soft mt-1">Activity and headcount across every branch in the network.</p>
      </div>

      {error && <p className="text-ledger-red">{error}</p>}

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[
              { label: 'Total Balance', accent: 'green', value: `Rs ${data.totalBalance.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`, sub: 'Across all branches' },
              { label: 'Total Accounts', accent: 'navy', value: data.totalAccounts, sub: `${data.totalCustomers} customers` },
              { label: 'Branches', accent: 'brass', value: data.totalBranches, sub: 'Active network locations' },
              { label: 'Employees', accent: data.lockedCount + data.suspendedCount > 0 ? 'red' : 'navy', value: data.totalEmployees, sub: data.lockedCount + data.suspendedCount > 0 ? `${data.lockedCount} locked · ${data.suspendedCount} suspended` : 'All active' },
            ].map((s, i) => (
              <div key={s.label} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <StatCard label={s.label} accent={s.accent} value={s.value} sublabel={s.sub} />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 panel overflow-hidden animate-fade-up" style={{ animationDelay: '240ms' }}>
              <div className="panel-header">
                <div>
                  <p className="eyebrow mb-1">Branch Performance</p>
                  <p className="font-display text-lg text-ink-900">Balance & Volume by Branch</p>
                </div>
              </div>
              <table className="w-full ledger-table">
                <thead>
                  <tr className="bg-ink-900 text-paper text-left text-xs font-mono uppercase tracking-wide">
                    <th className="px-5 py-3 font-medium">Branch</th>
                    <th className="px-5 py-3 font-medium">Customers</th>
                    <th className="px-5 py-3 font-medium">Accounts</th>
                    <th className="px-5 py-3 font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byBranch.map((b) => (
                    <tr key={b.branchId} className="text-sm">
                      <td className="px-5 py-3">
                        <p className="font-medium text-ink-900">{b.name}</p>
                        <p className="font-mono text-[11px] text-slate-soft">{b.code}</p>
                      </td>
                      <td className="px-5 py-3">{b.customers}</td>
                      <td className="px-5 py-3">{b.accounts}</td>
                      <td className="px-5 py-3 font-mono">Rs {b.balance.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                  {data.byBranch.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-soft">No branches yet.</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="lg:col-span-2 panel p-6 animate-fade-up" style={{ animationDelay: '300ms' }}>
              <p className="eyebrow mb-1">Staff Composition</p>
              <p className="font-display text-lg text-ink-900 mb-5">Employees by Role</p>
              <div className="space-y-3">
                {Object.entries(data.roleCounts).sort((a, b) => b[1] - a[1]).map(([role, count]) => {
                  const pct = Math.round((count / data.totalEmployees) * 100);
                  return (
                    <div key={role}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate font-medium">{role}</span>
                        <span className="font-mono text-slate-soft">{count}</span>
                      </div>
                      <div className="h-1.5 bg-paper rounded-full overflow-hidden">
                        <div className="h-full bg-brass rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StandardDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStats() {
      try {
        const [customersRes, accountsRes] = await Promise.all([api.get('/customers'), api.get('/accounts')]);
        const totalBalance = accountsRes.data.reduce((sum, a) => sum + parseFloat(a.Balance), 0);
        setStats({ totalCustomers: customersRes.data.length, totalAccounts: accountsRes.data.length, totalBalance });
      } catch { setError('Could not load dashboard data.'); }
    }
    loadStats();
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div className="mb-8 animate-fade-up">
        <p className="eyebrow mb-1">Overview</p>
        <h1 className="font-display text-3xl text-ink-900">Dashboard</h1>
        <p className="text-slate-soft mt-1">Overview of your branch's activity.</p>
      </div>

      {error && <p className="text-ledger-red">{error}</p>}

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { label: 'Total Customers', accent: 'navy', value: stats.totalCustomers },
            { label: 'Total Accounts', accent: 'brass', value: stats.totalAccounts },
            { label: 'Total Balance', accent: 'green', value: `Rs ${stats.totalBalance.toLocaleString('en-PK', { minimumFractionDigits: 2 })}` },
          ].map((s, i) => (
            <div key={s.label} className="animate-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
              <StatCard label={s.label} accent={s.accent} value={s.value} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}