import { useEffect, useState } from 'react';
import api from '../../api/client';
import SearchableSelect from '../../components/SearchableSelect';

const TYPES = [
  {
    id: 'Deposit',
    title: 'Deposit',
    short: 'Cash In',
    desc: 'Add funds to a customer account.',
    icon: (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 4v12m0 0 5-5m-5 5-5-5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 19h16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: 'Withdraw',
    title: 'Withdraw',
    short: 'Cash Out',
    desc: 'Pay funds out from an account.',
    icon: (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 20V8m0 0-5 5m5-5 5 5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 5h16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: 'Transfer',
    title: 'Transfer',
    short: 'Move Funds',
    desc: 'Move funds between accounts.',
    icon: (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 8h13m0 0-4-4m4 4-4 4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M20 16H7m0 0 4 4m-4-4 4-4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function Transactions() {
  const [activeTab, setActiveTab] = useState('Deposit');

  const [accounts, setAccounts] = useState([]);

  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const [accountNo, setAccountNo] = useState('');
  const [toAccountNo, setToAccountNo] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    api
      .get('/accounts')
      .then((res) =>
        setAccounts(
          res.data.filter((a) => a.Type !== 'TermDeposit')
        )
      )
      .catch(() => {});
  }, []);

  const accountOptions = accounts.map((a) => ({
    value: a.AccountNo,
    label: `${a.AccountNo} — ${a.CustomerName}`,
    sublabel: `${a.Nickname} • Rs ${parseFloat(
      a.Balance
    ).toLocaleString('en-PK')}`,
  }));

  function resetForm() {
    setAccountNo('');
    setToAccountNo('');
    setAmount('');
  }

  function selectType(type) {
    setActiveTab(type);
    setResult(null);
    setError('');
    resetForm();
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError('');
    setResult(null);
    setSubmitting(true);

    try {
      let response;

      if (activeTab === 'Deposit') {
        response = await api.post('/transactions/deposit', {
          accountNo,
          amount: parseFloat(amount),
        });
      } else if (activeTab === 'Withdraw') {
        response = await api.post('/transactions/withdraw', {
          accountNo,
          amount: parseFloat(amount),
        });
      } else {
        response = await api.post('/transactions/transfer', {
          fromAccount: accountNo,
          toAccount: toAccountNo,
          amount: parseFloat(amount),
        });
      }

      setResult(response.data);
      resetForm();
    } catch (err) {
      setError(
        err.response?.data?.error || 'Transaction failed.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  const activeType =
    TYPES.find((type) => type.id === activeTab) || TYPES[0];

  return (
    <div className="min-h-full bg-[#f5f6f8]">

      <div className="max-w-[1350px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">

        {/* =========================================================
            HEADER
        ========================================================= */}

        {/* =========================================================
    TRANSACTION HEADER
========================================================= */}

<section className="relative overflow-hidden rounded-3xl bg-ink-900 text-white mb-7 animate-fade-up shadow-[0_16px_40px_rgba(15,23,42,0.14)]">

  {/* Background grid */}

  <div
    className="absolute inset-0 opacity-[0.045]"
    style={{
      backgroundImage:
        'linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)',
      backgroundSize: '32px 32px',
    }}
  />

  {/* Decorative circles */}

  <div className="absolute -right-24 -top-32 w-80 h-80 rounded-full border border-white/10" />

  <div className="absolute -right-5 -top-20 w-56 h-56 rounded-full border border-brass/10" />

  <div className="absolute left-[45%] -bottom-32 w-64 h-64 rounded-full border border-white/[0.04]" />

  <div className="relative p-5 sm:p-7 lg:p-8">

    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-7">

      {/* =====================================================
          LEFT CONTENT
      ===================================================== */}

      <div className="flex items-start gap-4 sm:gap-5">

        {/* Terminal Icon */}

        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-brass text-ink-900 flex items-center justify-center shrink-0 shadow-[0_8px_20px_rgba(0,0,0,0.15)]">

          <svg
            width="25"
            height="25"
            viewBox="0 0 24 24"
            fill="none"
          >

            <rect
              x="3"
              y="4"
              width="18"
              height="16"
              rx="2.5"
              stroke="currentColor"
              strokeWidth="1.7"
            />

            <path
              d="M7 8h10M7 12h4"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />

            <circle
              cx="17"
              cy="15.5"
              r="1"
              fill="currentColor"
            />

          </svg>

        </div>

        <div>

          {/* Eyebrow */}

          <div className="flex items-center gap-2 mb-2">

            <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-white/40">
              Teller Terminal
            </span>

            <span className="w-1 h-1 rounded-full bg-white/20" />

            <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-brass">
              Live
            </span>

          </div>

          {/* Heading */}

          <h1 className="font-display text-3xl sm:text-4xl lg:text-[40px] leading-none tracking-tight">
            Transactions
          </h1>

          <p className="text-white/45 text-xs sm:text-sm mt-3 max-w-lg leading-relaxed">
            Process customer funds with controlled deposits,
            withdrawals and internal transfers.
          </p>

        </div>

      </div>

      {/* =====================================================
          RIGHT STATUS
      ===================================================== */}

      <div className="flex items-center gap-3">

        {/* System Status */}

        <div className="flex-1 sm:flex-none min-w-[180px] rounded-2xl border border-white/10 bg-white/[0.045] backdrop-blur-sm px-4 py-3.5">

          <div className="flex items-center justify-between gap-4">

            <div>

              <p className="text-[9px] font-mono uppercase tracking-wider text-white/35">
                Terminal Status
              </p>

              <div className="flex items-center gap-2 mt-2">

                <span className="relative flex w-2 h-2">

                  <span className="absolute inline-flex w-full h-full rounded-full bg-ledger-green opacity-40 animate-ping" />

                  <span className="relative inline-flex w-2 h-2 rounded-full bg-ledger-green" />

                </span>

                <span className="text-xs font-medium text-white/80">
                  Ready to process
                </span>

              </div>

            </div>

            <div className="text-right">

              <p className="text-[9px] font-mono text-white/30">
                MODE
              </p>

              <p className="text-[11px] font-mono text-brass mt-1">
                SECURE
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>

    {/* =====================================================
        BOTTOM OPERATION STRIP
    ===================================================== */}

    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-7 pt-4 border-t border-white/10">

      <div className="flex items-center gap-2">

        <span className="text-[9px] font-mono uppercase tracking-wider text-white/30">
          Available
        </span>

        <span className="text-[10px] text-white/65">
          Deposit
        </span>

      </div>

      <span className="text-white/15">•</span>

      <div className="flex items-center gap-2">

        <span className="text-[9px] font-mono uppercase tracking-wider text-white/30">
          Available
        </span>

        <span className="text-[10px] text-white/65">
          Withdrawal
        </span>

      </div>

      <span className="text-white/15">•</span>

      <div className="flex items-center gap-2">

        <span className="text-[9px] font-mono uppercase tracking-wider text-white/30">
          Available
        </span>

        <span className="text-[10px] text-white/65">
          Internal Transfer
        </span>

      </div>

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
          Audit protected
        </span>

      </div>

    </div>

  </div>

</section>

        {/* =========================================================
            MAIN WORKSPACE
        ========================================================= */}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-5 lg:gap-6">

          {/* =======================================================
              LEFT — TRANSACTION WORKSPACE
          ======================================================= */}

          <div className="min-w-0">

            {/* Transaction Selector */}

            <div className="bg-white border border-paper-line rounded-2xl overflow-hidden shadow-[0_5px_22px_rgba(15,23,42,0.04)] animate-fade-up">

              <div className="px-5 sm:px-6 pt-5 sm:pt-6">

                <div className="flex items-center justify-between gap-3 mb-5">

                  <div>

                    <p className="text-sm font-semibold text-ink-900">
                      Select operation
                    </p>

                    <p className="text-xs text-slate-soft mt-0.5">
                      Choose what you want to process
                    </p>

                  </div>

                  <span className="hidden sm:block text-[10px] font-mono uppercase tracking-wider text-slate-faint">
                    Step 01
                  </span>

                </div>

                {/* Operation Buttons */}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">

                  {TYPES.map((type) => {

                    const active = activeTab === type.id;

                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => selectType(type.id)}
                        className={`relative text-left rounded-xl border p-4 transition-all duration-200 ${
                          active
                            ? 'border-ink-900 bg-ink-900 text-white shadow-md'
                            : 'border-paper-line bg-white hover:border-ink-300 hover:bg-slate-50'
                        }`}
                      >

                        <div className="flex items-start justify-between gap-3">

                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                              active
                                ? 'bg-brass text-ink-900'
                                : 'bg-ink-50 text-ink-700'
                            }`}
                          >
                            {type.icon}
                          </div>

                          {active && (
                            <span className="text-[9px] font-mono uppercase tracking-wider text-white/45">
                              Active
                            </span>
                          )}

                        </div>

                        <p
                          className={`font-medium text-sm mt-3 ${
                            active
                              ? 'text-white'
                              : 'text-ink-900'
                          }`}
                        >
                          {type.title}
                        </p>

                        <p
                          className={`text-[11px] mt-1 leading-relaxed ${
                            active
                              ? 'text-white/45'
                              : 'text-slate-soft'
                          }`}
                        >
                          {type.desc}
                        </p>

                      </button>
                    );
                  })}

                </div>

              </div>

              {/* ===================================================
                  FORM AREA
              =================================================== */}

              <div className="p-5 sm:p-6">

                <div
                  key={activeTab}
                  className="border-t border-paper-line pt-6 animate-scale-in"
                >

                  {/* Form Heading */}

                  <div className="flex items-center gap-3 mb-6">

                    <div className="w-10 h-10 rounded-xl bg-ink-50 text-ink-700 flex items-center justify-center">
                      {activeType.icon}
                    </div>

                    <div>

                      <p className="font-display text-xl text-ink-900">
                        {activeType.title}
                      </p>

                      <p className="text-xs text-slate-soft mt-0.5">
                        Enter the transaction details below
                      </p>

                    </div>

                  </div>

                  <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                  >

                    {/* =================================================
                        FROM ACCOUNT
                    ================================================= */}

                    <div>

                      <div className="flex items-center justify-between mb-2">

                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-soft">
                          {activeTab === 'Transfer'
                            ? 'From Account'
                            : 'Customer Account'}
                        </label>

                        <span className="text-[10px] text-slate-faint">
                          Required
                        </span>

                      </div>

                      <SearchableSelect
                        placeholder="Search account number or customer"
                        value={accountNo}
                        onChange={setAccountNo}
                        options={accountOptions}
                      />

                    </div>

                    {/* =================================================
                        TRANSFER DESTINATION
                    ================================================= */}

                    {activeTab === 'Transfer' && (
                      <div className="animate-fade-up">

                        <div className="flex items-center justify-center my-1">

                          <div className="h-px bg-paper-line flex-1" />

                          <div className="mx-3 w-7 h-7 rounded-full bg-slate-50 border border-paper-line flex items-center justify-center text-slate-soft">
                            ↓
                          </div>

                          <div className="h-px bg-paper-line flex-1" />

                        </div>

                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-soft mb-2">
                          To Account
                        </label>

                        <SearchableSelect
                          placeholder="Select destination account"
                          value={toAccountNo}
                          onChange={setToAccountNo}
                          options={accountOptions.filter(
                            (o) => o.value !== accountNo
                          )}
                        />

                      </div>
                    )}

                    {/* =================================================
                        AMOUNT
                    ================================================= */}

                    <div>

                      <div className="flex items-center justify-between mb-2">

                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-soft">
                          Transaction Amount
                        </label>

                        <span className="text-[10px] font-mono text-slate-faint">
                          PKR
                        </span>

                      </div>

                      <div className="relative">

                        <div className="absolute left-4 top-1/2 -translate-y-1/2">

                          <span className="text-xs font-mono text-slate-soft">
                            Rs
                          </span>

                        </div>

                        <input
                          type="number"
                          required
                          min="1"
                          step="0.01"
                          value={amount}
                          onChange={(e) =>
                            setAmount(e.target.value)
                          }
                          placeholder="0.00"
                          className="w-full pl-11 pr-5 py-4 border border-paper-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brass/60 focus:border-brass text-lg font-mono text-ink-900 bg-white transition-all"
                        />

                      </div>

                      <div className="flex items-center justify-between gap-3 mt-2">

                        <p className="text-[11px] text-slate-soft">
                          Enter the exact amount to be processed.
                        </p>

                        <p className="hidden sm:block text-[10px] font-mono text-slate-faint whitespace-nowrap">
                          LIMIT CHECK
                        </p>

                      </div>

                    </div>

                    {/* =================================================
                        APPROVAL NOTICE
                    ================================================= */}

                    <div className="flex items-start gap-3 rounded-xl bg-[#faf9f5] border border-brass/20 px-4 py-3.5">

                      <div className="w-7 h-7 rounded-lg bg-brass-100 text-brass-dark flex items-center justify-center shrink-0">

                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M12 9v4m0 4h.01M10.3 3.8L2.7 17a2 2 0 001.7 3h15.2a2 2 0 001.7-3L13.7 3.8a2 2 0 00-3.4 0z"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>

                      </div>

                      <div>

                        <p className="text-xs font-medium text-ink-900">
                          Approval threshold
                        </p>

                        <p className="text-[11px] text-slate-soft mt-0.5 leading-relaxed">
                          Transactions over Rs 100,000 may require
                          additional approval before processing.
                        </p>

                      </div>

                    </div>

                    {/* =================================================
                        ERROR
                    ================================================= */}

                    {error && (
                      <div className="flex items-start gap-3 rounded-xl px-4 py-3.5 bg-ledger-red-100 border border-ledger-red/25 text-ledger-red animate-fade-up">

                        <span className="text-base">
                          !
                        </span>

                        <p className="text-sm">
                          {error}
                        </p>

                      </div>
                    )}

                    {/* =================================================
                        SUCCESS / PENDING
                    ================================================= */}

                    {result && (
                      <div
                        className={`rounded-xl px-4 py-4 animate-scale-in ${
                          result.pending
                            ? 'bg-brass-100 border border-brass/35 text-brass-dark'
                            : 'bg-ledger-green-100 border border-ledger-green/25 text-ledger-green'
                        }`}
                      >

                        <div className="flex items-start gap-3">

                          <div className="text-lg shrink-0">
                            {result.pending ? '⏳' : '✓'}
                          </div>

                          <div>

                            <p className="font-semibold text-sm">
                              {result.pending
                                ? 'Pending Approval'
                                : 'Transaction Successful'}
                            </p>

                            <p className="text-xs mt-1 leading-relaxed opacity-80">
                              {result.message}
                            </p>

                          </div>

                        </div>

                      </div>
                    )}

                    {/* =================================================
                        SUBMIT
                    ================================================= */}

                    <button
                      type="submit"
                      disabled={
                        submitting ||
                        !accountNo ||
                        (activeTab === 'Transfer' &&
                          !toAccountNo) ||
                        !amount
                      }
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                    >

                      {submitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing transaction...
                        </>
                      ) : (
                        <>
                          {activeType.icon}
                          Process {activeTab}
                        </>
                      )}

                    </button>

                  </form>

                </div>

              </div>

            </div>

          </div>

          {/* =======================================================
              RIGHT — BANKING INFO PANEL
          ======================================================= */}

          <aside className="space-y-5">

            {/* Transaction Summary */}

            <div className="bg-ink-900 text-white rounded-2xl overflow-hidden shadow-[0_12px_30px_rgba(15,23,42,0.13)] animate-fade-up">

              <div className="p-5 sm:p-6">

                <div className="flex items-center justify-between mb-6">

                  <div>

                    <p className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/40">
                      Current Operation
                    </p>

                    <p className="font-display text-2xl mt-2">
                      {activeTab}
                    </p>

                  </div>

                  <div className="w-11 h-11 rounded-xl bg-white/10 text-brass flex items-center justify-center">
                    {activeType.icon}
                  </div>

                </div>

                <div className="space-y-3">

                  <div className="flex items-center justify-between py-3 border-t border-white/10">

                    <span className="text-xs text-white/40">
                      Account
                    </span>

                    <span className="font-mono text-[11px] text-white/75 truncate max-w-[150px]">
                      {accountNo || 'Not selected'}
                    </span>

                  </div>

                  {activeTab === 'Transfer' && (
                    <div className="flex items-center justify-between py-3 border-t border-white/10">

                      <span className="text-xs text-white/40">
                        Destination
                      </span>

                      <span className="font-mono text-[11px] text-white/75 truncate max-w-[150px]">
                        {toAccountNo || 'Not selected'}
                      </span>

                    </div>
                  )}

                  <div className="flex items-center justify-between py-3 border-t border-white/10">

                    <span className="text-xs text-white/40">
                      Amount
                    </span>

                    <span className="font-mono text-sm text-brass">
                      {amount
                        ? `Rs ${parseFloat(amount).toLocaleString(
                            'en-PK'
                          )}`
                        : 'Rs 0'}
                    </span>

                  </div>

                </div>

              </div>

              <div className="px-5 sm:px-6 py-4 bg-white/[0.035] border-t border-white/10">

                <div className="flex items-center gap-2">

                  <span className="w-1.5 h-1.5 rounded-full bg-ledger-green" />

                  <span className="text-[10px] text-white/45">
                    Secure transaction workspace
                  </span>

                </div>

              </div>

            </div>

            {/* Security Information */}

            <div className="bg-white border border-paper-line rounded-2xl p-5 sm:p-6 animate-fade-up">

              <div className="flex items-center gap-3 mb-5">

                <div className="w-9 h-9 rounded-xl bg-ledger-green-100 text-ledger-green flex items-center justify-center">

                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                  >

                    <path
                      d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />

                    <path
                      d="m9 12 2 2 4-4"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                  </svg>

                </div>

                <div>

                  <p className="text-sm font-medium text-ink-900">
                    Transaction controls
                  </p>

                  <p className="text-[10px] text-slate-soft mt-0.5">
                    Banking policy safeguards
                  </p>

                </div>

              </div>

              <div className="space-y-4">

                <div className="flex items-start gap-3">

                  <span className="w-1.5 h-1.5 rounded-full bg-ledger-green mt-1.5 shrink-0" />

                  <div>

                    <p className="text-xs font-medium text-ink-900">
                      Account validation
                    </p>

                    <p className="text-[11px] text-slate-soft mt-0.5">
                      Only eligible customer accounts can be
                      selected.
                    </p>

                  </div>

                </div>

                <div className="flex items-start gap-3">

                  <span className="w-1.5 h-1.5 rounded-full bg-ledger-green mt-1.5 shrink-0" />

                  <div>

                    <p className="text-xs font-medium text-ink-900">
                      Term deposits protected
                    </p>

                    <p className="text-[11px] text-slate-soft mt-0.5">
                      Term deposit accounts are excluded from
                      regular transactions.
                    </p>

                  </div>

                </div>

                <div className="flex items-start gap-3">

                  <span className="w-1.5 h-1.5 rounded-full bg-brass-dark mt-1.5 shrink-0" />

                  <div>

                    <p className="text-xs font-medium text-ink-900">
                      Approval threshold
                    </p>

                    <p className="text-[11px] text-slate-soft mt-0.5">
                      High-value transactions may require
                      authorization.
                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* Quick Reference */}

            <div className="bg-white border border-paper-line rounded-2xl p-5 animate-fade-up">

              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-soft mb-4">
                Operation Guide
              </p>

              <div className="space-y-3">

                {TYPES.map((type) => (

                  <button
                    key={type.id}
                    type="button"
                    onClick={() => selectType(type.id)}
                    className="w-full flex items-center gap-3 text-left group"
                  >

                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        activeTab === type.id
                          ? 'bg-ink-900 text-brass'
                          : 'bg-slate-50 text-slate-soft group-hover:bg-ink-50 group-hover:text-ink-900'
                      }`}
                    >
                      {type.icon}
                    </div>

                    <div className="min-w-0">

                      <p className="text-xs font-medium text-ink-900">
                        {type.short}
                      </p>

                      <p className="text-[10px] text-slate-soft truncate">
                        {type.desc}
                      </p>

                    </div>

                  </button>

                ))}

              </div>

            </div>

          </aside>

        </div>

        {/* =========================================================
            FOOTER SECURITY NOTE
        ========================================================= */}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mt-6 text-[10px] font-mono uppercase tracking-wider text-slate-faint text-center">

          <div className="flex items-center gap-1.5">

            <svg
              width="12"
              height="12"
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

            Authorized banking operation

          </div>

          <span className="hidden sm:block">
            •
          </span>

          <span>
            All activity is recorded in the audit trail
          </span>

        </div>

      </div>
    </div>
  );
}