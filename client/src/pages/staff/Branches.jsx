import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ branchName: '', branchCode: '', city: '', address: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadBranches() {
    try {
      const [branchesRes, customersRes, accountsRes] = await Promise.all([api.get('/branches'), api.get('/customers'), api.get('/accounts')]);
      setBranches(branchesRes.data);
      const byBranch = {};
      branchesRes.data.forEach((b) => {
        byBranch[b.BranchID] = {
          customers: customersRes.data.filter((c) => c.BranchID === b.BranchID).length,
          accounts: accountsRes.data.filter((a) => a.BranchID === b.BranchID).length,
          balance: accountsRes.data.filter((a) => a.BranchID === b.BranchID).reduce((sum, a) => sum + parseFloat(a.Balance), 0)
        };
      });
      setStats(byBranch);
    } catch { setError('Could not load branches.'); } finally { setLoading(false); }
  }

  useEffect(() => { loadBranches(); }, []);

  async function handleSubmit(e) {
    e.preventDefault(); setFormError(''); setSubmitting(true);
    try {
      await api.post('/branches', form);
      setForm({ branchName: '', branchCode: '', city: '', address: '' }); setShowForm(false); loadBranches();
    } catch (err) { setFormError(err.response?.data?.error || 'Failed to create branch.'); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-8 animate-fade-up">
        <div>
          <p className="eyebrow mb-1">Administration</p>
          <h1 className="font-display text-3xl text-ink-900">Branches</h1>
          <p className="text-slate-soft mt-1">All branches in the network, with live customer and balance figures.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">{showForm ? 'Cancel' : '+ Add Branch'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="panel p-6 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-scale-in">
          {[
            { key: 'branchName', label: 'Branch Name', required: true },
            { key: 'branchCode', label: 'Branch Code', placeholder: 'e.g. LHR01', required: true },
            { key: 'city', label: 'City' },
            { key: 'address', label: 'Address' },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">{f.label}</label>
              <input required={f.required} placeholder={f.placeholder} value={form[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full px-3 py-2 border border-paper-line rounded-md focus:outline-none focus:ring-2 focus:ring-brass" />
            </div>
          ))}
          {formError && <div className="sm:col-span-2 text-sm text-ledger-red bg-ledger-red-100 border border-ledger-red/30 rounded-md px-3 py-2">{formError}</div>}
          <div className="sm:col-span-2">
            <button type="submit" disabled={submitting} className="btn btn-brass">{submitting ? 'Creating...' : 'Create Branch'}</button>
          </div>
        </form>
      )}

      {loading && <p className="text-slate-soft">Loading...</p>}
      {error && <p className="text-ledger-red">{error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {branches.map((b, i) => {
            const s = stats[b.BranchID] || { customers: 0, accounts: 0, balance: 0 };
            return (
              <div key={b.BranchID} className="panel panel-hover p-6 relative overflow-hidden animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-ink-700" />
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-display text-xl text-ink-900">{b.BranchName}</p>
                    <p className="font-mono text-xs text-brass-dark mt-0.5">{b.BranchCode}</p>
                  </div>
                  <span className="pill pill-navy">{b.City || 'Unassigned'}</span>
                </div>
                {b.Address && <p className="text-sm text-slate-soft mb-4">{b.Address}</p>}
                <hr className="hairline mb-4" />
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div><p className="font-display text-lg text-ink-900">{s.customers}</p><p className="font-mono text-[10px] uppercase tracking-wide text-slate-soft mt-0.5">Customers</p></div>
                  <div><p className="font-display text-lg text-ink-900">{s.accounts}</p><p className="font-mono text-[10px] uppercase tracking-wide text-slate-soft mt-0.5">Accounts</p></div>
                  <div><p className="font-display text-lg text-ink-900">Rs {s.balance >= 100000 ? `${(s.balance / 100000).toFixed(1)}L` : s.balance.toLocaleString('en-PK')}</p><p className="font-mono text-[10px] uppercase tracking-wide text-slate-soft mt-0.5">Balance</p></div>
                </div>
              </div>
            );
          })}
          {branches.length === 0 && <p className="col-span-full text-center text-slate-soft py-12 panel">No branches yet.</p>}
        </div>
      )}
    </div>
  );
}