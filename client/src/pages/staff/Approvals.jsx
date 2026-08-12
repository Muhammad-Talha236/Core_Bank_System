import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/ui/StatCard';

export default function Dashboard() {
  const { employee } = useAuth();

  return employee.role === 'SuperAdmin'
    ? <SuperAdminDashboard />
    : <StandardDashboard />;
}

/* =========================================================
   SHARED ICONS
========================================================= */

const Icons = {
  wallet: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 7.5A2.5 2.5 0 0 1 6.5 5H20v14H6.5A2.5 2.5 0 0 1 4 16.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M4 8h16v4h-4a2 2 0 0 0 0 4h4"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="16" cy="14" r=".8" fill="currentColor" />
    </svg>
  ),

  users: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3.5 19c.6-3.2 2.4-5 5.5-5s4.9 1.8 5.5 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M15.5 5.5a3 3 0 0 1 0 5.8M16 14c2.4.4 3.8 2 4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  ),

  building: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 20V5.5L13 3v17M13 8h7v12M2 20h20"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M7 8h2M7 12h2M7 16h2M16 11h2M16 15h2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),

  briefcase: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="7"
        width="18"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  ),

  arrow: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12h13m-5-5 5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

/* =========================================================
   SUPER ADMIN
========================================================= */

function SuperAdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [
          customersRes,
          accountsRes,
          employeesRes,
          branchesRes,
        ] = await Promise.all([
          api.get('/customers'),
          api.get('/accounts'),
          api.get('/employees'),
          api.get('/branches'),
        ]);

        const customers = customersRes.data;
        const accounts = accountsRes.data;
        const employees = employeesRes.data;
        const branches = branchesRes.data;

        const totalBalance = accounts.reduce(
          (sum, account) => sum + parseFloat(account.Balance || 0),
          0
        );

        const byBranch = branches.map((branch) => {
          const branchCustomers = customers.filter(
            (customer) => customer.BranchID === branch.BranchID
          );

          const branchAccounts = accounts.filter(
            (account) => account.BranchID === branch.BranchID
          );

          const balance = branchAccounts.reduce(
            (sum, account) => sum + parseFloat(account.Balance || 0),
            0
          );

          return {
            branchId: branch.BranchID,
            name: branch.BranchName,
            code: branch.BranchCode,
            customers: branchCustomers.length,
            accounts: branchAccounts.length,
            balance,
          };
        });

        const roleCounts = employees.reduce((acc, employee) => {
          acc[employee.RoleName] =
            (acc[employee.RoleName] || 0) + 1;

          return acc;
        }, {});

        setData({
          totalCustomers: customers.length,
          totalAccounts: accounts.length,
          totalBalance,
          totalEmployees: employees.length,
          totalBranches: branches.length,
          byBranch,
          roleCounts,
          lockedCount: employees.filter(
            (employee) => employee.Status === 'Locked'
          ).length,
          suspendedCount: employees.filter(
            (employee) => employee.Status === 'Suspended'
          ).length,
        });
      } catch {
        setError('Could not load system overview.');
      }
    }

    load();
  }, []);

  const formatMoney = (value) =>
    value.toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="min-h-full bg-[#f6f7f8]">
      <div className="max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-9">

        {/* =====================================================
            PREMIUM HEADER
        ===================================================== */}

        <section className="relative overflow-hidden rounded-[26px] bg-ink-900 text-white mb-7 shadow-[0_20px_55px_rgba(15,23,42,0.14)] animate-fade-up">

          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)',
              backgroundSize: '36px 36px',
            }}
          />

          <div className="absolute -right-20 -top-32 w-80 h-80 rounded-full border border-white/10" />
          <div className="absolute -right-3 -top-20 w-56 h-56 rounded-full border border-brass/10" />

          <div className="relative p-6 sm:p-8 lg:p-9">

            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-7">

              <div className="flex items-start gap-4">

                <div className="w-12 h-12 rounded-2xl bg-brass text-ink-900 flex items-center justify-center shadow-lg shrink-0">
                  {Icons.building}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-white/40">
                      Executive Console
                    </span>

                    <span className="w-1 h-1 rounded-full bg-white/20" />

                    <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-brass">
                      System Wide
                    </span>
                  </div>

                  <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] leading-none tracking-tight">
                    Network Overview
                  </h1>

                  <p className="text-white/45 text-xs sm:text-sm mt-3 max-w-xl leading-relaxed">
                    A consolidated view of balances, accounts,
                    branches and workforce across the banking network.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">

                <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 min-w-[175px]">
                  <p className="text-[9px] font-mono uppercase tracking-wider text-white/35">
                    Network Status
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="relative flex w-2 h-2">
                      <span className="absolute inset-0 rounded-full bg-ledger-green opacity-40 animate-ping" />
                      <span className="relative w-2 h-2 rounded-full bg-ledger-green" />
                    </span>

                    <span className="text-xs text-white/75">
                      Operational
                    </span>
                  </div>
                </div>

              </div>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-7 pt-4 border-t border-white/10">

              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono uppercase tracking-wider text-white/30">
                  Coverage
                </span>
                <span className="text-[10px] text-white/65">
                  {data?.totalBranches || 0} Branches
                </span>
              </div>

              <span className="text-white/15">•</span>

              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono uppercase tracking-wider text-white/30">
                  Customers
                </span>
                <span className="text-[10px] text-white/65">
                  {data?.totalCustomers || 0}
                </span>
              </div>

              <span className="text-white/15">•</span>

              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono uppercase tracking-wider text-white/30">
                  Accounts
                </span>
                <span className="text-[10px] text-white/65">
                  {data?.totalAccounts || 0}
                </span>
              </div>

              <div className="ml-auto hidden sm:flex items-center gap-2 text-white/30">
                <span className="text-[9px] font-mono uppercase tracking-wider">
                  Executive Access
                </span>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-xl bg-ledger-red-100 border border-ledger-red/20 px-4 py-3 text-sm text-ledger-red">
            {error}
          </div>
        )}

        {data && (
          <>
            {/* =====================================================
                KPI GRID
            ===================================================== */}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5 mb-7">

              {[
                {
                  label: 'Total Balance',
                  accent: 'green',
                  value: `Rs ${formatMoney(data.totalBalance)}`,
                  sub: 'Across entire network',
                },
                {
                  label: 'Total Accounts',
                  accent: 'navy',
                  value: data.totalAccounts,
                  sub: `${data.totalCustomers} registered customers`,
                },
                {
                  label: 'Branches',
                  accent: 'brass',
                  value: data.totalBranches,
                  sub: 'Active network locations',
                },
                {
                  label: 'Employees',
                  accent:
                    data.lockedCount + data.suspendedCount > 0
                      ? 'red'
                      : 'navy',
                  value: data.totalEmployees,
                  sub:
                    data.lockedCount + data.suspendedCount > 0
                      ? `${data.lockedCount} locked · ${data.suspendedCount} suspended`
                      : 'All staff active',
                },
              ].map((stat, index) => (
                <div
                  key={stat.label}
                  className="animate-fade-up"
                  style={{
                    animationDelay: `${index * 65}ms`,
                  }}
                >
                  <StatCard
                    label={stat.label}
                    accent={stat.accent}
                    value={stat.value}
                    sublabel={stat.sub}
                  />
                </div>
              ))}
            </div>

            {/* =====================================================
                MAIN CONTENT
            ===================================================== */}

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)] gap-5 lg:gap-6">

              {/* BRANCH PERFORMANCE */}

              <div
                className="bg-white border border-paper-line rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(15,23,42,0.045)] animate-fade-up"
                style={{ animationDelay: '260ms' }}
              >

                <div className="px-5 sm:px-6 py-5 border-b border-paper-line">

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-[0.18em] text-slate-soft">
                        Network Distribution
                      </p>

                      <h2 className="font-display text-xl text-ink-900 mt-1">
                        Branch Performance
                      </h2>

                      <p className="text-xs text-slate-soft mt-1">
                        Balance and customer volume across locations.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-faint">
                      {data.byBranch.length} locations
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full ledger-table">

                    <thead>
                      <tr className="bg-ink-900 text-paper text-[10px] font-mono uppercase tracking-wider text-left">
                        <th className="px-5 py-3.5 font-medium">
                          Branch
                        </th>
                        <th className="px-5 py-3.5 font-medium">
                          Customers
                        </th>
                        <th className="px-5 py-3.5 font-medium">
                          Accounts
                        </th>
                        <th className="px-5 py-3.5 font-medium text-right">
                          Balance
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {data.byBranch.map((branch, index) => (
                        <tr
                          key={branch.branchId}
                          className="text-sm group"
                        >

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">

                              <div className="w-8 h-8 rounded-lg bg-ink-50 text-ink-700 flex items-center justify-center font-mono text-[10px]">
                                {String(index + 1).padStart(2, '0')}
                              </div>

                              <div>
                                <p className="font-medium text-ink-900">
                                  {branch.name}
                                </p>

                                <p className="font-mono text-[10px] text-slate-soft mt-0.5">
                                  {branch.code}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-slate-soft">
                            {branch.customers}
                          </td>

                          <td className="px-5 py-4 text-slate-soft">
                            {branch.accounts}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <span className="font-mono text-xs text-ink-900">
                              Rs {formatMoney(branch.balance)}
                            </span>
                          </td>

                        </tr>
                      ))}

                      {data.byBranch.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-5 py-14 text-center text-slate-soft"
                          >
                            No branches have been registered yet.
                          </td>
                        </tr>
                      )}
                    </tbody>

                  </table>
                </div>
              </div>

              {/* RIGHT SIDE */}

              <div className="space-y-5">

                {/* STAFF */}

                <div
                  className="bg-white border border-paper-line rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgba(15,23,42,0.045)] animate-fade-up"
                  style={{ animationDelay: '320ms' }}
                >

                  <div className="flex items-start justify-between mb-6">

                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-[0.18em] text-slate-soft">
                        Workforce
                      </p>

                      <h2 className="font-display text-xl text-ink-900 mt-1">
                        Staff Composition
                      </h2>
                    </div>

                    <div className="w-9 h-9 rounded-xl bg-ink-50 text-ink-700 flex items-center justify-center">
                      {Icons.users}
                    </div>
                  </div>

                  <div className="space-y-4">

                    {Object.entries(data.roleCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([role, count]) => {

                        const pct =
                          data.totalEmployees > 0
                            ? Math.round(
                              (count / data.totalEmployees) * 100
                            )
                            : 0;

                        return (
                          <div key={role}>

                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-ink-900">
                                {role}
                              </span>

                              <span className="font-mono text-[10px] text-slate-soft">
                                {count} · {pct}%
                              </span>
                            </div>

                            <div className="h-1.5 bg-paper rounded-full overflow-hidden">
                              <div
                                className="h-full bg-brass rounded-full transition-all duration-700"
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                          </div>
                        );
                      })}

                    {Object.keys(data.roleCounts).length === 0 && (
                      <p className="text-xs text-slate-soft">
                        No employee roles available.
                      </p>
                    )}

                  </div>
                </div>

                {/* SYSTEM HEALTH */}

                <div
                  className="bg-ink-900 text-white rounded-2xl p-5 sm:p-6 shadow-[0_12px_35px_rgba(15,23,42,0.12)] animate-fade-up"
                  style={{ animationDelay: '380ms' }}
                >

                  <div className="flex items-center justify-between mb-6">

                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/35">
                        Control Center
                      </p>

                      <h2 className="font-display text-xl mt-1">
                        System Health
                      </h2>
                    </div>

                    <div className="w-9 h-9 rounded-xl bg-white/10 text-brass flex items-center justify-center">
                      {Icons.briefcase}
                    </div>
                  </div>

                  <div className="space-y-3">

                    <div className="flex items-center justify-between py-3 border-t border-white/10">
                      <div className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-ledger-green" />
                        <span className="text-xs text-white/65">
                          Active employees
                        </span>
                      </div>

                      <span className="font-mono text-xs text-white/80">
                        {data.totalEmployees -
                          data.lockedCount -
                          data.suspendedCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3 border-t border-white/10">
                      <div className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-brass" />
                        <span className="text-xs text-white/65">
                          Suspended
                        </span>
                      </div>

                      <span className="font-mono text-xs text-white/80">
                        {data.suspendedCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3 border-t border-white/10">
                      <div className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-ledger-red" />
                        <span className="text-xs text-white/65">
                          Locked
                        </span>
                      </div>

                      <span className="font-mono text-xs text-white/80">
                        {data.lockedCount}
                      </span>
                    </div>

                  </div>

                  <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-2">
                    <span className="relative flex w-2 h-2">
                      <span className="absolute inset-0 rounded-full bg-ledger-green opacity-40 animate-ping" />
                      <span className="relative w-2 h-2 rounded-full bg-ledger-green" />
                    </span>

                    <span className="text-[10px] text-white/40">
                      Network operating normally
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* FOOTER */}

            <div
              className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 px-1 text-[10px] font-mono uppercase tracking-wider text-slate-faint animate-fade-up"
              style={{ animationDelay: '430ms' }}
            >
              <span>
                Executive banking console
              </span>

              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-ledger-green" />
                <span>
                  All figures reflect current system data
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   STANDARD DASHBOARD
========================================================= */

function StandardDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStats() {
      try {
        const [
          customersRes,
          accountsRes,
        ] = await Promise.all([
          api.get('/customers'),
          api.get('/accounts'),
        ]);

        const totalBalance = accountsRes.data.reduce(
          (sum, account) =>
            sum + parseFloat(account.Balance || 0),
          0
        );

        setStats({
          totalCustomers: customersRes.data.length,
          totalAccounts: accountsRes.data.length,
          totalBalance,
        });
      } catch {
        setError('Could not load dashboard data.');
      }
    }

    loadStats();
  }, []);

  const formatMoney = (value) =>
    value.toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="min-h-full bg-[#f6f7f8]">

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-9">

        {/* PREMIUM HEADER */}

        <section className="relative overflow-hidden rounded-[26px] bg-ink-900 text-white mb-7 shadow-[0_20px_55px_rgba(15,23,42,0.14)] animate-fade-up">

          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)',
              backgroundSize: '36px 36px',
            }}
          />

          <div className="absolute -right-20 -top-28 w-72 h-72 rounded-full border border-white/10" />

          <div className="relative p-6 sm:p-8">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">

              <div className="flex items-start gap-4">

                <div className="w-12 h-12 rounded-2xl bg-brass text-ink-900 flex items-center justify-center shrink-0">
                  {Icons.wallet}
                </div>

                <div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-white/40">
                      Branch Console
                    </span>

                    <span className="w-1 h-1 rounded-full bg-white/20" />

                    <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-brass">
                      Live
                    </span>
                  </div>

                  <h1 className="font-display text-3xl sm:text-4xl leading-none">
                    Branch Overview
                  </h1>

                  <p className="text-white/45 text-xs sm:text-sm mt-3 max-w-lg">
                    Monitor customers, accounts and balances
                    from one centralized banking workspace.
                  </p>

                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
                <p className="text-[9px] font-mono uppercase tracking-wider text-white/35">
                  Status
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <span className="w-2 h-2 rounded-full bg-ledger-green" />
                  <span className="text-xs text-white/75">
                    Branch operational
                  </span>
                </div>
              </div>

            </div>

          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-xl bg-ledger-red-100 border border-ledger-red/20 px-4 py-3 text-sm text-ledger-red">
            {error}
          </div>
        )}

        {stats && (
          <>
            {/* STATS */}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5 mb-7">

              {[
                {
                  label: 'Total Customers',
                  accent: 'navy',
                  value: stats.totalCustomers,
                },
                {
                  label: 'Total Accounts',
                  accent: 'brass',
                  value: stats.totalAccounts,
                },
                {
                  label: 'Total Balance',
                  accent: 'green',
                  value: `Rs ${formatMoney(stats.totalBalance)}`,
                },
              ].map((stat, index) => (
                <div
                  key={stat.label}
                  className="animate-fade-up"
                  style={{
                    animationDelay: `${index * 70}ms`,
                  }}
                >
                  <StatCard
                    label={stat.label}
                    accent={stat.accent}
                    value={stat.value}
                  />
                </div>
              ))}

            </div>

            {/* BALANCE FEATURE */}

            <div
              className="relative overflow-hidden rounded-2xl bg-white border border-paper-line p-6 sm:p-7 shadow-[0_8px_30px_rgba(15,23,42,0.045)] animate-fade-up"
              style={{ animationDelay: '240ms' }}
            >

              <div className="absolute right-0 top-0 w-56 h-56 rounded-full border border-brass/10 -translate-y-1/2 translate-x-1/3" />

              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                <div>

                  <p className="text-[9px] font-mono uppercase tracking-[0.18em] text-slate-soft">
                    Current Position
                  </p>

                  <h2 className="font-display text-2xl text-ink-900 mt-2">
                    Branch Financial Position
                  </h2>

                  <p className="text-xs text-slate-soft mt-1">
                    Current aggregate balance across customer accounts.
                  </p>

                </div>

                <div className="text-left md:text-right">

                  <p className="text-[9px] font-mono uppercase tracking-wider text-slate-faint">
                    Available Balance
                  </p>

                  <p className="font-display text-3xl sm:text-4xl text-ink-900 mt-1">
                    Rs {formatMoney(stats.totalBalance)}
                  </p>

                  <div className="flex items-center md:justify-end gap-2 mt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-ledger-green" />
                    <span className="text-[10px] text-slate-soft">
                      System synchronized
                    </span>
                  </div>

                </div>

              </div>

            </div>

            <div className="flex justify-center mt-6 text-[10px] font-mono uppercase tracking-wider text-slate-faint">
              Secure branch banking workspace
            </div>
          </>
        )}
      </div>
    </div>
  );
}