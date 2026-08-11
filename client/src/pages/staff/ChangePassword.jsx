import { useState } from 'react';
import api from '../../api/client';

export default function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setSuccess(false);
    if (form.newPassword !== form.confirmPassword) { setError('New passwords do not match'); return; }
    setSubmitting(true);
    try {
      await api.put('/auth/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      setSuccess(true); setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { setError(err.response?.data?.error || 'Failed to change password.'); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-8">
      <div className="mb-8 animate-fade-up">
        <p className="eyebrow mb-1">Account</p>
        <h1 className="font-display text-3xl text-ink-900">Change Password</h1>
        <p className="text-slate-soft mt-1">Update your login password.</p>
      </div>

      <form onSubmit={handleSubmit} className="panel p-6 space-y-4 animate-scale-in">
        {[
          { key: 'currentPassword', label: 'Current Password' },
          { key: 'newPassword', label: 'New Password', minLength: 8 },
          { key: 'confirmPassword', label: 'Confirm New Password' },
        ].map((f) => (
          <div key={f.key}>
            <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">{f.label}</label>
            <input type="password" required minLength={f.minLength} value={form[f.key]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              className="w-full px-3 py-2 border border-paper-line rounded-md focus:outline-none focus:ring-2 focus:ring-brass" />
          </div>
        ))}
        {error && <div className="text-sm text-ledger-red bg-ledger-red-100 border border-ledger-red/30 rounded-md px-3 py-2 animate-fade-up">{error}</div>}
        {success && <div className="text-sm text-ledger-green bg-ledger-green-100 border border-ledger-green/30 rounded-md px-3 py-2 animate-scale-in">Password changed successfully.</div>}
        <button type="submit" disabled={submitting} className="btn btn-primary w-full py-2.5">{submitting ? 'Updating...' : 'Update Password'}</button>
      </form>
    </div>
  );
}