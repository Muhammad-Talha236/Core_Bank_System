import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import customerApi from '../../api/customerClient';

export default function CustomerRegister() {
  const [form, setForm] = useState({ cnic: '', accountNo: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setSubmitting(true);
    try {
      await customerApi.post('/customer-auth/register', {
        cnic: form.cnic,
        accountNo: form.accountNo,
        password: form.password
      });
      setSuccess(true);
      setTimeout(() => navigate('/customer/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-ink-900">Meridian Bank</h1>
          <p className="font-mono text-xs tracking-widest text-brass uppercase mt-1">Online Banking</p>
        </div>

        <div className="bg-white border border-paper-line rounded-sm p-8">
          <h2 className="font-display text-xl text-ink-900 mb-1">Register for Online Banking</h2>
          <p className="text-slate-soft text-sm mb-6">
            Enter your CNIC and account number exactly as they appear on your bank records to verify your identity.
          </p>

          {success ? (
            <div className="text-sm text-ledger-green bg-ledger-green/10 border border-ledger-green/30 rounded-sm px-3 py-3">
              Registration successful! Redirecting to login...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">CNIC</label>
                <input
                  required
                  value={form.cnic}
                  onChange={(e) => setForm({ ...form, cnic: e.target.value })}
                  placeholder="12345-1234567-1"
                  className="w-full px-4 py-2.5 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-brass transition"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Account Number</label>
                <input
                  required
                  value={form.accountNo}
                  onChange={(e) => setForm({ ...form, accountNo: e.target.value })}
                  placeholder="8-digit account number"
                  className="w-full px-4 py-2.5 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-brass transition"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Create Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-brass transition"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2.5 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-brass transition"
                />
              </div>

              {error && (
                <div className="text-sm text-ledger-red bg-ledger-red/10 border border-ledger-red/30 rounded-sm px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-ink-900 text-paper font-medium py-2.5 rounded-sm hover:bg-ink-800 transition disabled:opacity-50"
              >
                {submitting ? 'Registering...' : 'Register'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-slate-soft mt-6">
            Already registered?{' '}
            <Link to="/customer/login" className="text-brass-dark font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}