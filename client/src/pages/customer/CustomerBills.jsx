import { useEffect, useState } from 'react';
import customerApi from '../../api/customerClient';

export default function CustomerBills() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [billers, setBillers] = useState([]);
  const [billForm, setBillForm] = useState({ billerId: '', consumerNumber: '', amount: '' });
  const [billError, setBillError] = useState('');
  const [billResult, setBillResult] = useState('');
  const [billHistory, setBillHistory] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    customerApi.get('/customer-portal/accounts').then((res) => {
      setAccounts(res.data);
      if (res.data.length > 0) setSelectedAccount(res.data[0]);
    }).catch((err) => {
      console.error('Error loading accounts:', err);
      setLoadError('Could not load your accounts. Please refresh the page.');
    });

    customerApi.get('/customer-portal/billers').then((res) => setBillers(res.data)).catch((err) => {
      console.error('Error loading billers:', err);
      setLoadError('Could not load the list of billers. Please refresh the page.');
    });

    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const { data } = await customerApi.get('/customer-portal/bill-payments');
      setBillHistory(data);
    } catch (err) {
      console.error('Error loading bill payment history:', err);
      setLoadError('Could not load your payment history.');
    }
  }

  async function handleBillPay(e) {
    e.preventDefault();
    setBillError('');
    setBillResult('');
    setSubmitting(true);
    try {
      const { data } = await customerApi.post('/customer-portal/bill-payment', {
        fromAccount: selectedAccount.AccountNo,
        billerId: billForm.billerId,
        consumerNumber: billForm.consumerNumber,
        amount: parseFloat(billForm.amount)
      });
      setBillResult(data.message);
      setBillForm({ billerId: '', consumerNumber: '', amount: '' });
      loadHistory();
      // Refresh accounts
      const res = await customerApi.get('/customer-portal/accounts');
      setAccounts(res.data);
    } catch (err) {
      setBillError(err.response?.data?.error || 'Payment failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="font-display text-3xl text-ink-900 mb-1">Utility Bill Payments</h2>
        <p className="text-slate-soft">Settle utility, mobile, and internet bills securely.</p>
      </div>

      {loadError && (
        <div className="text-sm text-ledger-red bg-ledger-red/10 border border-ledger-red/30 rounded-sm px-4 py-3">
          {loadError}
        </div>
      )}

      <form onSubmit={handleBillPay} className="bg-white border border-paper-line rounded-sm p-6 space-y-4 shadow-sm max-w-2xl">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Payment Account</label>
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
          <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Select Biller</label>
          <select
            required
            value={billForm.billerId}
            onChange={(e) => setBillForm({ ...billForm, billerId: e.target.value })}
            className="w-full px-4 py-2.5 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass text-sm bg-white"
          >
            <option value="">-- Choose active biller --</option>
            {billers.map((b) => (
              <option key={b.BillerID} value={b.BillerID}>{b.BillerName} ({b.BillerType})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Consumer / Reference Number</label>
          <input
            required
            placeholder="e.g. 142093482934"
            value={billForm.consumerNumber}
            onChange={(e) => setBillForm({ ...billForm, consumerNumber: e.target.value })}
            className="w-full px-4 py-2.5 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass text-sm font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Amount (PKR)</label>
          <input
            type="number" required min="1" step="0.01"
            placeholder="0.00"
            value={billForm.amount}
            onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })}
            className="w-full px-4 py-2.5 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass text-sm font-mono"
          />
        </div>

        {billError && <div className="text-sm text-ledger-red bg-ledger-red/10 border border-ledger-red/30 rounded-sm px-4 py-3">{billError}</div>}
        {billResult && <div className="text-sm text-ledger-green bg-ledger-green/10 border border-ledger-green/30 rounded-sm px-4 py-3">{billResult}</div>}

        <button 
          type="submit" 
          disabled={submitting} 
          className="bg-brass text-ink-900 font-medium px-6 py-3 rounded-sm hover:bg-brass-dark transition disabled:opacity-50 text-sm shadow-sm"
        >
          {submitting ? 'Processing Payment...' : 'Pay Utility Bill'}
        </button>
      </form>

      <div>
        <h3 className="font-display text-xl text-ink-900 mb-3">Payment History</h3>
        <div className="border border-paper-line rounded-sm overflow-hidden bg-white">
          <table className="w-full ledger-table text-left text-sm">
            <thead>
              <tr className="bg-ink-900 text-paper">
                <th className="px-5 py-3 font-medium">Biller</th>
                <th className="px-5 py-3 font-medium">Consumer #</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Payment Date</th>
              </tr>
            </thead>
            <tbody>
              {billHistory.map((b) => (
                <tr key={b.BillPaymentID} className="border-b border-paper-line">
                  <td className="px-5 py-3 font-medium text-ink-900">{b.BillerName}</td>
                  <td className="px-5 py-3 font-mono text-slate-soft">{b.ConsumerNumber}</td>
                  <td className="px-5 py-3 font-mono">Rs {parseFloat(b.Amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-soft">{new Date(b.PaidAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {billHistory.length === 0 && <p className="text-center text-slate-soft py-6 text-sm">No utility bill payments recorded yet.</p>}
        </div>
      </div>
    </div>
  );
}