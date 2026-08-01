import { useEffect, useState } from 'react';
import api from '../../api/client';
import SearchableSelect from '../../components/SearchableSelect';

const TABS = ['Deposit', 'Withdraw', 'Transfer'];

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
    <div className="p-8 max-w-2xl">
      <h1 className="font-display text-3xl text-ink-900 mb-1">Transactions</h1>
      <p className="text-slate-soft mb-8">Process deposits, withdrawals, and transfers.</p>

      <div className="flex gap-1 mb-6 border-b border-paper-line">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setResult(null); setError(''); resetForm(); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === tab
                ? 'border-brass text-ink-900'
                : 'border-transparent text-slate-soft hover:text-ink-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-paper-line rounded-sm p-6 space-y-4">
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
          <div>
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
          <input
            type="number"
            required
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass"
          />
          <p className="text-xs text-slate-soft mt-1">
            Amounts over Rs 100,000 will require approval before processing.
          </p>
        </div>

        {error && (
          <div className="text-sm text-ledger-red bg-ledger-red/10 border border-ledger-red/30 rounded-sm px-3 py-2">
            {error}
          </div>
        )}

        {result && (
          <div className={`rounded-sm px-3 py-3 text-sm ${
            result.pending
              ? 'bg-brass/10 border border-brass/40 text-brass-dark'
              : 'bg-ledger-green/10 border border-ledger-green/30 text-ledger-green'
          }`}>
            <p className="font-medium mb-1">
              {result.pending ? 'Pending Approval' : 'Success'}
            </p>
            <p>{result.message}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !accountNo || (activeTab === 'Transfer' && !toAccountNo) || !amount}
          className="bg-ink-900 text-paper font-medium px-5 py-2.5 rounded-sm hover:bg-ink-800 transition disabled:opacity-50"
        >
          {submitting ? 'Processing...' : `Process ${activeTab}`}
        </button>
      </form>
    </div>
  );
}