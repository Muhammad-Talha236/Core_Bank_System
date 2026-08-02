import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ branchName: '', branchCode: '', city: '', address: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadBranches() {
    try {
      const { data } = await api.get('/branches');
      setBranches(data);
    } catch (err) {
      setError('Could not load branches.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadBranches(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/branches', form);
      setForm({ branchName: '', branchCode: '', city: '', address: '' });
      setShowForm(false);
      loadBranches();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create branch.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-ink-900 mb-1">Branches</h1>
          <p className="text-slate-soft">All branches in the network.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-ink-900 text-paper px-5 py-2.5 rounded-sm font-medium hover:bg-ink-800 transition"
        >
          {showForm ? 'Cancel' : '+ Add Branch'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-paper-line rounded-sm p-6 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Branch Name" value={form.branchName} onChange={(v) => setForm({ ...form, branchName: v })} required />
          <Input label="Branch Code" placeholder="e.g. LHR01" value={form.branchCode} onChange={(v) => setForm({ ...form, branchCode: v })} required />
          <Input label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
          <Input label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />

          {formError && (
            <div className="sm:col-span-2 text-sm text-ledger-red bg-ledger-red/10 border border-ledger-red/30 rounded-sm px-3 py-2">
              {formError}
            </div>
          )}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-brass text-ink-900 font-medium px-5 py-2.5 rounded-sm hover:bg-brass-dark transition disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Branch'}
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
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">City</th>
                <th className="px-5 py-3 font-medium">Address</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.BranchID} className="text-sm">
                  <td className="px-5 py-3 font-mono text-ink-900 font-medium">{b.BranchCode}</td>
                  <td className="px-5 py-3">{b.BranchName}</td>
                  <td className="px-5 py-3 text-slate-soft">{b.City || '—'}</td>
                  <td className="px-5 py-3 text-slate-soft">{b.Address || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {branches.length === 0 && <p className="text-center text-slate-soft py-8">No branches yet.</p>}
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">{label}</label>
      <input
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass"
      />
    </div>
  );
}