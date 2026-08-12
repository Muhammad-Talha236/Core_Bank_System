import { useEffect, useMemo, useState } from 'react';
import customerApi from '../../api/customerClient';

export default function CustomerTransfer() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const [transferForm, setTransferForm] = useState({
    toAccount: '',
    amount: '',
  });

  const [transferError, setTransferError] = useState('');
  const [transferResult, setTransferResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAccounts() {
      try {
        const { data } = await customerApi.get(
          '/customer-portal/accounts'
        );

        setAccounts(data);

        if (data.length > 0) {
          setSelectedAccount(data[0]);
        }
      } catch {
        setTransferError(
          'Unable to load your accounts. Please refresh the page.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadAccounts();
  }, []);

  const amount = Number(transferForm.amount || 0);
  const balance = Number(selectedAccount?.Balance || 0);

  const remainingBalance = Math.max(balance - amount, 0);

  const balancePercentage =
    balance > 0
      ? Math.min((amount / balance) * 100, 100)
      : 0;

  const formattedBalance = balance.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
  });

  const formattedRemaining = remainingBalance.toLocaleString(
    'en-PK',
    {
      minimumFractionDigits: 2,
    }
  );

  const accountLabel = useMemo(() => {
    if (!selectedAccount) return 'No account selected';

    return `${selectedAccount.Type || 'Account'} •••• ${String(
      selectedAccount.AccountNo
    ).slice(-4)}`;
  }, [selectedAccount]);

  const isValid =
    selectedAccount &&
    transferForm.toAccount &&
    amount > 0 &&
    amount <= 100000 &&
    amount <= balance &&
    String(transferForm.toAccount) !==
      String(selectedAccount.AccountNo);

  function updateForm(key, value) {
    setTransferForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    setTransferError('');
    setTransferResult(null);
  }

  function setQuickAmount(value) {
    if (value <= balance) {
      updateForm('amount', String(value));
    }
  }

  async function handleTransfer(e) {
    e.preventDefault();

    setTransferError('');
    setTransferResult(null);

    if (!selectedAccount) {
      setTransferError('Please select a source account.');
      return;
    }

    if (
      String(transferForm.toAccount) ===
      String(selectedAccount.AccountNo)
    ) {
      setTransferError(
        'You cannot transfer money to the same account.'
      );
      return;
    }

    if (amount > 100000) {
      setTransferError(
        'Online transfers are limited to Rs 100,000.'
      );
      return;
    }

    if (amount > balance) {
      setTransferError(
        'Insufficient balance in the selected account.'
      );
      return;
    }

    setSubmitting(true);

    try {
      const { data } = await customerApi.post(
        '/customer-portal/transfer',
        {
          fromAccount: selectedAccount.AccountNo,
          toAccount: transferForm.toAccount,
          amount,
        }
      );

      setTransferResult(data);

      setTransferForm({
        toAccount: '',
        amount: '',
      });

      const res = await customerApi.get(
        '/customer-portal/accounts'
      );

      setAccounts(res.data);

      setSelectedAccount(
        res.data.find(
          (account) =>
            account.AccountNo === selectedAccount.AccountNo
        ) || res.data[0]
      );
    } catch (err) {
      setTransferError(
        err.response?.data?.error ||
          'Transfer failed. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-9 h-9 rounded-full border-2 border-paper-line border-t-brass animate-spin mx-auto" />
          <p className="mt-4 text-sm text-slate-soft">
            Preparing your transfer...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full text-ink-900">
      <div className="max-w-[1220px] mx-auto px-5 sm:px-8 py-8 lg:py-11">

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">

          <div className="animate-fade-up">

            <div className="flex items-center gap-3 mb-4">

              <div className="w-10 h-10 rounded-xl bg-ink-900 flex items-center justify-center shadow-sm">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="text-brass"
                  strokeWidth="1.6"
                >
                  <path d="M5 12h14" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </div>

              <div>
                <p className="eyebrow">
                  Payments
                </p>

                <p className="text-xs text-slate-soft mt-0.5">
                  Secure banking
                </p>
              </div>
            </div>

            <h1 className="font-display text-[38px] sm:text-[46px] leading-none tracking-[-0.035em] text-ink-900">
              Send money
              <span className="text-brass-dark"> simply.</span>
            </h1>

            <p className="mt-4 text-sm leading-6 text-slate-soft max-w-xl">
              Transfer funds securely to another account with a
              simple, transparent and controlled banking experience.
            </p>
          </div>

          {/* DAILY LIMIT */}
          <div className="hidden sm:flex items-center gap-3 px-4 py-3 rounded-xl border border-paper-line bg-paper animate-fade-up">

            <div className="w-9 h-9 rounded-lg bg-brass-100 flex items-center justify-center">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="text-brass-dark"
                strokeWidth="1.6"
              >
                <circle cx="12" cy="12" r="8" />
                <path d="M12 8v4l2.5 2" />
              </svg>
            </div>

            <div>
              <p className="text-[9px] font-mono uppercase tracking-wider text-slate-soft">
                Daily online limit
              </p>

              <p className="font-mono text-sm text-ink-900 mt-0.5">
                Rs 100,000
              </p>
            </div>
          </div>
        </div>

        {/* STEPS */}
        <div className="flex items-center gap-3 mb-7 animate-fade-up">

          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-ink-900 text-paper flex items-center justify-center text-[10px] font-mono">
              01
            </span>

            <span className="text-xs font-medium text-ink-900">
              Transfer details
            </span>
          </div>

          <div className="w-12 sm:w-20 h-px bg-paper-line" />

          <div className="flex items-center gap-2 opacity-45">
            <span className="w-7 h-7 rounded-full border border-paper-line flex items-center justify-center text-[10px] font-mono">
              02
            </span>

            <span className="text-xs text-slate-soft">
              Confirmation
            </span>
          </div>
        </div>

        {/* MAIN */}
        <div className="grid grid-cols-1 lg:grid-cols-[0.82fr_1.4fr] gap-6">

          {/* LEFT */}
          <div className="space-y-5">

            {/* ACCOUNT SUMMARY */}
            <section className="relative overflow-hidden rounded-2xl bg-ink-900 text-paper p-6 shadow-elevated animate-fade-up">

              <div className="absolute -right-16 -top-16 w-44 h-44 rounded-full border border-brass/15" />
              <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full border border-brass/10" />

              <div className="relative">

                <div className="flex justify-between items-start mb-7">

                  <div>
                    <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-paper/55">
                      Source account
                    </p>

                    <p className="text-sm text-paper mt-1">
                      {accountLabel}
                    </p>
                  </div>

                  <span className="w-2 h-2 rounded-full bg-ledger-green shadow-[0_0_10px_rgba(100,130,90,0.5)]" />
                </div>

                <p className="text-[10px] uppercase tracking-[0.16em] font-mono text-paper/45">
                  Available balance
                </p>

                <p className="font-mono text-[28px] mt-1 tracking-[-0.03em]">
                  Rs {formattedBalance}
                </p>

                {/* BALANCE METER */}
                <div className="mt-7">

                  <div className="flex justify-between mb-2">
                    <span className="text-[10px] text-paper/45">
                      Transfer utilization
                    </span>

                    <span className="text-[10px] font-mono text-brass">
                      {Math.round(balancePercentage)}%
                    </span>
                  </div>

                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brass transition-all duration-500"
                      style={{
                        width: `${balancePercentage}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-7 pt-4 border-t border-white/10 flex justify-between">
                  <span className="text-[10px] text-paper/45">
                    After transfer
                  </span>

                  <span className="font-mono text-xs text-brass-light">
                    Rs {formattedRemaining}
                  </span>
                </div>
              </div>
            </section>

            {/* ACCOUNTS */}
            <section className="bg-paper rounded-2xl border border-paper-line p-5 shadow-soft">

              <div className="flex items-center justify-between mb-4">

                <p className="text-[10px] font-mono uppercase tracking-[0.17em] text-slate-soft">
                  Your accounts
                </p>

                <span className="text-[10px] text-brass-dark">
                  {accounts.length} available
                </span>
              </div>

              <div className="space-y-2">

                {accounts.map((account) => {

                  const active =
                    selectedAccount?.AccountNo ===
                    account.AccountNo;

                  return (
                    <button
                      type="button"
                      key={account.AccountNo}
                      onClick={() => {
                        setSelectedAccount(account);
                        setTransferError('');
                      }}
                      className={`w-full rounded-xl px-4 py-3 flex items-center justify-between border transition-all ${
                        active
                          ? 'border-brass bg-brass-100 shadow-sm'
                          : 'border-transparent bg-paper-warm hover:border-paper-line hover:bg-paper'
                      }`}
                    >

                      <div className="flex items-center gap-3">

                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            active
                              ? 'bg-ink-900 text-brass'
                              : 'bg-paper-line text-slate-soft'
                          }`}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                          >
                            <rect
                              x="3"
                              y="5"
                              width="18"
                              height="14"
                              rx="2"
                            />
                            <path d="M3 10h18" />
                          </svg>
                        </div>

                        <div className="text-left">

                          <p className="text-xs font-medium text-ink-900">
                            {account.Type || 'Account'}
                          </p>

                          <p className="font-mono text-[10px] text-slate-soft mt-0.5">
                            •••• {String(account.AccountNo).slice(-4)}
                          </p>
                        </div>
                      </div>

                      <span className="font-mono text-xs text-ink-700">
                        Rs{' '}
                        {Number(account.Balance).toLocaleString(
                          'en-PK'
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* SECURITY NOTE */}
            <div className="flex items-center gap-3 px-2">

              <div className="w-7 h-7 rounded-full bg-ledger-green-100 flex items-center justify-center text-ledger-green">
                ✓
              </div>

              <p className="text-[11px] leading-5 text-slate-soft">
                Protected by secure transaction processing.
              </p>
            </div>
          </div>

          {/* RIGHT FORM */}
          <form
            onSubmit={handleTransfer}
            className="bg-paper rounded-2xl border border-paper-line shadow-elevated overflow-hidden animate-scale-in"
          >

            {/* GOLD ACCENT */}
            <div className="h-1 bg-brass" />

            <div className="p-6 sm:p-8">

              <div className="flex items-center justify-between mb-8">

                <div>

                  <p className="eyebrow">
                    Payment details
                  </p>

                  <h2 className="font-display text-[25px] mt-1 text-ink-900">
                    Where should we send it?
                  </h2>
                </div>

                <div className="hidden sm:flex w-10 h-10 rounded-xl bg-brass-100 items-center justify-center">

                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className="text-brass-dark"
                    strokeWidth="1.6"
                  >
                    <path d="M5 12h14" />
                    <path d="M13 6l6 6-6 6" />
                  </svg>
                </div>
              </div>

              {/* MONEY FLOW */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-8">

                <div className="rounded-xl bg-paper-warm border border-paper-line p-3">

                  <p className="text-[9px] uppercase tracking-wider font-mono text-slate-soft">
                    From
                  </p>

                  <p className="text-xs font-medium mt-1 text-ink-900">
                    {accountLabel}
                  </p>
                </div>

                <div className="w-9 h-9 rounded-full bg-ink-900 text-brass flex items-center justify-center">
                  →
                </div>

                <div className="rounded-xl bg-paper-warm border border-paper-line p-3">

                  <p className="text-[9px] uppercase tracking-wider font-mono text-slate-soft">
                    To
                  </p>

                  <p className="text-xs font-mono mt-1 truncate text-ink-700">
                    {transferForm.toAccount
                      ? `•••• ${transferForm.toAccount.slice(-4)}`
                      : 'Recipient'}
                  </p>
                </div>
              </div>

              {/* RECIPIENT */}
              <div className="mb-6">

                <label className="block text-xs font-medium mb-2 text-ink-900">
                  Recipient account number
                </label>

                <input
                  required
                  inputMode="numeric"
                  value={transferForm.toAccount}
                  placeholder="Enter account number"
                  onChange={(e) =>
                    updateForm(
                      'toAccount',
                      e.target.value.replace(/\D/g, '')
                    )
                  }
                  className="w-full h-12 rounded-xl border border-paper-line bg-paper-warm px-4 font-mono text-sm outline-none transition-all focus:border-brass focus:ring-4 focus:ring-brass/10 placeholder:text-slate-soft"
                />
              </div>

              {/* AMOUNT */}
              <div className="mb-6">

                <div className="flex justify-between items-center mb-2">

                  <label className="text-xs font-medium text-ink-900">
                    Amount
                  </label>

                  <span className="text-[10px] font-mono text-slate-soft">
                    Available: Rs{' '}
                    {Number(balance).toLocaleString('en-PK')}
                  </span>
                </div>

                <div className="relative">

                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-soft">
                    Rs
                  </span>

                  <input
                    type="number"
                    required
                    min="1"
                    max="100000"
                    step="0.01"
                    value={transferForm.amount}
                    placeholder="0.00"
                    onChange={(e) =>
                      updateForm('amount', e.target.value)
                    }
                    className="w-full h-[70px] rounded-xl border border-paper-line bg-paper-warm pl-12 pr-5 font-mono text-[28px] text-ink-900 outline-none transition-all focus:border-brass focus:ring-4 focus:ring-brass/10 placeholder:text-paper-line"
                  />
                </div>

                {/* QUICK AMOUNTS */}
                <div className="flex gap-2 mt-3 flex-wrap">

                  {[1000, 5000, 10000, 25000].map(
                    (value) => (
                      <button
                        key={value}
                        type="button"
                        disabled={value > balance}
                        onClick={() => setQuickAmount(value)}
                        className="px-3.5 py-2 rounded-lg bg-paper-warm border border-paper-line text-[10px] font-mono text-slate-soft hover:bg-ink-900 hover:text-paper hover:border-ink-900 transition-all disabled:opacity-35"
                      >
                        Rs {value.toLocaleString()}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* SUMMARY */}
              <div className="rounded-2xl border border-paper-line bg-paper-warm p-5 mb-6">

                <div className="flex justify-between mb-4">

                  <p className="text-[10px] uppercase tracking-[0.17em] font-mono text-slate-soft">
                    Transaction summary
                  </p>

                  <span className="text-[10px] font-mono text-brass-dark">
                    PREVIEW
                  </span>
                </div>

                <div className="space-y-3">

                  <div className="flex justify-between text-xs">
                    <span className="text-slate-soft">
                      Transfer amount
                    </span>

                    <span className="font-mono text-ink-900">
                      Rs{' '}
                      {amount.toLocaleString('en-PK', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-slate-soft">
                      Processing fee
                    </span>

                    <span className="font-mono text-ledger-green">
                      Rs 0.00
                    </span>
                  </div>

                  <div className="h-px bg-paper-line my-2" />

                  <div className="flex justify-between items-end">

                    <span className="text-xs font-medium text-ink-900">
                      Total
                    </span>

                    <span className="font-mono text-[19px] text-ink-900">
                      Rs{' '}
                      {amount.toLocaleString('en-PK', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* ERROR */}
              {transferError && (
                <div className="mb-5 rounded-xl border border-ledger-red/30 bg-ledger-red-100 px-4 py-3 animate-fade-up">
                  <p className="text-xs text-ledger-red">
                    {transferError}
                  </p>
                </div>
              )}

              {/* SUCCESS */}
              {transferResult && (
                <div className="mb-5 rounded-xl border border-ledger-green/30 bg-ledger-green-100 p-4 animate-scale-in">

                  <div className="flex gap-3">

                    <div className="w-7 h-7 rounded-full bg-ledger-green text-white flex items-center justify-center text-xs">
                      ✓
                    </div>

                    <div>

                      <p className="text-sm font-medium text-ledger-green">
                        Transfer completed
                      </p>

                      <p className="text-xs text-ledger-green mt-1">
                        {transferResult.message}
                      </p>

                      {transferResult.newBalance !==
                        undefined && (
                        <p className="font-mono text-xs mt-2 text-ink-900">
                          New balance: Rs{' '}
                          {Number(
                            transferResult.newBalance
                          ).toLocaleString('en-PK', {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* CTA */}
              <button
                type="submit"
                disabled={submitting || !isValid}
                className="relative overflow-hidden w-full h-[56px] rounded-xl bg-ink-900 text-paper font-medium text-sm transition-all duration-300 hover:bg-ink-800 hover:shadow-elevated disabled:opacity-40 disabled:cursor-not-allowed"
              >

                <span className="relative z-10 flex items-center justify-center gap-3">

                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Continue to confirmation
                      <span className="text-brass text-lg">
                        →
                      </span>
                    </>
                  )}
                </span>

                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
              </button>

              <p className="text-center text-[10px] text-slate-soft mt-4">
                By continuing, you confirm that the recipient
                details are correct.
              </p>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
}