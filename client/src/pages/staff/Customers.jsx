import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', cnic: '', contact: '', gmail: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadCustomers() {
    try {
      const { data } = await api.get('/customers');
      setCustomers(data);
    } catch (err) {
      setError('Could not load customers.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCustomers(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/customers', form);
      setForm({ name: '', cnic: '', contact: '', gmail: '' });
      setShowForm(false);
      loadCustomers();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to add customer.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-ink-900 mb-1">Customers</h1>
          <p className="text-slate-soft">Manage customer records.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-ink-900 text-paper px-5 py-2.5 rounded-sm font-medium hover:bg-ink-800 transition"
        >
          {showForm ? 'Cancel' : '+ Add Customer'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-paper-line rounded-sm p-6 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Input label="CNIC" placeholder="12345-1234567-1" value={form.cnic} onChange={(v) => setForm({ ...form, cnic: v })} required />
          <Input label="Contact" placeholder="03XX-XXXXXXX" value={form.contact} onChange={(v) => setForm({ ...form, contact: v })} required />
          <Input label="Gmail" type="email" value={form.gmail} onChange={(v) => setForm({ ...form, gmail: v })} required />

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
              {submitting ? 'Saving...' : 'Save Customer'}
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
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">CNIC</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Gmail</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.CustID} className="text-sm">
                  <td className="px-5 py-3 font-mono text-slate-soft">#{c.CustID}</td>
                  <td className="px-5 py-3 font-medium text-ink-900">{c.Name}</td>
                  <td className="px-5 py-3 font-mono">{c.CNIC}</td>
                  <td className="px-5 py-3">{c.Contact}</td>
                  <td className="px-5 py-3 text-slate-soft">{c.Gmail}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {customers.length === 0 && (
            <p className="text-center text-slate-soft py-8">No customers yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder, required }) {
  return (
    <div>
      <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-brass transition"
      />
    </div>
  );
}