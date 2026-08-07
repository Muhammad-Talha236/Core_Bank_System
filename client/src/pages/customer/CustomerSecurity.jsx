import { useState } from 'react';
import customerApi from '../../api/customerClient';

export default function CustomerSecurity() {
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      await customerApi.put('/customer-auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      });
      setPwSuccess(true);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwError(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h2 className="font-display text-3xl text-ink-900 mb-1">Security Settings</h2>
      <p className="text-slate-soft mb-8">Update your online banking credentials.</p>

      <form onSubmit={handleChangePassword} className="bg-white border border-paper-line rounded-sm p-6 space-y-4 shadow-sm">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Current Password</label>
          <input
            type="password" required
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
            className="w-full px-4 py-2.5 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">New Password (Min 8 Characters)</label>
          <input
            type="password" required minLength={8}
            value={pwForm.newPassword}
            onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
            className="w-full px-4 py-2.5 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Confirm New Password</label>
          <input
            type="password" required
            value={pwForm.confirmPassword}
            onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
            className="w-full px-4 py-2.5 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass text-sm"
          />
        </div>

        {pwError && <div className="text-sm text-ledger-red bg-ledger-red/10 border border-ledger-red/30 rounded-sm px-4 py-3">{pwError}</div>}
        {pwSuccess && <div className="text-sm text-ledger-green bg-ledger-green/10 border border-ledger-green/30 rounded-sm px-4 py-3">Password changed successfully.</div>}

        <button 
          type="submit" 
          disabled={submitting} 
          className="bg-ink-900 text-paper font-medium px-6 py-3 rounded-sm hover:bg-ink-800 transition disabled:opacity-50 text-sm shadow-sm"
        >
          {submitting ? 'Updating Password...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}