import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/ui/StatCard';

export default function Dashboard() {
  const { employee } = useAuth();

  return employee.role === 'SuperAdmin'
    ? <SuperAdminDashboard />
    : <StandardDashboard />;
}

/* ================================================================
   SUPER ADMIN DASHBOARD
================================================================ */

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

  const highestBalanceBranch = useMemo(() => {
    if (!data?.byBranch?.length) return null;

    return [...data.byBranch].sort(
      (a, b) => b.balance - a.balance
    )[0];
  }, [data]);

  const highestVolumeBranch = useMemo(() => {
    if (!data?.byBranch?.length) return null;

    return [...data.byBranch].sort(
      (a, b) =>
        (b.customers + b.accounts) -
        (a.customers + a.accounts)
    )[0];
  }, [data]);

  const maxBranchBalance = useMemo(() => {
    if (!data?.byBranch?.length) return 1;

    return Math.max(
      ...data.byBranch.map((branch) => branch.balance),
      1
    );
  }, [data]);

  return (
    <div className="min-h-full bg-[#f5f6f8]">
      <div className="max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* =====================================================
            LUXURY HERO
        ====================================================== */}
        <section className="relative overflow-hidden rounded-[28px] bg-ink-900 text-white mb-7 shadow-[0_20px_50px_rgba(15,23,42,0.16)] animate-fade-up">

          {/* Grid */}
          <div
            className="absolute inset-0 opacity-[0.045]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)',
              backgroundSize: '34px 34px',
            }}
          />

          {/* Decorative rings */}
          <div className="absolute -right-28 -top-36 w-[420px] h-[420px] rounded-full border border-white/[0.07]" />
          <div className="absolute -right-5 -top-28 w-[300px] h-[300px] rounded-full border border-brass/[0.12]" />
          <div className="absolute right-24 -bottom-52 w-[360px] h-[360px] rounded-full border border-white/[0.035]" />

          {/* Glow */}
          <div className="absolute right-[18%] top-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-brass/[0.06] blur-3xl" />

          <div className="relative p-6 sm:p-8 lg:p-9">

            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">

              <div className="flex items-start gap-4 sm:gap-5">

                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-brass text-ink-900 flex items-center justify-center shrink-0 shadow-[0_10px_25px_rgba(0,0,0,0.18)]">
                  <svg
                    width="29"
                    height="29"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M3 20h18M5 20V9l7-5 7 5v11M8 20v-6h3v6m2 0v-6h3v6M3 9h18"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-white/40">
                      Executive Control
                    </span>

                    <span className="w-1 h-1 rounded-full bg-brass" />

                    <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-brass">
                      System Wide
                    </span>
                  </div>

                  <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] leading-none tracking-tight">
                    Banking Overview
                  </h1>

                  <p className="text-white/45 text-xs sm:text-sm mt-3 max-w-xl leading-relaxed">
                    A complete view of your banking network, branch
                    performance and operational workforce.
                  </p>
                </div>
              </div>

              {/* Hero status */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:min-w-[390px]">

                <HeroMetric
                  label="Network Balance"
                  value={
                    data
                      ? `Rs ${formatCompact(data.totalBalance)}`
                      : '—'
                  }
                />

                <HeroMetric
                  label="Active Locations"
                  value={data ? data.totalBranches : '—'}
                />

                <HeroMetric
                  label="Customers"
                  value={data ? data.totalCustomers : '—'}
                />

                <HeroMetric
                  label="Accounts"
                  value={data ? data.totalAccounts : '—'}
                />
              </div>
            </div>

            {/* Bottom strip */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-8 pt-4 border-t border-white/10">

              <div className="flex items-center gap-2">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inset-0 rounded-full bg-ledger-green opacity-40 animate-ping" />
                  <span className="relative w-2 h-2 rounded-full bg-ledger-green" />
                </span>

                <span className="text-[10px] text-white/55">
                  Network operational
                </span>
              </div>

              <span className="text-white/15">•</span>

              <span className="text-[10px] text-white/35">
                Real-time branch overview
              </span>

              <div className="ml-auto hidden sm:flex items-center gap-2">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>

                <span className="text-[9px] font-mono uppercase tracking-wider text-white/30">
                  Secure environment
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
            {/* =================================================
                KPI CARDS
            ================================================== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

              {[
                {
                  label: 'Total Balance',
                  accent: 'green',
                  value: `Rs ${data.totalBalance.toLocaleString(
                    'en-PK',
                    { minimumFractionDigits: 2 }
                  )}`,
                  sub: 'Across entire network',
                },
                {
                  label: 'Customer Accounts',
                  accent: 'navy',
                  value: data.totalAccounts,
                  sub: `${data.totalCustomers} registered customers`,
                },
                {
                  label: 'Branch Network',
                  accent: 'brass',
                  value: data.totalBranches,
                  sub: 'Active network locations',
                },
                {
                  label: 'Workforce',
                  accent:
                    data.lockedCount + data.suspendedCount > 0
                      ? 'red'
                      : 'navy',
                  value: data.totalEmployees,
                  sub:
                    data.lockedCount + data.suspendedCount > 0
                      ? `${data.lockedCount} locked · ${data.suspendedCount} suspended`
                      : 'All staff operational',
                },
              ].map((stat, index) => (
                <div
                  key={stat.label}
                  className="animate-fade-up"
                  style={{
                    animationDelay: `${index * 60}ms`,
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

            {/* =================================================
                MAIN ANALYTICS
            ================================================== */}
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.8fr)] gap-5 mb-5">

              {/* Branch performance */}
              <section
                className="bg-white rounded-2xl border border-paper-line overflow-hidden shadow-[0_5px_25px_rgba(15,23,42,0.045)] animate-fade-up"
                style={{ animationDelay: '260ms' }}
              >

                <div className="px-5 sm:px-6 py-5 border-b border-paper-line">

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                    <div>
                      <p className="eyebrow mb-1">
                        Network Performance
                      </p>

                      <h2 className="font-display text-xl text-ink-900">
                        Branch Performance
                      </h2>

                      <p className="text-xs text-slate-soft mt-1">
                        Balance distribution across your network
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-brass" />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-soft">
                        Balance
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6">

                  {data.byBranch.length > 0 ? (
                    <div className="space-y-5">

                      {data.byBranch.map((branch, index) => {
                        const percentage = Math.max(
                          4,
                          Math.round(
                            (branch.balance / maxBranchBalance) * 100
                          )
                        );

                        return (
                          <div
                            key={branch.branchId}
                            className="group"
                          >

                            <div className="flex items-end justify-between gap-4 mb-2">

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-md bg-ink-50 flex items-center justify-center text-[9px] font-mono text-slate-soft">
                                    {String(index + 1).padStart(2, '0')}
                                  </span>

                                  <p className="text-sm font-medium text-ink-900 truncate">
                                    {branch.name}
                                  </p>
                                </div>

                                <p className="font-mono text-[9px] text-slate-faint mt-1 ml-8">
                                  {branch.code}
                                </p>
                              </div>

                              <p className="font-mono text-xs text-ink-900 whitespace-nowrap">
                                Rs {branch.balance.toLocaleString(
                                  'en-PK',
                                  { maximumFractionDigits: 0 }
                                )}
                              </p>
                            </div>

                            <div className="h-2 bg-ink-50 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-ink-900 rounded-full transition-all duration-1000 ease-out group-hover:bg-brass"
                                style={{
                                  width: `${percentage}%`,
                                }}
                              />
                            </div>

                            <div className="flex items-center gap-4 mt-2 ml-8">
                              <span className="text-[10px] text-slate-soft">
                                {branch.customers} customers
                              </span>

                              <span className="text-[10px] text-slate-faint">
                                •
                              </span>

                              <span className="text-[10px] text-slate-soft">
                                {branch.accounts} accounts
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState text="No branches available." />
                  )}
                </div>
              </section>

              {/* Executive insights */}
              <section
                className="bg-ink-900 text-white rounded-2xl overflow-hidden shadow-[0_12px_32px_rgba(15,23,42,0.12)] animate-fade-up"
                style={{ animationDelay: '320ms' }}
              >

                <div className="p-5 sm:p-6">

                  <div className="flex items-center justify-between mb-7">
                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/35">
                        Executive Snapshot
                      </p>

                      <h2 className="font-display text-xl mt-1">
                        Network Insights
                      </h2>
                    </div>

                    <div className="w-9 h-9 rounded-xl bg-white/10 text-brass flex items-center justify-center">
                      ✦
                    </div>
                  </div>

                  <div className="space-y-0">

                    <InsightRow
                      label="Top balance branch"
                      value={
                        highestBalanceBranch?.name || '—'
                      }
                      sub={
                        highestBalanceBranch
                          ? `Rs ${highestBalanceBranch.balance.toLocaleString(
                              'en-PK',
                              { maximumFractionDigits: 0 }
                            )}`
                          : 'No data'
                      }
                    />

                    <InsightRow
                      label="Highest volume"
                      value={
                        highestVolumeBranch?.name || '—'
                      }
                      sub={
                        highestVolumeBranch
                          ? `${highestVolumeBranch.customers} customers · ${highestVolumeBranch.accounts} accounts`
                          : 'No data'
                      }
                    />

                    <InsightRow
                      label="Staff status"
                      value={
                        data.lockedCount +
                          data.suspendedCount ===
                        0
                          ? 'All operational'
                          : 'Attention required'
                      }
                      sub={
                        data.lockedCount +
                          data.suspendedCount ===
                        0
                          ? 'No restricted employees'
                          : `${data.lockedCount} locked · ${data.suspendedCount} suspended`
                      }
                    />

                  </div>
                </div>

                <div className="px-5 sm:px-6 py-4 bg-white/[0.035] border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-ledger-green" />
                    <span className="text-[10px] text-white/40">
                      Network monitoring active
                    </span>
                  </div>
                </div>
              </section>
            </div>

            {/* =================================================
                LOWER SECTION
            ================================================== */}
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)] gap-5">

              {/* Staff composition */}
              <section
                className="bg-white rounded-2xl border border-paper-line p-5 sm:p-6 shadow-[0_5px_24px_rgba(15,23,42,0.04)] animate-fade-up"
                style={{ animationDelay: '380ms' }}
              >

                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">

                  <div>
                    <p className="eyebrow mb-1">
                      Workforce
                    </p>

                    <h2 className="font-display text-xl text-ink-900">
                      Staff Composition
                    </h2>

                    <p className="text-xs text-slate-soft mt-1">
                      Distribution of employees across roles
                    </p>
                  </div>

                  <span className="text-[10px] font-mono text-slate-faint">
                    {data.totalEmployees} TOTAL STAFF
                  </span>
                </div>

                {Object.keys(data.roleCounts).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">

                    {Object.entries(data.roleCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([role, count], index) => {
                        const percentage =
                          data.totalEmployees > 0
                            ? Math.round(
                                (count /
                                  data.totalEmployees) *
                                  100
                              )
                            : 0;

                        return (
                          <div key={role}>

                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-md bg-ink-50 flex items-center justify-center text-[9px] font-mono text-slate-soft">
                                  {String(index + 1).padStart(
                                    2,
                                    '0'
                                  )}
                                </span>

                                <span className="text-xs font-medium text-ink-900">
                                  {role}
                                </span>
                              </div>

                              <span className="font-mono text-[10px] text-slate-soft">
                                {count} · {percentage}%
                              </span>
                            </div>

                            <div className="h-1.5 bg-ink-50 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-brass rounded-full transition-all duration-700"
                                style={{
                                  width: `${percentage}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <EmptyState text="No employee role data available." />
                )}
              </section>

              {/* System health */}
              <section
                className="bg-white rounded-2xl border border-paper-line p-5 sm:p-6 shadow-[0_5px_24px_rgba(15,23,42,0.04)] animate-fade-up"
                style={{ animationDelay: '440ms' }}
              >

                <div className="flex items-center justify-between mb-6">

                  <div>
                    <p className="eyebrow mb-1">
                      Operations
                    </p>

                    <h2 className="font-display text-xl text-ink-900">
                      System Health
                    </h2>
                  </div>

                  <div className="w-9 h-9 rounded-xl bg-ledger-green-100 text-ledger-green flex items-center justify-center">
                    ✓
                  </div>
                </div>

                <div className="space-y-3">

                  <HealthItem
                    label="Network"
                    value="Operational"
                    status="good"
                  />

                  <HealthItem
                    label="Branch coverage"
                    value={`${data.totalBranches} locations`}
                    status="good"
                  />

                  <HealthItem
                    label="Employee access"
                    value={
                      data.lockedCount +
                        data.suspendedCount ===
                      0
                        ? 'All clear'
                        : `${data.lockedCount + data.suspendedCount} restricted`
                    }
                    status={
                      data.lockedCount +
                        data.suspendedCount ===
                      0
                        ? 'good'
                        : 'warning'
                    }
                  />

                  <HealthItem
                    label="Account network"
                    value={`${data.totalAccounts} accounts`}
                    status="good"
                  />
                </div>

                <div className="mt-5 pt-4 border-t border-paper-line">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-ledger-green" />
                    <span className="text-[10px] text-slate-soft">
                      All dashboard services responding
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   STANDARD DASHBOARD
================================================================ */

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

  return (
    <div className="min-h-full bg-[#f5f6f8]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Hero */}
        <section className="relative overflow-hidden rounded-[26px] bg-ink-900 text-white p-6 sm:p-8 mb-7 shadow-[0_18px_45px_rgba(15,23,42,0.14)] animate-fade-up">

          <div
            className="absolute inset-0 opacity-[0.045]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)',
              backgroundSize: '34px 34px',
            }}
          />

          <div className="absolute -right-20 -top-28 w-72 h-72 rounded-full border border-white/[0.07]" />
          <div className="absolute -right-5 -top-20 w-52 h-52 rounded-full border border-brass/[0.12]" />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">

            <div className="flex items-start gap-4">

              <div className="w-12 h-12 rounded-2xl bg-brass text-ink-900 flex items-center justify-center shrink-0">
                <svg
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M3 20h18M5 20V9l7-5 7 5v11M8 20v-6h3v6m2 0v-6h3v6M3 9h18"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div>
                <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/40 mb-2">
                  Branch Operations
                </p>

                <h1 className="font-display text-3xl sm:text-4xl">
                  Dashboard
                </h1>

                <p className="text-white/45 text-xs sm:text-sm mt-2">
                  Your branch at a glance.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/10">
              <span className="w-2 h-2 rounded-full bg-ledger-green" />
              <span className="text-[10px] text-white/60">
                Branch operational
              </span>
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

              {[
                {
                  label: 'Total Customers',
                  accent: 'navy',
                  value: stats.totalCustomers,
                  sub: 'Registered customers',
                },
                {
                  label: 'Total Accounts',
                  accent: 'brass',
                  value: stats.totalAccounts,
                  sub: 'Active account network',
                },
                {
                  label: 'Total Balance',
                  accent: 'green',
                  value: `Rs ${stats.totalBalance.toLocaleString(
                    'en-PK',
                    { minimumFractionDigits: 2 }
                  )}`,
                  sub: 'Current branch balance',
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
                    sublabel={stat.sub}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              <div className="bg-white rounded-2xl border border-paper-line p-6 animate-fade-up">
                <p className="eyebrow mb-1">
                  Branch Snapshot
                </p>

                <h2 className="font-display text-xl text-ink-900">
                  Financial Position
                </h2>

                <div className="mt-6">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-soft">
                    Current balance
                  </p>

                  <p className="font-display text-4xl text-ink-900 mt-2">
                    Rs {stats.totalBalance.toLocaleString(
                      'en-PK',
                      { minimumFractionDigits: 2 }
                    )}
                  </p>

                  <div className="h-2 bg-ink-50 rounded-full mt-5 overflow-hidden">
                    <div className="h-full w-[78%] bg-brass rounded-full" />
                  </div>

                  <p className="text-[10px] text-slate-soft mt-2">
                    Branch liquidity overview
                  </p>
                </div>
              </div>

              <div className="bg-ink-900 text-white rounded-2xl p-6 animate-fade-up">

                <p className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/35">
                  Quick Overview
                </p>

                <h2 className="font-display text-xl mt-1">
                  Branch Activity
                </h2>

                <div className="grid grid-cols-2 gap-3 mt-6">

                  <MiniDarkMetric
                    label="Customers"
                    value={stats.totalCustomers}
                  />

                  <MiniDarkMetric
                    label="Accounts"
                    value={stats.totalAccounts}
                  />
                </div>

                <div className="flex items-center gap-2 mt-5 pt-4 border-t border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-ledger-green" />
                  <span className="text-[10px] text-white/40">
                    Branch systems operational
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   SMALL COMPONENTS
================================================================ */

function HeroMetric({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.045] backdrop-blur-sm px-4 py-3">
      <p className="text-[8px] font-mono uppercase tracking-[0.16em] text-white/30">
        {label}
      </p>

      <p className="font-display text-lg sm:text-xl text-white mt-1">
        {value}
      </p>
    </div>
  );
}

function InsightRow({ label, value, sub }) {
  return (
    <div className="py-4 border-t border-white/10 first:border-t-0">
      <p className="text-[9px] font-mono uppercase tracking-wider text-white/30">
        {label}
      </p>

      <p className="text-sm font-medium text-white/85 mt-1">
        {value}
      </p>

      <p className="text-[10px] text-white/35 mt-1">
        {sub}
      </p>
    </div>
  );
}

function HealthItem({ label, value, status }) {
  const good = status === 'good';

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-paper-line last:border-0">

      <div className="flex items-center gap-2.5">
        <span
          className={`w-2 h-2 rounded-full ${
            good
              ? 'bg-ledger-green'
              : 'bg-brass-dark'
          }`}
        />

        <span className="text-xs text-ink-700">
          {label}
        </span>
      </div>

      <span
        className={`text-[10px] font-medium ${
          good
            ? 'text-ledger-green'
            : 'text-brass-dark'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function MiniDarkMetric({ label, value }) {
  return (
    <div className="rounded-xl bg-white/[0.05] border border-white/10 p-4">
      <p className="text-[9px] font-mono uppercase tracking-wider text-white/30">
        {label}
      </p>

      <p className="font-display text-2xl mt-2">
        {value}
      </p>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="py-12 text-center">
      <div className="w-10 h-10 mx-auto rounded-xl bg-ink-50 flex items-center justify-center text-slate-soft mb-3">
        —
      </div>

      <p className="text-xs text-slate-soft">
        {text}
      </p>
    </div>
  );
}

function formatCompact(value) {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(2)}B`;
  }

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  return value.toLocaleString('en-PK');
}