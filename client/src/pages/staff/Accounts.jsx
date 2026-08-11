import { useEffect, useState } from 'react';
import api from '../../api/client';
import SearchableSelect from '../../components/SearchableSelect';
import Modal from '../../components/ui/Modal';

const ACCOUNT_TYPES = [
  { value: 'Savings', label: 'Savings' },
  { value: 'Current', label: 'Current' },
  { value: 'TermDeposit', label: 'Term Deposit' },
];

const typeAccent = { Savings: 'pill-green', Current: 'pill-navy', TermDeposit: 'pill-brass' };

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
  const [filterType, setFilterType] = useState('All');

  const [closingAccount, setClosingAccount] = useState(null);
  const [targetAccountNo, setTargetAccountNo] = useState('');
  const [closeResult, setCloseResult] = useState(null);
  const [closeError, setCloseError] = useState('');

  async function loadData() {
    try {
      const [accountsRes, customersRes, productsRes] = await Promise.all([
        api.get('/accounts'), api.get('/customers'), api.get('/accounts/products')
      ]);
      setAccounts(accountsRes.data); setCustomers(customersRes.data); setProducts(productsRes.data);
    } catch { setError('Could not load accounts.'); } finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  const productOptions = products.filter((p) => p.AccountType === form.accountType).map((p) => ({
    value: p.ProductID, label: p.ProductName,
    sublabel: p.AccountType === 'TermDeposit' ? `${p.TermMonths} months • ${p.InterestRate}% profit` : `${p.InterestRate}% profit • ${p.Description}`
  }));

  async function handleSubmit(e) {
    e.preventDefault(); setFormError(''); setSubmitting(true);
    try {
      await api.post('/accounts', { custID: form.custID, productId: form.productId, balance: form.balance });
      setForm({ custID: '', accountType: '', productId: '', balance: '0' }); setShowForm(false); loadData();
    } catch (err) { setFormError(err.response?.data?.error || 'Failed to create account.'); }
    finally { setSubmitting(false); }
  }

  async function handleCloseTermDeposit(e) {
    e.preventDefault(); setCloseError(''); setCloseResult(null);
    try {
      const { data } = await api.post(`/accounts/${closingAccount.AccountNo}/close-term-deposit`, { targetAccountNo });
      setCloseResult(data); loadData();
    } catch (err) { setCloseError(err.response?.data?.error || 'Failed to close term deposit.'); }
  }

  const customerAccountOptions = (customerId) =>
    accounts.filter((a) => a.CustID === customerId && a.Type !== 'TermDeposit')
      .map((a) => ({ value: a.AccountNo, label: `${a.AccountNo} — ${a.Nickname}` }));

  const filtered = filterType === 'All' ? accounts : accounts.filter((a) => a.Type === filterType);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-8 animate-fade-up">
        <div>
          <p className="eyebrow mb-1">Operations</p>
          <h1 className="font-display text-3xl text-ink-900">Accounts</h1>
          <p className="text-slate-soft mt-1">Accounts at your branch.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : '+ Open Account'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="panel p-6 mb-8 grid grid-cols-1 sm:grid-cols-4 gap-4 animate-scale-in">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Customer</label>
            <SearchableSelect placeholder="Select customer" value={form.custID} onChange={(v) => setForm({ ...form, custID: v })}
              options={customers.map((c) => ({ value: c.CustID, label: `${c.Name} (#${c.CustID})` }))} />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Account Type</label>
            <select required value={form.accountType} onChange={(e) => setForm({ ...form, accountType: e.target.value, productId: '' })}
              className="w-full px-3 py-2 border border-paper-line rounded-md focus:outline-none focus:ring-2 focus:ring-brass">
              <option value="">Select type</option>
              {ACCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Product</label>
            <SearchableSelect placeholder={form.accountType ? 'Select product' : 'Pick a type first'} disabled={!form.accountType}
              value={form.productId} onChange={(v) => setForm({ ...form, productId: v })} options={productOptions} />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">
              {form.accountType === 'TermDeposit' ? 'Deposit Amount' : 'Initial Balance'}
            </label>
            <input type="number" min="0" step="0.01" required={form.accountType === 'TermDeposit'}
              value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })}
              className="w-full px-3 py-2 border border-paper-line rounded-md focus:outline-none focus:ring-2 focus:ring-brass" />
          </div>
          {formError && <div className="sm:col-span-4 text-sm text-ledger-red bg-ledger-red-100 border border-ledger-red/30 rounded-md px-3 py-2">{formError}</div>}
          <div className="sm:col-span-4">
            <button type="submit" disabled={submitting || !form.custID || !form.productId} className="btn btn-brass">
              {submitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      )}

      {!loading && !error && (
        <div className="flex gap-2 mb-5 animate-fade-up flex-wrap">
          {['All', ...ACCOUNT_TYPES.map((t) => t.value)].map((t) => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterType === t ? 'bg-ink-900 text-paper' : 'bg-white border border-paper-line text-slate-soft hover:border-ink-700'
              }`}>
              {t === 'TermDeposit' ? 'Term Deposit' : t}
            </button>
          ))}
        </div>
      )}

      {loading && <p className="text-slate-soft">Loading...</p>}
      {error && <p className="text-ledger-red">{error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a, i) => (
            <div key={a.AccountNo} className="panel panel-hover p-5 animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-mono text-xs text-slate-soft">#{a.AccountNo}</p>
                  <p className="font-medium text-ink-900 mt-0.5">{a.CustomerName}</p>
                </div>
                <span className={`pill ${typeAccent[a.Type] || 'pill-navy'}`}>{a.Type}</span>
              </div>
              <p className="font-display text-2xl text-ink-900 mb-1">
                Rs {parseFloat(a.Balance).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-slate-soft mb-3">{a.Nickname || '—'}</p>
              <hr className="hairline mb-3" />
              <div className="flex items-center justify-between">
                <span className={`stamp text-[10px] ${a.Status === 'Active' ? 'text-ledger-green' : 'text-ledger-red'}`}>{a.Status}</span>
                {a.MaturityDate && <span className="font-mono text-[11px] text-slate-soft">Matures {new Date(a.MaturityDate).toLocaleDateString()}</span>}
                {a.Type === 'TermDeposit' && a.Status === 'Active' && (
                  <button
                    onClick={() => { setClosingAccount(a); setCloseResult(null); setCloseError(''); setTargetAccountNo(''); }}
                    className="text-xs text-brass-dark hover:underline font-medium"
                  >Close</button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="col-span-full text-center text-slate-soft py-16 panel">No accounts found.</p>}
        </div>
      )}

      <Modal open={!!closingAccount} onClose={() => setClosingAccount(null)} title="Close Term Deposit"
        subtitle={closingAccount ? `Account #${closingAccount.AccountNo} — ${closingAccount.Nickname}` : ''}>
        {!closeResult ? (
          <form onSubmit={handleCloseTermDeposit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Deposit proceeds into</label>
              <SearchableSelect placeholder="Select account" value={targetAccountNo} onChange={setTargetAccountNo}
                options={closingAccount ? customerAccountOptions(closingAccount.CustID) : []} />
            </div>
            {closeError && <div className="text-sm text-ledger-red bg-ledger-red-100 border border-ledger-red/30 rounded-md px-3 py-2">{closeError}</div>}
            <div className="flex gap-3">
              <button type="submit" disabled={!targetAccountNo} className="btn btn-brass">Confirm Closure</button>
              <button type="button" onClick={() => setClosingAccount(null)} className="btn btn-ghost">Cancel</button>
            </div>
          </form>
        ) : (
          <div className="animate-scale-in">
            <p className={`stamp mb-3 ${closeResult.matured ? 'text-ledger-green' : 'text-ledger-red'}`}>
              {closeResult.matured ? 'Matured Payout' : 'Early Closure (Penalty Applied)'}
            </p>
            <p className="text-sm text-slate-soft mb-4">{closeResult.message}</p>
            <button onClick={() => setClosingAccount(null)} className="btn btn-primary">Done</button>
          </div>
        )}
      </Modal>
    </div>
  );
}