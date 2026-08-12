import { useEffect, useMemo, useState } from 'react';
import customerApi from '../../api/customerClient';

export default function CustomerBills() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [billers, setBillers] = useState([]);
  const [billForm, setBillForm] = useState({
    billerId: '',
    consumerNumber: '',
    amount: '',
  });

  const [billError, setBillError] = useState('');
  const [billResult, setBillResult] = useState('');
  const [billHistory, setBillHistory] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAccounts();
    loadBillers();
    loadHistory();
  }, []);

  async function loadAccounts() {
    try {
      const { data } = await customerApi.get('/customer-portal/accounts');

      setAccounts(data);

      if (data.length > 0) {
        setSelectedAccount(data[0]);
      }
    } catch {
      setLoadError('Could not load your accounts. Please refresh the page.');
    }
  }

  async function loadBillers() {
    try {
      const { data } = await customerApi.get('/customer-portal/billers');
      setBillers(data);
    } catch {
      setLoadError('Could not load the list of billers. Please refresh the page.');
    }
  }

  async function loadHistory() {
    try {
      const { data } = await customerApi.get('/customer-portal/bill-payments');
      setBillHistory(data);
    } catch {
      setLoadError('Could not load your payment history.');
    }
  }

  async function handleBillPay(e) {
    e.preventDefault();

    setBillError('');
    setBillResult('');

    if (!selectedAccount) {
      setBillError('Please select a payment account.');
      return;
    }

    if (!billForm.billerId) {
      setBillError('Please select a biller.');
      return;
    }

    if (!billForm.consumerNumber.trim()) {
      setBillError('Please enter your consumer/reference number.');
      return;
    }

    if (!billForm.amount || parseFloat(billForm.amount) <= 0) {
      setBillError('Please enter a valid payment amount.');
      return;
    }

    if (parseFloat(billForm.amount) > parseFloat(selectedAccount.Balance)) {
      setBillError('Insufficient balance in the selected account.');
      return;
    }

    setSubmitting(true);

    try {
      const { data } = await customerApi.post(
        '/customer-portal/bill-payment',
        {
          fromAccount: selectedAccount.AccountNo,
          billerId: billForm.billerId,
          consumerNumber: billForm.consumerNumber,
          amount: parseFloat(billForm.amount),
        }
      );

      setBillResult(data.message);

      setBillForm({
        billerId: '',
        consumerNumber: '',
        amount: '',
      });

      await loadHistory();
      await loadAccounts();
    } catch (err) {
      setBillError(
        err.response?.data?.error || 'Payment failed. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  const selectedBiller = useMemo(
    () =>
      billers.find(
        (b) => String(b.BillerID) === String(billForm.billerId)
      ),
    [billers, billForm.billerId]
  );

  const formattedBalance = selectedAccount
    ? parseFloat(selectedAccount.Balance || 0).toLocaleString('en-PK', {
        minimumFractionDigits: 2,
      })
    : '0.00';

  const totalPayments = billHistory.reduce(
    (sum, payment) => sum + parseFloat(payment.Amount || 0),
    0
  );

  return (
    <div className="min-h-full pb-12">
      <div className="max-w-[1250px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* =====================================================
            HEADER
        ====================================================== */}
        <section className="relative overflow-hidden rounded-[28px] bg-ink-900 text-paper p-6 sm:p-8 lg:p-10 mb-7 animate-fade-up">

          <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-brass/10 blur-2xl" />
          <div className="absolute right-16 bottom-[-90px] w-52 h-52 rounded-full border border-brass/10" />
          <div className="absolute left-1/2 top-0 w-px h-full bg-white/[0.03]" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">

            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="w-9 h-9 rounded-xl bg-brass/15 border border-brass/25 flex items-center justify-center">
                  <span className="text-brass text-sm">✦</span>
                </span>

                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-mono text-brass">
                    Digital Banking
                  </p>
                  <p className="text-xs text-white/45 mt-0.5">
                    Secure payments
                  </p>
                </div>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] leading-tight tracking-tight">
                Pay your bills,
                <span className="text-brass"> effortlessly.</span>
              </h1>

              <p className="text-sm sm:text-base text-white/55 mt-3 max-w-xl leading-relaxed">
                Pay utility, mobile and internet bills directly from your
                account with a secure and seamless banking experience.
              </p>
            </div>

            {/* Balance mini card */}
            <div className="w-full lg:w-[285px] shrink-0 rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-sm p-5">

              <div className="flex items-center justify-between mb-5">
                <span className="text-[10px] uppercase tracking-[0.18em] font-mono text-white/40">
                  Available Balance
                </span>

                <span className="w-2 h-2 rounded-full bg-ledger-green shadow-[0_0_10px_rgba(0,0,0,0.2)]" />
              </div>

              <p className="font-mono text-2xl sm:text-3xl text-white tracking-tight">
                Rs {formattedBalance}
              </p>

              <p className="text-xs text-white/35 mt-2 font-mono">
                {selectedAccount
                  ? `${selectedAccount.Type} •••• ${String(
                      selectedAccount.AccountNo
                    ).slice(-4)}`
                  : 'No account selected'}
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================
            ERROR
        ====================================================== */}
        {loadError && (
          <div className="mb-6 rounded-2xl border border-ledger-red/20 bg-ledger-red-100/60 px-5 py-4 flex gap-3 items-start animate-fade-up">
            <div className="w-8 h-8 shrink-0 rounded-full bg-ledger-red/10 flex items-center justify-center text-ledger-red">
              !
            </div>

            <div>
              <p className="text-sm font-medium text-ink-900">
                Something went wrong
              </p>
              <p className="text-xs text-slate-soft mt-0.5">
                {loadError}
              </p>
            </div>
          </div>
        )}

        {/* =====================================================
            MAIN GRID
        ====================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)] gap-6">

          {/* =================================================
              PAYMENT PANEL
          ================================================== */}
          <section
            className="rounded-[26px] border border-paper-line bg-white shadow-[0_12px_40px_rgba(15,23,42,0.05)] overflow-hidden animate-fade-up"
            style={{ animationDelay: '80ms' }}
          >

            {/* Panel heading */}
            <div className="px-6 sm:px-8 pt-7 sm:pt-8 pb-5 border-b border-paper-line">

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] font-mono text-brass-dark mb-1">
                    New Payment
                  </p>

                  <h2 className="font-display text-2xl text-ink-900">
                    Pay a bill
                  </h2>

                  <p className="text-sm text-slate-soft mt-1">
                    Complete your payment in a few simple steps.
                  </p>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-soft">
                  <span className="w-6 h-6 rounded-full bg-ink-900 text-paper flex items-center justify-center font-mono text-[10px]">
                    01
                  </span>
                  <span>Secure checkout</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleBillPay} className="p-6 sm:p-8">

              {/* Step 1 */}
              <div className="mb-7">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-7 h-7 rounded-full bg-ink-900 text-paper flex items-center justify-center font-mono text-[10px]">
                    1
                  </span>

                  <div>
                    <p className="text-sm font-medium text-ink-900">
                      Choose payment account
                    </p>
                    <p className="text-xs text-slate-soft">
                      Select where the payment should be deducted.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3">
                  {accounts.map((account) => {
                    const isSelected =
                      String(selectedAccount?.AccountNo) ===
                      String(account.AccountNo);

                    return (
                      <button
                        key={account.AccountNo}
                        type="button"
                        onClick={() => setSelectedAccount(account)}
                        className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 ${
                          isSelected
                            ? 'border-brass bg-brass/[0.06] shadow-[0_8px_24px_rgba(0,0,0,0.04)]'
                            : 'border-paper-line bg-paper/30 hover:border-ink-300 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">

                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${
                                isSelected
                                  ? 'bg-ink-900 text-brass'
                                  : 'bg-paper text-ink-700'
                              }`}
                            >
                              $
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm font-medium text-ink-900">
                                {account.Type}
                              </p>

                              <p className="font-mono text-[11px] text-slate-soft truncate">
                                Account ••••{' '}
                                {String(account.AccountNo).slice(-4)}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="font-mono text-sm text-ink-900">
                              Rs{' '}
                              {parseFloat(account.Balance || 0).toLocaleString(
                                'en-PK',
                                { minimumFractionDigits: 2 }
                              )}
                            </p>

                            {isSelected && (
                              <p className="text-[10px] uppercase tracking-wider text-brass-dark mt-1 font-mono">
                                Selected
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {accounts.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-paper-line p-6 text-center">
                      <p className="text-sm text-slate-soft">
                        No payment accounts available.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-paper-line mb-7" />

              {/* Step 2 */}
              <div className="mb-7">

                <div className="flex items-center gap-3 mb-5">
                  <span className="w-7 h-7 rounded-full bg-ink-900 text-paper flex items-center justify-center font-mono text-[10px]">
                    2
                  </span>

                  <div>
                    <p className="text-sm font-medium text-ink-900">
                      Bill details
                    </p>
                    <p className="text-xs text-slate-soft">
                      Tell us what you'd like to pay.
                    </p>
                  </div>
                </div>

                <div className="space-y-5">

                  {/* Biller */}
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.15em] font-mono text-slate-soft mb-2">
                      Biller
                    </label>

                    <div className="relative">
                      <select
                        required
                        value={billForm.billerId}
                        onChange={(e) =>
                          setBillForm({
                            ...billForm,
                            billerId: e.target.value,
                          })
                        }
                        className="appearance-none w-full h-12 px-4 pr-10 rounded-xl border border-paper-line bg-white text-sm text-ink-900 focus:outline-none focus:border-brass focus:ring-4 focus:ring-brass/10 transition"
                      >
                        <option value="">
                          Select a biller
                        </option>

                        {billers.map((b) => (
                          <option
                            key={b.BillerID}
                            value={b.BillerID}
                          >
                            {b.BillerName} • {b.BillerType}
                          </option>
                        ))}
                      </select>

                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-soft">
                        ↓
                      </span>
                    </div>

                    {selectedBiller && (
                      <div className="flex items-center gap-2 mt-2 px-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-ledger-green" />
                        <span className="text-[11px] text-slate-soft">
                          {selectedBiller.BillerType} payment
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Consumer number */}
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.15em] font-mono text-slate-soft mb-2">
                      Consumer / Reference Number
                    </label>

                    <input
                      required
                      value={billForm.consumerNumber}
                      onChange={(e) =>
                        setBillForm({
                          ...billForm,
                          consumerNumber: e.target.value,
                        })
                      }
                      placeholder="Enter your reference number"
                      className="w-full h-12 px-4 rounded-xl border border-paper-line bg-white text-sm font-mono text-ink-900 placeholder:text-slate-soft/60 focus:outline-none focus:border-brass focus:ring-4 focus:ring-brass/10 transition"
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[11px] uppercase tracking-[0.15em] font-mono text-slate-soft">
                        Payment Amount
                      </label>

                      <span className="text-[10px] font-mono text-slate-soft">
                        PKR
                      </span>
                    </div>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-soft">
                        Rs
                      </span>

                      <input
                        type="number"
                        required
                        min="1"
                        step="0.01"
                        value={billForm.amount}
                        onChange={(e) =>
                          setBillForm({
                            ...billForm,
                            amount: e.target.value,
                          })
                        }
                        placeholder="0.00"
                        className="w-full h-14 pl-12 pr-4 rounded-xl border border-paper-line bg-white font-mono text-xl text-ink-900 placeholder:text-slate-soft/40 focus:outline-none focus:border-brass focus:ring-4 focus:ring-brass/10 transition"
                      />
                    </div>

                    {selectedAccount && billForm.amount && (
                      <div className="flex justify-between mt-2 px-1 text-[11px]">
                        <span className="text-slate-soft">
                          Remaining after payment
                        </span>

                        <span
                          className={`font-mono ${
                            parseFloat(selectedAccount.Balance) -
                              parseFloat(billForm.amount) <
                            0
                              ? 'text-ledger-red'
                              : 'text-ink-900'
                          }`}
                        >
                          Rs{' '}
                          {Math.max(
                            0,
                            parseFloat(selectedAccount.Balance) -
                              parseFloat(billForm.amount)
                          ).toLocaleString('en-PK', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Feedback */}
              {billError && (
                <div className="mb-5 rounded-2xl border border-ledger-red/20 bg-ledger-red-100/50 px-4 py-3 flex gap-3">
                  <span className="w-7 h-7 rounded-full bg-ledger-red/10 text-ledger-red flex items-center justify-center shrink-0">
                    !
                  </span>

                  <div>
                    <p className="text-xs font-medium text-ink-900">
                      Payment could not be completed
                    </p>
                    <p className="text-xs text-slate-soft mt-0.5">
                      {billError}
                    </p>
                  </div>
                </div>
              )}

              {billResult && (
                <div className="mb-5 rounded-2xl border border-ledger-green/20 bg-ledger-green-100/50 px-4 py-3 flex gap-3">
                  <span className="w-7 h-7 rounded-full bg-ledger-green/10 text-ledger-green flex items-center justify-center shrink-0">
                    ✓
                  </span>

                  <div>
                    <p className="text-xs font-medium text-ink-900">
                      Payment successful
                    </p>
                    <p className="text-xs text-slate-soft mt-0.5">
                      {billResult}
                    </p>
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || !selectedAccount}
                className="group w-full h-13 rounded-xl bg-ink-900 text-white text-sm font-medium flex items-center justify-center gap-3 hover:bg-ink-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
              >
                <span>
                  {submitting
                    ? 'Processing payment...'
                    : 'Continue to payment'}
                </span>

                {!submitting && (
                  <span className="text-brass transition-transform group-hover:translate-x-1">
                    →
                  </span>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 mt-4">
                <span className="text-[10px] text-slate-soft">
                  🔒 Secure transaction
                </span>

                <span className="w-1 h-1 rounded-full bg-paper-line" />

                <span className="text-[10px] text-slate-soft">
                  Your account details remain protected
                </span>
              </div>
            </form>
          </section>

          {/* =================================================
              SIDE PANEL
          ================================================== */}
          <aside className="space-y-6">

            {/* Payment summary */}
            <div
              className="rounded-[26px] bg-paper border border-paper-line p-6 animate-fade-up"
              style={{ animationDelay: '140ms' }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] font-mono text-brass-dark">
                    Overview
                  </p>
                  <h3 className="font-display text-xl text-ink-900 mt-1">
                    Your payments
                  </h3>
                </div>

                <span className="w-9 h-9 rounded-xl bg-white border border-paper-line flex items-center justify-center text-ink-700">
                  ↗
                </span>
              </div>

              <div className="rounded-2xl bg-white border border-paper-line p-5 mb-3">
                <p className="text-[10px] uppercase tracking-[0.15em] font-mono text-slate-soft">
                  Total payments
                </p>

                <p className="font-display text-3xl text-ink-900 mt-2">
                  {billHistory.length}
                </p>

                <p className="text-xs text-slate-soft mt-1">
                  Successful bill transactions
                </p>
              </div>

              <div className="rounded-2xl bg-ink-900 text-paper p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-mono text-white/40">
                  Total paid
                </p>

                <p className="font-mono text-xl mt-2">
                  Rs{' '}
                  {totalPayments.toLocaleString('en-PK', {
                    minimumFractionDigits: 2,
                  })}
                </p>

                <div className="h-px bg-white/10 my-4" />

                <p className="text-[11px] text-white/40">
                  Across all recorded bill payments
                </p>
              </div>
            </div>

            {/* Help card */}
            <div
              className="rounded-[26px] border border-paper-line bg-white p-6 animate-fade-up"
              style={{ animationDelay: '200ms' }}
            >
              <div className="w-10 h-10 rounded-xl bg-brass/10 text-brass-dark flex items-center justify-center mb-4">
                ?
              </div>

              <h3 className="font-display text-lg text-ink-900">
                Before you pay
              </h3>

              <div className="space-y-3 mt-4">
                {[
                  'Make sure your consumer number is correct.',
                  'Check your available account balance.',
                  'Review the amount before submitting.',
                ].map((text, index) => (
                  <div key={index} className="flex gap-3">
                    <span className="font-mono text-[10px] text-brass-dark mt-0.5">
                      0{index + 1}
                    </span>

                    <p className="text-xs leading-relaxed text-slate-soft">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* =====================================================
            PAYMENT HISTORY
        ====================================================== */}
        <section
          className="mt-7 rounded-[26px] border border-paper-line bg-white shadow-[0_10px_35px_rgba(15,23,42,0.04)] overflow-hidden animate-fade-up"
          style={{ animationDelay: '260ms' }}
        >

          <div className="px-6 sm:px-8 py-6 border-b border-paper-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] font-mono text-brass-dark">
                Activity
              </p>

              <h2 className="font-display text-2xl text-ink-900 mt-1">
                Recent payments
              </h2>
            </div>

            <span className="text-xs text-slate-soft">
              {billHistory.length} transaction
              {billHistory.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-paper/70 border-b border-paper-line">
                  <th className="px-6 sm:px-8 py-3 text-[10px] uppercase tracking-[0.15em] font-mono text-slate-soft">
                    Biller
                  </th>

                  <th className="px-5 py-3 text-[10px] uppercase tracking-[0.15em] font-mono text-slate-soft">
                    Reference
                  </th>

                  <th className="px-5 py-3 text-[10px] uppercase tracking-[0.15em] font-mono text-slate-soft">
                    Amount
                  </th>

                  <th className="px-5 py-3 text-[10px] uppercase tracking-[0.15em] font-mono text-slate-soft">
                    Date
                  </th>

                  <th className="px-6 sm:px-8 py-3 text-[10px] uppercase tracking-[0.15em] font-mono text-slate-soft text-right">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {billHistory.map((payment, index) => (
                  <tr
                    key={payment.BillPaymentID}
                    className="border-b border-paper-line last:border-b-0 hover:bg-paper/40 transition-colors"
                  >
                    <td className="px-6 sm:px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-paper flex items-center justify-center text-xs text-ink-700">
                          $
                        </div>

                        <div>
                          <p className="text-sm font-medium text-ink-900">
                            {payment.BillerName}
                          </p>

                          <p className="text-[10px] text-slate-soft mt-0.5">
                            Bill payment
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-mono text-xs text-slate-soft">
                        {payment.ConsumerNumber}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-mono text-sm text-ink-900">
                        Rs{' '}
                        {parseFloat(payment.Amount || 0).toLocaleString(
                          'en-PK',
                          {
                            minimumFractionDigits: 2,
                          }
                        )}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div>
                        <p className="text-xs text-ink-800">
                          {new Date(payment.PaidAt).toLocaleDateString(
                            'en-PK',
                            {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            }
                          )}
                        </p>

                        <p className="text-[10px] font-mono text-slate-soft mt-0.5">
                          {new Date(payment.PaidAt).toLocaleTimeString(
                            'en-PK',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 sm:px-8 py-4 text-right">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ledger-green-100 text-ledger-green text-[10px] font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-ledger-green" />
                        Paid
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile history */}
          <div className="md:hidden divide-y divide-paper-line">
            {billHistory.map((payment) => (
              <div
                key={payment.BillPaymentID}
                className="p-5 hover:bg-paper/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">

                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-paper flex items-center justify-center text-ink-700">
                      $
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">
                        {payment.BillerName}
                      </p>

                      <p className="font-mono text-[10px] text-slate-soft mt-1 truncate">
                        {payment.ConsumerNumber}
                      </p>
                    </div>
                  </div>

                  <span className="font-mono text-sm text-ink-900 whitespace-nowrap">
                    Rs{' '}
                    {parseFloat(payment.Amount || 0).toLocaleString(
                      'en-PK',
                      {
                        minimumFractionDigits: 2,
                      }
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <span className="text-[10px] text-slate-soft">
                    {new Date(payment.PaidAt).toLocaleDateString(
                      'en-PK',
                      {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      }
                    )}
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ledger-green-100 text-ledger-green text-[10px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-ledger-green" />
                    Paid
                  </span>
                </div>
              </div>
            ))}

            {billHistory.length === 0 && (
              <div className="py-12 px-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-paper mx-auto flex items-center justify-center text-slate-soft mb-3">
                  —
                </div>

                <p className="text-sm font-medium text-ink-900">
                  No payments yet
                </p>

                <p className="text-xs text-slate-soft mt-1">
                  Your bill payment activity will appear here.
                </p>
              </div>
            )}
          </div>

          {billHistory.length === 0 && (
            <div className="hidden md:block py-14 px-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-paper mx-auto flex items-center justify-center text-slate-soft mb-3">
                —
              </div>

              <p className="text-sm font-medium text-ink-900">
                No payments yet
              </p>

              <p className="text-xs text-slate-soft mt-1">
                Your bill payment activity will appear here.
              </p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}