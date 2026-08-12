import { useEffect, useState } from 'react';
import api from '../../api/client';
import SearchableSelect from '../../components/SearchableSelect';
import Modal from '../../components/ui/Modal';

const ACCOUNT_TYPES = [
  { value: 'Savings', label: 'Savings' },
  { value: 'Current', label: 'Current' },
  { value: 'TermDeposit', label: 'Term Deposit' },
];

const typeAccent = {
  Savings: 'pill-green',
  Current: 'pill-navy',
  TermDeposit: 'pill-brass',
};

const typeConfig = {
  Savings: {
    label: 'Savings',
    icon: 'S',
    description: 'Personal savings accounts',
    bg: 'bg-ledger-green/10',
    text: 'text-ledger-green',
  },
  Current: {
    label: 'Current',
    icon: 'C',
    description: 'Everyday banking accounts',
    bg: 'bg-ink-900/10',
    text: 'text-ink-900',
  },
  TermDeposit: {
    label: 'Term Deposit',
    icon: 'T',
    description: 'Fixed-term deposits',
    bg: 'bg-brass/15',
    text: 'text-brass-dark',
  },
};

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    custID: '',
    accountType: '',
    productId: '',
    balance: '0',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState('All');

  const [closingAccount, setClosingAccount] = useState(null);
  const [targetAccountNo, setTargetAccountNo] = useState('');
  const [closeResult, setCloseResult] = useState(null);
  const [closeError, setCloseError] = useState('');

  async function loadData() {
    try {
      const [accountsRes, customersRes, productsRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/customers'),
        api.get('/accounts/products'),
      ]);

      setAccounts(accountsRes.data);
      setCustomers(customersRes.data);
      setProducts(productsRes.data);
    } catch {
      setError('Could not load accounts.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const productOptions = products
    .filter((p) => p.AccountType === form.accountType)
    .map((p) => ({
      value: p.ProductID,
      label: p.ProductName,
      sublabel:
        p.AccountType === 'TermDeposit'
          ? `${p.TermMonths} months • ${p.InterestRate}% profit`
          : `${p.InterestRate}% profit • ${p.Description}`,
    }));

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      await api.post('/accounts', {
        custID: form.custID,
        productId: form.productId,
        balance: form.balance,
      });

      setForm({
        custID: '',
        accountType: '',
        productId: '',
        balance: '0',
      });

      setShowForm(false);
      loadData();
    } catch (err) {
      setFormError(
        err.response?.data?.error || 'Failed to create account.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCloseTermDeposit(e) {
    e.preventDefault();
    setCloseError('');
    setCloseResult(null);

    try {
      const { data } = await api.post(
        `/accounts/${closingAccount.AccountNo}/close-term-deposit`,
        { targetAccountNo }
      );

      setCloseResult(data);
      loadData();
    } catch (err) {
      setCloseError(
        err.response?.data?.error || 'Failed to close term deposit.'
      );
    }
  }

  const customerAccountOptions = (customerId) =>
    accounts
      .filter(
        (a) =>
          a.CustID === customerId &&
          a.Type !== 'TermDeposit'
      )
      .map((a) => ({
        value: a.AccountNo,
        label: `${a.AccountNo} — ${a.Nickname}`,
      }));

  const filtered =
    filterType === 'All'
      ? accounts
      : accounts.filter((a) => a.Type === filterType);

  const activeAccounts = accounts.filter(
    (a) => a.Status === 'Active'
  ).length;

  const totalBalance = accounts.reduce(
    (sum, a) => sum + parseFloat(a.Balance || 0),
    0
  );

  const termDeposits = accounts.filter(
    (a) => a.Type === 'TermDeposit'
  ).length;

  function formatBalance(value) {
    return parseFloat(value || 0).toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  return (
    <div className="min-h-full bg-[#f7f8fa]">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">

        {/* =========================================================
            HERO
        ========================================================= */}
        <div className="relative overflow-hidden rounded-2xl bg-ink-900 text-white mb-6 sm:mb-7 shadow-[0_14px_40px_rgba(15,23,42,0.14)] animate-fade-up">

          <div className="absolute -right-20 -top-28 w-80 h-80 rounded-full bg-brass/10 blur-3xl" />
          <div className="absolute right-[18%] -bottom-32 w-72 h-72 rounded-full bg-white/5 blur-3xl" />

          <div className="relative px-5 sm:px-7 lg:px-9 py-6 sm:py-7 lg:py-8">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

              <div className="flex items-start gap-4">

                <div className="hidden sm:flex w-12 h-12 rounded-xl bg-white/10 border border-white/10 items-center justify-center shrink-0">
                  <svg
                    className="w-6 h-6 text-brass"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    viewBox="0 0 24 24"
                  >
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="14"
                      rx="2"
                    />
                    <path
                      strokeLinecap="round"
                      d="M7 9h10M7 13h5"
                    />
                  </svg>
                </div>

                <div>
                  <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-brass mb-1.5">
                    Banking Operations
                  </p>

                  <h1 className="font-display text-2xl sm:text-3xl lg:text-[34px] leading-tight">
                    Accounts
                  </h1>

                  <p className="text-white/60 text-sm mt-1.5 max-w-xl">
                    Manage customer accounts, balances and term deposit
                    operations at your branch.
                  </p>
                </div>

              </div>

              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-brass text-ink-900 font-semibold text-sm shadow-lg hover:bg-brass/90 active:scale-[0.98] transition-all duration-200 w-full sm:w-auto"
              >
                <span className="text-lg leading-none">
                  {showForm ? '×' : '+'}
                </span>

                {showForm ? 'Cancel' : 'Open Account'}
              </button>

            </div>
          </div>
        </div>

        {/* =========================================================
            SUMMARY STATS
        ========================================================= */}
        {!loading && !error && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-7 animate-fade-up">

            <div className="bg-white border border-paper-line rounded-2xl p-4 sm:p-5 shadow-[0_4px_18px_rgba(15,23,42,0.035)]">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-slate-soft">
                  Total Accounts
                </span>

                <span className="w-8 h-8 rounded-lg bg-ink-900/5 flex items-center justify-center text-xs font-bold text-ink-900">
                  #
                </span>
              </div>

              <p className="font-display text-2xl sm:text-3xl text-ink-900">
                {accounts.length}
              </p>

              <p className="text-[11px] text-slate-soft mt-1">
                All account types
              </p>
            </div>

            <div className="bg-white border border-paper-line rounded-2xl p-4 sm:p-5 shadow-[0_4px_18px_rgba(15,23,42,0.035)]">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-slate-soft">
                  Active
                </span>

                <span className="w-8 h-8 rounded-lg bg-ledger-green/10 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-ledger-green" />
                </span>
              </div>

              <p className="font-display text-2xl sm:text-3xl text-ink-900">
                {activeAccounts}
              </p>

              <p className="text-[11px] text-slate-soft mt-1">
                Currently active
              </p>
            </div>

            <div className="bg-white border border-paper-line rounded-2xl p-4 sm:p-5 shadow-[0_4px_18px_rgba(15,23,42,0.035)]">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-slate-soft">
                  Term Deposits
                </span>

                <span className="w-8 h-8 rounded-lg bg-brass/15 flex items-center justify-center text-brass-dark text-xs font-bold">
                  T
                </span>
              </div>

              <p className="font-display text-2xl sm:text-3xl text-ink-900">
                {termDeposits}
              </p>

              <p className="text-[11px] text-slate-soft mt-1">
                Fixed-term accounts
              </p>
            </div>

            <div className="col-span-2 lg:col-span-1 bg-ink-900 rounded-2xl p-4 sm:p-5 text-white shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-white/50">
                  Portfolio Balance
                </span>

                <span className="text-brass text-xs font-mono">
                  PKR
                </span>
              </div>

              <p className="font-display text-xl sm:text-2xl text-white truncate">
                Rs {formatBalance(totalBalance)}
              </p>

              <p className="text-[11px] text-white/45 mt-1">
                Combined account balances
              </p>
            </div>

          </div>
        )}

        {/* =========================================================
            OPEN ACCOUNT FORM
        ========================================================= */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-paper-line rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.07)] p-5 sm:p-7 mb-7 animate-scale-in"
          >

            <div className="flex items-center gap-3 pb-5 mb-5 border-b border-paper-line">

              <div className="w-10 h-10 rounded-xl bg-ink-900 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-brass"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    d="M12 4v16M4 12h16"
                  />
                </svg>
              </div>

              <div>
                <h2 className="font-display text-lg text-ink-900">
                  Open New Account
                </h2>

                <p className="text-xs text-slate-soft mt-0.5">
                  Select the customer, account type and applicable product.
                </p>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-soft mb-2">
                  Customer
                </label>

                <SearchableSelect
                  placeholder="Select customer"
                  value={form.custID}
                  onChange={(v) =>
                    setForm({
                      ...form,
                      custID: v,
                    })
                  }
                  options={customers.map((c) => ({
                    value: c.CustID,
                    label: `${c.Name} (#${c.CustID})`,
                  }))}
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-soft mb-2">
                  Account Type
                </label>

                <select
                  required
                  value={form.accountType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      accountType: e.target.value,
                      productId: '',
                    })
                  }
                  className="w-full h-11 px-3.5 bg-[#fafafa] border border-paper-line rounded-xl text-sm focus:outline-none focus:bg-white focus:border-brass focus:ring-4 focus:ring-brass/10 transition-all"
                >
                  <option value="">Select type</option>

                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-soft mb-2">
                  Product
                </label>

                <SearchableSelect
                  placeholder={
                    form.accountType
                      ? 'Select product'
                      : 'Pick a type first'
                  }
                  disabled={!form.accountType}
                  value={form.productId}
                  onChange={(v) =>
                    setForm({
                      ...form,
                      productId: v,
                    })
                  }
                  options={productOptions}
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-soft mb-2">
                  {form.accountType === 'TermDeposit'
                    ? 'Deposit Amount'
                    : 'Initial Balance'}
                </label>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-soft">
                    Rs
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required={form.accountType === 'TermDeposit'}
                    value={form.balance}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        balance: e.target.value,
                      })
                    }
                    className="w-full h-11 pl-10 pr-3.5 bg-[#fafafa] border border-paper-line rounded-xl text-sm focus:outline-none focus:bg-white focus:border-brass focus:ring-4 focus:ring-brass/10 transition-all"
                  />
                </div>
              </div>

            </div>

            {form.accountType === 'TermDeposit' && (
              <div className="mt-5 rounded-xl bg-brass/8 border border-brass/20 px-4 py-3">
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-brass/15 flex items-center justify-center shrink-0">
                    <span className="text-brass-dark text-xs font-bold">
                      T
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-ink-900">
                      Term Deposit
                    </p>

                    <p className="text-xs text-slate-soft mt-0.5">
                      The deposit amount will be locked according to the
                      selected product's term and applicable profit rate.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {formError && (
              <div className="mt-5 text-sm text-ledger-red bg-ledger-red-100/60 border border-ledger-red/20 rounded-xl px-4 py-3">
                {formError}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="h-11 px-5 rounded-xl border border-paper-line text-sm font-medium text-slate hover:bg-paper transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  submitting ||
                  !form.custID ||
                  !form.productId
                }
                className="h-11 px-6 rounded-xl bg-ink-900 text-white text-sm font-semibold hover:bg-ink-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitting
                  ? 'Creating Account...'
                  : 'Create Account'}
              </button>

            </div>
          </form>
        )}

        {/* =========================================================
            FILTERS
        ========================================================= */}
        {!loading && !error && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5 animate-fade-up">

            <div>
              <p className="text-sm font-medium text-ink-900">
                Account Directory
              </p>

              <p className="text-xs text-slate-soft mt-0.5">
                Showing {filtered.length} of {accounts.length} accounts
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-white border border-paper-line rounded-xl overflow-x-auto max-w-full">
              {['All', ...ACCOUNT_TYPES.map((t) => t.value)].map((t) => {

                const active = filterType === t;

                return (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`shrink-0 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                      active
                        ? 'bg-ink-900 text-white shadow-sm'
                        : 'text-slate-soft hover:bg-slate-50 hover:text-ink-900'
                    }`}
                  >
                    {t === 'TermDeposit'
                      ? 'Term Deposit'
                      : t}
                  </button>
                );
              })}
            </div>

          </div>
        )}

        {/* =========================================================
            LOADING
        ========================================================= */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">

            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="bg-white border border-paper-line rounded-2xl p-5 animate-pulse"
              >
                <div className="flex justify-between mb-5">
                  <div>
                    <div className="h-3 w-24 bg-slate-100 rounded mb-2" />
                    <div className="h-4 w-32 bg-slate-100 rounded" />
                  </div>

                  <div className="h-6 w-20 bg-slate-100 rounded-full" />
                </div>

                <div className="h-8 w-40 bg-slate-100 rounded mb-2" />
                <div className="h-3 w-28 bg-slate-100 rounded mb-5" />

                <div className="border-t border-slate-100 pt-4">
                  <div className="h-3 w-full bg-slate-100 rounded" />
                </div>
              </div>
            ))}

          </div>
        )}

        {/* =========================================================
            ERROR
        ========================================================= */}
        {error && (
          <div className="bg-white border border-ledger-red/20 rounded-2xl p-10 text-center">

            <div className="w-12 h-12 mx-auto rounded-full bg-ledger-red-100 flex items-center justify-center mb-3">
              <svg
                className="w-6 h-6 text-ledger-red"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3m0 4h.01M10.3 3.8L2.7 17a2 2 0 001.7 3h15.2a2 2 0 001.7-3L13.7 3.8a2 2 0 00-3.4 0z"
                />
              </svg>
            </div>

            <p className="text-ledger-red font-medium text-sm">
              {error}
            </p>

          </div>
        )}

        {/* =========================================================
            ACCOUNT CARDS
        ========================================================= */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">

            {filtered.map((a, i) => {

              const config =
                typeConfig[a.Type] || typeConfig.Current;

              const isActive = a.Status === 'Active';

              return (
                <div
                  key={a.AccountNo}
                  className="group relative bg-white border border-paper-line rounded-2xl p-5 sm:p-6 shadow-[0_4px_18px_rgba(15,23,42,0.035)] hover:shadow-[0_14px_35px_rgba(15,23,42,0.09)] hover:-translate-y-0.5 transition-all duration-300 animate-fade-up overflow-hidden"
                  style={{
                    animationDelay: `${Math.min(i, 8) * 45}ms`,
                  }}
                >

                  {/* Accent */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-ink-900 via-brass to-transparent opacity-70" />

                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">

                    <div className="flex items-center gap-3 min-w-0">

                      <div
                        className={`w-11 h-11 rounded-xl ${config.bg} ${config.text} flex items-center justify-center font-display text-lg shrink-0`}
                      >
                        {config.icon}
                      </div>

                      <div className="min-w-0">

                        <p className="font-mono text-[10px] text-slate-soft uppercase tracking-wide">
                          Account
                        </p>

                        <p className="font-mono text-sm text-ink-900 truncate mt-0.5">
                          #{a.AccountNo}
                        </p>

                      </div>

                    </div>

                    <span
                      className={`pill shrink-0 ${
                        typeAccent[a.Type] || 'pill-navy'
                      }`}
                    >
                      {a.Type === 'TermDeposit'
                        ? 'Term Deposit'
                        : a.Type}
                    </span>

                  </div>

                  {/* Customer */}
                  <div className="mt-5">

                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-soft mb-1">
                      Account Holder
                    </p>

                    <p className="font-medium text-ink-900 truncate">
                      {a.CustomerName}
                    </p>

                  </div>

                  {/* Balance */}
                  <div className="mt-5 rounded-xl bg-[#f8f9fb] border border-slate-100 px-4 py-4">

                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-soft mb-1.5">
                      {a.Type === 'TermDeposit'
                        ? 'Deposit Balance'
                        : 'Available Balance'}
                    </p>

                    <p className="font-display text-2xl sm:text-[27px] text-ink-900 tracking-tight truncate">
                      <span className="text-sm font-sans text-slate-soft mr-1">
                        Rs
                      </span>

                      {formatBalance(a.Balance)}
                    </p>

                    <p className="text-xs text-slate-soft mt-1 truncate">
                      {a.Nickname || 'No account nickname'}
                    </p>

                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-4 border-t border-paper-line">

                    <div className="flex items-center justify-between gap-3">

                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wide ${
                          isActive
                            ? 'text-ledger-green'
                            : 'text-ledger-red'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive
                              ? 'bg-ledger-green'
                              : 'bg-ledger-red'
                          }`}
                        />

                        {a.Status}
                      </span>

                      {a.MaturityDate && (
                        <div className="text-right">
                          <p className="text-[9px] font-mono uppercase tracking-wider text-slate-soft">
                            Maturity
                          </p>

                          <p className="font-mono text-[11px] text-ink-900 mt-0.5">
                            {formatDate(a.MaturityDate)}
                          </p>
                        </div>
                      )}

                    </div>

                    {/* Close action */}
                    {a.Type === 'TermDeposit' &&
                      a.Status === 'Active' && (
                        <button
                          onClick={() => {
                            setClosingAccount(a);
                            setCloseResult(null);
                            setCloseError('');
                            setTargetAccountNo('');
                          }}
                          className="mt-4 w-full h-9 rounded-lg border border-brass/30 text-brass-dark bg-brass/5 hover:bg-brass/10 text-xs font-semibold transition-colors"
                        >
                          Close Term Deposit
                        </button>
                      )}

                  </div>

                </div>
              );
            })}

            {/* =====================================================
                EMPTY
            ===================================================== */}
            {filtered.length === 0 && (
              <div className="col-span-full bg-white border border-paper-line rounded-2xl py-16 px-6 text-center">

                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 flex items-center justify-center mb-4">

                  <svg
                    className="w-7 h-7 text-slate-soft"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="14"
                      rx="2"
                    />

                    <path
                      strokeLinecap="round"
                      d="M7 10h4M7 14h7"
                    />
                  </svg>

                </div>

                <h3 className="font-display text-lg text-ink-900">
                  No accounts found
                </h3>

                <p className="text-sm text-slate-soft mt-1">
                  There are no accounts matching the selected type.
                </p>

                {filterType !== 'All' && (
                  <button
                    onClick={() => setFilterType('All')}
                    className="mt-5 text-sm font-medium text-ink-900 hover:text-brass transition-colors"
                  >
                    View all accounts
                  </button>
                )}

              </div>
            )}

          </div>
        )}

        {/* =========================================================
            CLOSE TERM DEPOSIT MODAL
        ========================================================= */}
        <Modal
          open={!!closingAccount}
          onClose={() => setClosingAccount(null)}
          title="Close Term Deposit"
          subtitle={
            closingAccount
              ? `Account #${closingAccount.AccountNo} — ${closingAccount.Nickname}`
              : ''
          }
        >
          {!closeResult ? (
            <form
              onSubmit={handleCloseTermDeposit}
              className="space-y-5"
            >

              <div className="rounded-xl bg-brass/8 border border-brass/20 p-4">

                <div className="flex gap-3">

                  <div className="w-9 h-9 rounded-lg bg-brass/15 flex items-center justify-center shrink-0">
                    <span className="font-display text-brass-dark">
                      T
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink-900">
                      Term Deposit Closure
                    </p>

                    <p className="text-xs text-slate-soft mt-1">
                      Select the customer's account where the closure
                      proceeds should be deposited.
                    </p>
                  </div>

                </div>

              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-soft mb-2">
                  Deposit Proceeds Into
                </label>

                <SearchableSelect
                  placeholder="Select destination account"
                  value={targetAccountNo}
                  onChange={setTargetAccountNo}
                  options={
                    closingAccount
                      ? customerAccountOptions(
                          closingAccount.CustID
                        )
                      : []
                  }
                />
              </div>

              {closeError && (
                <div className="text-sm text-ledger-red bg-ledger-red-100 border border-ledger-red/30 rounded-xl px-4 py-3">
                  {closeError}
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">

                <button
                  type="button"
                  onClick={() => setClosingAccount(null)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!targetAccountNo}
                  className="btn btn-brass disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Closure
                </button>

              </div>

            </form>
          ) : (
            <div className="animate-scale-in">

              <div className="rounded-xl bg-slate-50 border border-paper-line p-5 mb-5">

                <div
                  className={`text-[11px] font-mono uppercase tracking-wider mb-3 ${
                    closeResult.matured
                      ? 'text-ledger-green'
                      : 'text-ledger-red'
                  }`}
                >
                  {closeResult.matured
                    ? 'Matured Payout'
                    : 'Early Closure — Penalty Applied'}
                </div>

                <p className="text-sm text-slate-soft leading-relaxed">
                  {closeResult.message}
                </p>

              </div>

              <button
                onClick={() => setClosingAccount(null)}
                className="btn btn-primary"
              >
                Done
              </button>

            </div>
          )}
        </Modal>

      </div>
    </div>
  );
}