import { useEffect, useState } from 'react';
import api from '../../api/client';
import SearchableSelect from '../../components/SearchableSelect';

const ACCOUNT_TYPES = [
  { value: 'Savings', label: 'Savings' },
  { value: 'Current', label: 'Current' },
  { value: 'TermDeposit', label: 'Term Deposit' },
];

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ custID: '', accountType: '', productId: '', balance: '0' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Term deposit closure state
  const [closingAccount, setClosingAccount] = useState(null);
  const [targetAccountNo, setTargetAccountNo] = useState('');
  const [closeResult, setCloseResult] = useState(null);
  const [closeError, setCloseError] = useState('');

  async function loadData() {
    try {
      const [accountsRes, customersRes, productsRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/customers'),
        api.get('/accounts/products')
      ]);
      setAccounts(accountsRes.data);
      setCustomers(customersRes.data);
      setProducts(productsRes.data);
    } catch (err) {
      setError('Could not load accounts.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const productOptions = products
    .filter((p) => p.AccountType === form.accountType)
    .map((p) => ({
      value: p.ProductID,
      label: p.ProductName,
      sublabel: p.AccountType === 'TermDeposit'
        ? `${p.TermMonths} months • ${p.InterestRate}% profit`
        : `${p.InterestRate}% profit • ${p.Description}`
    }));

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/accounts', {
        custID: form.custID,
        productId: form.productId,
        balance: form.balance
      });
      setForm({ custID: '', accountType: '', productId: '', balance: '0' });
      setShowForm(false);
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create account.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCloseTermDeposit(e) {
    e.preventDefault();
    setCloseError('');
    setCloseResult(null);
    try {
      const { data } = await api.post(`/accounts/${closingAccount.AccountNo}/close-term-deposit`, {
        targetAccountNo
      });
      setCloseResult(data);
      loadData();
    } catch (err) {
      setCloseError(err.response?.data?.error || 'Failed to close term deposit.');
    }
  }

  const customerAccountOptions = (customerId) =>
    accounts
      .filter((a) => a.CustID === customerId && a.Type !== 'TermDeposit')
      .map((a) => ({ value: a.AccountNo, label: `${a.AccountNo} — ${a.Nickname}` }));

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
        <form onSubmit={handleSubmit} className="bg-white border border-paper-line rounded-sm p-6 mb-8 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Customer</label>
            <SearchableSelect
              placeholder="Select customer"
              value={form.custID}
              onChange={(v) => setForm({ ...form, custID: v })}
              options={customers.map((c) => ({ value: c.CustID, label: `${c.Name} (#${c.CustID})` }))}
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Account Type</label>
            <select
              required
              value={form.accountType}
              onChange={(e) => setForm({ ...form, accountType: e.target.value, productId: '' })}
              className="w-full px-3 py-2 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass"
            >
              <option value="">Select type</option>
              {ACCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Product</label>
            <SearchableSelect
              placeholder={form.accountType ? 'Select product' : 'Pick a type first'}
              disabled={!form.accountType}
              value={form.productId}
              onChange={(v) => setForm({ ...form, productId: v })}
              options={productOptions}
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">
              {form.accountType === 'TermDeposit' ? 'Deposit Amount' : 'Initial Balance'}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              required={form.accountType === 'TermDeposit'}
              value={form.balance}
              onChange={(e) => setForm({ ...form, balance: e.target.value })}
              className="w-full px-3 py-2 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass"
            />
          </div>

          {formError && (
            <div className="sm:col-span-4 text-sm text-ledger-red bg-ledger-red/10 border border-ledger-red/30 rounded-sm px-3 py-2">
              {formError}
            </div>
          )}

          <div className="sm:col-span-4">
            <button
              type="submit"
              disabled={submitting || !form.custID || !form.productId}
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
                <th className="px-5 py-3 font-medium">Nickname</th>
                <th className="px-5 py-3 font-medium">Balance</th>
                <th className="px-5 py-3 font-medium">Maturity</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.AccountNo} className="text-sm">
                  <td className="px-5 py-3 font-mono text-ink-900 font-medium">{a.AccountNo}</td>
                  <td className="px-5 py-3">{a.CustomerName}</td>
                  <td className="px-5 py-3">{a.Type}</td>
                  <td className="px-5 py-3 text-slate-soft">{a.Nickname || '—'}</td>
                  <td className="px-5 py-3 font-mono">Rs {parseFloat(a.Balance).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-soft">
                    {a.MaturityDate ? new Date(a.MaturityDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`stamp ${a.Status === 'Active' ? 'text-ledger-green' : 'text-ledger-red'}`}>
                      {a.Status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {a.Type === 'TermDeposit' && a.Status === 'Active' && (
                      <button
                        onClick={() => { setClosingAccount(a); setCloseResult(null); setCloseError(''); setTargetAccountNo(''); }}
                        className="text-xs text-brass-dark hover:underline font-medium"
                      >
                        Close
                      </button>
                    )}
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

      {/* Term Deposit closure modal */}
      {closingAccount && (
        <div className="fixed inset-0 bg-ink-900/50 flex items-center justify-center p-4 z-20">
          <div className="bg-white rounded-sm p-6 max-w-md w-full">
            <h3 className="font-display text-xl text-ink-900 mb-1">Close Term Deposit</h3>
            <p className="text-sm text-slate-soft mb-4">
              Account #{closingAccount.AccountNo} — {closingAccount.Nickname}
            </p>

            {!closeResult ? (
              <form onSubmit={handleCloseTermDeposit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">
                    Deposit proceeds into
                  </label>
                  <SearchableSelect
                    placeholder="Select account"
                    value={targetAccountNo}
                    onChange={setTargetAccountNo}
                    options={customerAccountOptions(closingAccount.CustID)}
                  />
                </div>

                {closeError && (
                  <div className="text-sm text-ledger-red bg-ledger-red/10 border border-ledger-red/30 rounded-sm px-3 py-2">
                    {closeError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button type="submit" disabled={!targetAccountNo} className="bg-brass text-ink-900 font-medium px-4 py-2 rounded-sm hover:bg-brass-dark transition disabled:opacity-50">
                    Confirm Closure
                  </button>
                  <button type="button" onClick={() => setClosingAccount(null)} className="text-slate-soft text-sm">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <p className={`stamp mb-3 ${closeResult.matured ? 'text-ledger-green' : 'text-ledger-red'}`}>
                  {closeResult.matured ? 'Matured Payout' : 'Early Closure (Penalty Applied)'}
                </p>
                <p className="text-sm text-slate-soft mb-4">{closeResult.message}</p>
                <button onClick={() => setClosingAccount(null)} className="bg-ink-900 text-paper px-4 py-2 rounded-sm text-sm">
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}