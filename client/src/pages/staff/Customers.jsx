import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const SYSTEM_WIDE_ROLES = ['SuperAdmin', 'Auditor'];

export default function Customers() {
  const { employee } = useAuth();
  const showBranch = SYSTEM_WIDE_ROLES.includes(employee.role);

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({ name: '', cnic: '', contact: '', gmail: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadCustomers() {
    try {
      const { data } = await api.get('/customers');
      setCustomers(data);
    } catch { setError('Could not load customers.'); } finally { setLoading(false); }
  }

  useEffect(() => { loadCustomers(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(''); setSubmitting(true);
    try {
      await api.post('/customers', form);
      setForm({ name: '', cnic: '', contact: '', gmail: '' });
      setShowForm(false);
      loadCustomers();
    } catch (err) { setFormError(err.response?.data?.error || 'Failed to add customer.'); }
    finally { setSubmitting(false); }
  }

  const filtered = customers.filter((c) =>
    !query || c.Name.toLowerCase().includes(query.toLowerCase()) || c.CNIC.includes(query) || String(c.CustID).includes(query)
  );

  function avatarColor(id) {
    const colors = ['bg-ink-700', 'bg-brass-dark', 'bg-ledger-green', 'bg-ink-600'];
    return colors[id % colors.length];
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-8 animate-fade-up">
        <div>
          <p className="eyebrow mb-1">Operations</p>
          <h1 className="font-display text-3xl text-ink-900">Customers</h1>
          <p className="text-slate-soft mt-1">Manage customer records.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : '+ Add Customer'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="panel p-6 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-scale-in">
          {[
            { key: 'name', label: 'Full Name' },
            { key: 'cnic', label: 'CNIC', placeholder: '12345-1234567-1' },
            { key: 'contact', label: 'Contact', placeholder: '03XX-XXXXXXX' },
            { key: 'gmail', label: 'Gmail', type: 'email' },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">{f.label}</label>
              <input
                type={f.type || 'text'} required placeholder={f.placeholder}
                value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full px-3 py-2 border border-paper-line rounded-md focus:outline-none focus:ring-2 focus:ring-brass"
              />
            </div>
          ))}
          {formError && <div className="sm:col-span-2 text-sm text-ledger-red bg-ledger-red-100 border border-ledger-red/30 rounded-md px-3 py-2">{formError}</div>}
          <div className="sm:col-span-2">
            <button type="submit" disabled={submitting} className="btn btn-brass">{submitting ? 'Saving...' : 'Save Customer'}</button>
          </div>
        </form>
      )}

      {!loading && !error && customers.length > 0 && (
        <div className="mb-5 animate-fade-up">
          <input
            value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, CNIC, or ID..."
            className="w-full sm:w-80 px-4 py-2.5 border border-paper-line rounded-md focus:outline-none focus:ring-2 focus:ring-brass text-sm bg-white"
          />
        </div>
      )}

      {loading && <p className="text-slate-soft">Loading...</p>}
      {error && <p className="text-ledger-red">{error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c, i) => (
            <div key={c.CustID} className="panel panel-hover p-5 animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full ${avatarColor(c.CustID)} flex items-center justify-center text-white font-display text-sm shrink-0`}>
                  {c.Name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-ink-900 truncate">{c.Name}</p>
                  <p className="font-mono text-[11px] text-slate-soft">#{c.CustID}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-slate-soft">CNIC</span><span className="font-mono text-slate">{c.CNIC}</span></div>
                <div className="flex justify-between"><span className="text-slate-soft">Contact</span><span className="text-slate">{c.Contact}</span></div>
                <div className="flex justify-between"><span className="text-slate-soft">Email</span><span className="text-slate truncate ml-2">{c.Gmail}</span></div>
                {showBranch && (
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-soft">Branch</span>
                    {c.BranchName ? <span className="pill pill-navy">{c.BranchName}</span> : <span className="pill pill-red">Unassigned</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-slate-soft py-16 panel">
              {customers.length === 0 ? 'No customers yet.' : 'No matches for your search.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}