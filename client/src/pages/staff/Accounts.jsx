import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ custID: '', type: 'SAV', balance: '0' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    try {
      const [accountsRes, customersRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/customers')
      ]);
      setAccounts(accountsRes.data);
      setCustomers(customersRes.data);
    } catch (err) {
      setError('Could not load accounts.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/accounts', form);
      setForm({ custID: '', type: 'SAV', balance: '0' });
      setShowForm(false);
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create account.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-ink-900 mb-1">Accounts</h1>
          <p className="text-slate-soft">Accounts at your branch.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-ink-900 text-paper px-5 py-2.5 rounded-sm font-medium hover:bg-ink-800 transition"
        >
          {showForm ? 'Cancel' : '+ Open Account'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-paper-line rounded-sm p-6 mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Customer</label>
            <select
              required
              value={form.custID}
              onChange={(e) => setForm({ ...form, custID: e.target.value })}
              className="w-full px-3 py-2 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass"
            >
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.CustID} value={c.CustID}>{c.Name} (#{c.CustID})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Account Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass"
            >
              <option value="SAV">Savings</option>
              <option value="CUR">Current</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Initial Balance</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.balance}
              onChange={(e) => setForm({ ...form, balance: e.target.value })}
              className="w-full px-3 py-2 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass"
            />
          </div>

          {formError && (
            <div className="sm:col-span-3 text-sm text-ledger-red bg-ledger-red/10 border border-ledger-red/30 rounded-sm px-3 py-2">
              {formError}
            </div>
          )}

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-brass text-ink-900 font-medium px-5 py-2.5 rounded-sm hover:bg-brass-dark transition disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      )}

      {loading && <p className="text-slate-soft">Loading...</p>}
      {error && <p className="text-ledger-red">{error}</p>}

      {!loading && !error && (
        <div className="bg-white border border-paper-line rounded-sm overflow-hidden">
          <table className="w-full ledger-table">
            <thead>
              <tr className="bg-ink-900 text-paper text-left text-sm">
                <th className="px-5 py-3 font-medium">Account No</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Balance</th>
                <th className="px-5 py-3 font-medium">Branch</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.AccountNo} className="text-sm">
                  <td className="px-5 py-3 font-mono text-ink-900 font-medium">{a.AccountNo}</td>
                  <td className="px-5 py-3">{a.CustomerName}</td>
                  <td className="px-5 py-3">{a.Type}</td>
                  <td className="px-5 py-3 font-mono">Rs {parseFloat(a.Balance).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
                  <td className="px-5 py-3 text-slate-soft">{a.BranchName}</td>
                  <td className="px-5 py-3">
                    <span className={`stamp ${a.Status === 'Active' ? 'text-ledger-green' : 'text-ledger-red'}`}>
                      {a.Status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {accounts.length === 0 && (
            <p className="text-center text-slate-soft py-8">No accounts yet.</p>
          )}
        </div>
      )}
    </div>
  );
}