import { useState } from 'react';
import api from '../../api/client';

export default function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });
      setSuccess(true);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8 max-w-md">
      <h1 className="font-display text-3xl text-ink-900 mb-1">Change Password</h1>
      <p className="text-slate-soft mb-8">Update your login password.</p>

      <form onSubmit={handleSubmit} className="bg-white border border-paper-line rounded-sm p-6 space-y-4">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Current Password</label>
          <input
            type="password"
            required
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            className="w-full px-3 py-2 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass"
          />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">New Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            className="w-full px-3 py-2 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass"
          />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Confirm New Password</label>
          <input
            type="password"
            required
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            className="w-full px-3 py-2 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass"
          />
        </div>

        {error && (
          <div className="text-sm text-ledger-red bg-ledger-red/10 border border-ledger-red/30 rounded-sm px-3 py-2">{error}</div>
        )}
        {success && (
          <div className="text-sm text-ledger-green bg-ledger-green/10 border border-ledger-green/30 rounded-sm px-3 py-2">
            Password changed successfully.
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="bg-ink-900 text-paper font-medium px-5 py-2.5 rounded-sm hover:bg-ink-800 transition disabled:opacity-50"
        >
          {submitting ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}