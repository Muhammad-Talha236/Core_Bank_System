import { useEffect, useState } from 'react';
import api from '../../api/client';
import SearchableSelect from '../../components/SearchableSelect';

const TYPES = [
  {
    id: 'Deposit',
    title: 'Deposit',
    desc: 'Add cash into a customer account.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 4v12m0 0 5-5m-5 5-5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 19h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'Withdraw',
    title: 'Withdraw',
    desc: 'Pay cash out from an account.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 20V8m0 0-5 5m5-5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 5h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'Transfer',
    title: 'Transfer',
    desc: 'Move funds between two accounts.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M4 8h13m0 0-4-4m4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 16H7m0 0 4 4m-4-4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
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
    api.get('/accounts')
      .then((res) => setAccounts(res.data.filter((a) => a.Type !== 'TermDeposit')))
      .catch(() => {});
  }, []);

  const accountOptions = accounts.map((a) => ({
    value: a.AccountNo,
    label: `${a.AccountNo} — ${a.CustomerName}`,
    sublabel: `${a.Nickname} • Rs ${parseFloat(a.Balance).toLocaleString('en-PK')}`
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
        response = await api.post('/transactions/deposit', { accountNo, amount: parseFloat(amount) });
      } else if (activeTab === 'Withdraw') {
        response = await api.post('/transactions/withdraw', { accountNo, amount: parseFloat(amount) });
      } else {
        response = await api.post('/transactions/transfer', {
          fromAccount: accountNo,
          toAccount: toAccountNo,
          amount: parseFloat(amount)
        });
      }
      setResult(response.data);
      resetForm();
    } catch (err) {
      setError(err.response?.data?.error || 'Transaction failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8 animate-fade-up">
        <p className="eyebrow mb-1">Process a Transaction</p>
        <h1 className="font-display text-3xl text-ink-900">Transactions</h1>
        <p className="text-slate-soft mt-1">Choose a transaction type to get started.</p>
      </div>

      {/* Transaction type cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {TYPES.map((t, i) => (
          <button
            key={t.id}
            onClick={() => selectType(t.id)}
            className={`type-card animate-fade-up ${activeTab === t.id ? 'active' : ''}`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors ${
              activeTab === t.id ? 'bg-brass text-ink-900' : 'bg-ink-50 text-ink-700'
            }`}>
              {t.icon}
            </div>
            <p className="font-display text-lg text-ink-900">{t.title}</p>
            <p className="text-xs text-slate-soft mt-1">{t.desc}</p>
          </button>
        ))}
      </div>

      {/* Form card */}
      <div key={activeTab} className="panel p-6 animate-scale-in">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">
              {activeTab === 'Transfer' ? 'From Account' : 'Account'}
            </label>
            <SearchableSelect
              placeholder="Select account"
              value={accountNo}
              onChange={setAccountNo}
              options={accountOptions}
            />
          </div>

          {activeTab === 'Transfer' && (
            <div className="animate-fade-up">
              <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">To Account</label>
              <SearchableSelect
                placeholder="Select account"
                value={toAccountNo}
                onChange={setToAccountNo}
                options={accountOptions.filter((o) => o.value !== accountNo)}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Amount (PKR)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-soft text-sm font-mono">Rs</span>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-paper-line rounded-md focus:outline-none focus:ring-2 focus:ring-brass text-sm"
              />
            </div>
            <p className="text-xs text-slate-soft mt-1.5">
              Amounts over Rs 100,000 will require approval before processing.
            </p>
          </div>

          {error && (
            <div className="text-sm text-ledger-red bg-ledger-red-100 border border-ledger-red/30 rounded-md px-3.5 py-2.5 animate-fade-up">
              {error}
            </div>
          )}

          {result && (
            <div className={`rounded-md px-4 py-4 text-sm animate-scale-in ${
              result.pending
                ? 'bg-brass-100 border border-brass/40 text-brass-dark'
                : 'bg-ledger-green-100 border border-ledger-green/30 text-ledger-green'
            }`}>
              <p className="font-semibold mb-1 flex items-center gap-2">
                {result.pending ? '⏳ Pending Approval' : '✓ Success'}
              </p>
              <p>{result.message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !accountNo || (activeTab === 'Transfer' && !toAccountNo) || !amount}
            className="btn btn-primary w-full py-3"
          >
            {submitting ? 'Processing...' : `Process ${activeTab}`}
          </button>
        </form>
      </div>
    </div>
  );
}