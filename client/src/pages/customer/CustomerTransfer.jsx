import { useEffect, useState } from 'react';
import customerApi from '../../api/customerClient';

export default function CustomerTransfer() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transferForm, setTransferForm] = useState({ toAccount: '', amount: '' });
  const [transferError, setTransferError] = useState('');
  const [transferResult, setTransferResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    customerApi.get('/customer-portal/accounts').then((res) => {
      setAccounts(res.data);
      if (res.data.length > 0) setSelectedAccount(res.data[0]);
    });
  }, []);

  async function handleTransfer(e) {
    e.preventDefault();
    setTransferError('');
    setTransferResult(null);
    setSubmitting(true);
    try {
      const { data } = await customerApi.post('/customer-portal/transfer', {
        fromAccount: selectedAccount.AccountNo,
        toAccount: transferForm.toAccount,
        amount: parseFloat(transferForm.amount)
      });
      setTransferResult(data);
      setTransferForm({ toAccount: '', amount: '' });
      // Refresh account balances
      const res = await customerApi.get('/customer-portal/accounts');
      setAccounts(res.data);
      setSelectedAccount(res.data.find(a => a.AccountNo === selectedAccount.AccountNo) || res.data[0]);
    } catch (err) {
      setTransferError(err.response?.data?.error || 'Transfer failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-3xl text-ink-900 mb-1">Fund Transfer</h2>
      <p className="text-slate-soft mb-8">Securely transfer funds to any valid bank account.</p>

      <form onSubmit={handleTransfer} className="bg-white border border-paper-line rounded-sm p-6 space-y-5 shadow-sm">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Select Source Account</label>
          <select
            value={selectedAccount?.AccountNo || ''}
            onChange={(e) => setSelectedAccount(accounts.find(a => a.AccountNo == e.target.value))}
            className="w-full px-4 py-2.5 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass text-sm bg-white font-mono"
          >
            {accounts.map((a) => (
              <option key={a.AccountNo} value={a.AccountNo}>
                #{a.AccountNo} — {a.Type} (Balance: Rs {parseFloat(a.Balance).toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Destination Account Number</label>
          <input
            required
            placeholder="Enter 8-digit recipient account"
            value={transferForm.toAccount}
            onChange={(e) => setTransferForm({ ...transferForm, toAccount: e.target.value })}
            className="w-full px-4 py-2.5 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass text-sm font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Transfer Amount (PKR)</label>
          <input
            type="number" required min="1" step="0.01"
            placeholder="0.00"
            value={transferForm.amount}
            onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
            className="w-full px-4 py-2.5 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass text-sm font-mono"
          />
          <p className="text-[11px] text-slate-soft mt-1">Online self-service transfers are limited to Rs 100,000.</p>
        </div>

        {transferError && (
          <div className="text-sm text-ledger-red bg-ledger-red/10 border border-ledger-red/30 rounded-sm px-4 py-3">
            {transferError}
          </div>
        )}
        {transferResult && (
          <div className="text-sm text-ledger-green bg-ledger-green/10 border border-ledger-green/30 rounded-sm px-4 py-3">
            {transferResult.message} <br />
            <span className="font-mono font-medium">New balance: Rs {parseFloat(transferResult.newBalance).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
          </div>
        )}

        <button 
          type="submit" 
          disabled={submitting || !selectedAccount} 
          className="bg-ink-900 text-paper font-medium px-6 py-3 rounded-sm hover:bg-ink-800 transition disabled:opacity-50 text-sm shadow-sm"
        >
          {submitting ? 'Executing Transfer...' : 'Complete Transfer'}
        </button>
      </form>
    </div>
  );
}