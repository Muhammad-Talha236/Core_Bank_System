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
    e.preventDefault(); setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setSubmitting(true);
    try {
      await customerApi.post('/customer-auth/register', { cnic: form.cnic, accountNo: form.accountNo, password: form.password });
      setSuccess(true);
      setTimeout(() => navigate('/customer/login'), 2000);
    } catch (err) { setError(err.response?.data?.error || 'Registration failed.'); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper p-4 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brass/10 blur-3xl" />

      <div className="w-full max-w-sm relative animate-fade-up">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-ink-900 flex items-center justify-center mx-auto mb-3">
            <span className="font-display text-brass text-xl font-bold">M</span>
          </div>
          <h1 className="font-display text-3xl text-ink-900">Meridian Bank</h1>
          <p className="font-mono text-xs tracking-widest text-brass-dark uppercase mt-1">Online Banking</p>
        </div>

        <div className="panel p-8">
          <h2 className="font-display text-xl text-ink-900 mb-1">Register for Online Banking</h2>
          <p className="text-slate-soft text-sm mb-6">Enter your CNIC and account number exactly as they appear on your bank records to verify your identity.</p>

          {success ? (
            <div className="text-sm text-ledger-green bg-ledger-green-100 border border-ledger-green/30 rounded-md px-3 py-3 animate-scale-in">
              Registration successful! Redirecting to login...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { key: 'cnic', label: 'CNIC', placeholder: '12345-1234567-1' },
                { key: 'accountNo', label: 'Account Number', placeholder: '8-digit account number' },
                { key: 'password', label: 'Create Password', type: 'password', minLength: 8 },
                { key: 'confirmPassword', label: 'Confirm Password', type: 'password' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">{f.label}</label>
                  <input
                    type={f.type || 'text'} required minLength={f.minLength} placeholder={f.placeholder}
                    value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full px-4 py-2.5 border border-paper-line rounded-md focus:outline-none focus:ring-2 focus:ring-brass text-sm"
                  />
                </div>
              ))}

              {error && <div className="text-sm text-ledger-red bg-ledger-red-100 border border-ledger-red/30 rounded-md px-3 py-2 animate-fade-up">{error}</div>}

              <button type="submit" disabled={submitting} className="btn btn-primary w-full py-3">
                {submitting ? 'Registering...' : 'Register'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-slate-soft mt-6">
            Already registered? <Link to="/customer/login" className="text-brass-dark font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}