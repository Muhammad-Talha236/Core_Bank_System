import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import customerApi from '../../api/customerClient';

export default function CustomerLogin() {
  const [cnic, setCnic] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useCustomerAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setSubmitting(true);
    try {
      if (!requiresOtp) {
        const response = await customerApi.post('/customer-auth/login', { cnic, password });
        if (response.data.requiresOtp) setRequiresOtp(true);
      } else {
        await login(cnic, password, otpCode);
        navigate('/customer/portal');
      }
    } catch (err) { setError(err.response?.data?.error || 'Login failed. Please try again.'); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper p-4 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brass/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-ink-700/5 blur-3xl" />

      <div className="w-full max-w-sm relative animate-fade-up">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-ink-900 flex items-center justify-center mx-auto mb-3">
            <span className="font-display text-brass text-xl font-bold">M</span>
          </div>
          <h1 className="font-display text-3xl text-ink-900">Meridian Bank</h1>
          <p className="font-mono text-xs tracking-widest text-brass-dark uppercase mt-1">Online Banking</p>
        </div>

        <div className="panel p-8">
          <h2 className="font-display text-xl text-ink-900 mb-1">{requiresOtp ? 'Two-Factor Verification' : 'Welcome back'}</h2>
          <p className="text-slate-soft text-sm mb-6">{requiresOtp ? 'Enter the 6-digit verification code sent to your email.' : 'Log in to manage your accounts.'}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!requiresOtp ? (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">CNIC</label>
                  <input required value={cnic} onChange={(e) => setCnic(e.target.value)} placeholder="12345-1234567-1"
                    className="w-full px-4 py-2.5 border border-paper-line rounded-md focus:outline-none focus:ring-2 focus:ring-brass text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Password</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-paper-line rounded-md focus:outline-none focus:ring-2 focus:ring-brass text-sm" />
                </div>
              </div>
            ) : (
              <div className="animate-scale-in">
                <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Verification Code (OTP)</label>
                <input type="text" maxLength={6} required value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="123456"
                  className="w-full px-4 py-3 border border-brass rounded-md focus:outline-none focus:ring-2 focus:ring-brass text-center font-mono text-xl tracking-widest bg-brass-100/40" />
              </div>
            )}

            {error && <div className="text-sm text-ledger-red bg-ledger-red-100 border border-ledger-red/30 rounded-md px-3 py-2 animate-fade-up">{error}</div>}

            <button type="submit" disabled={submitting} className="btn btn-primary w-full py-3">
              {submitting ? 'Processing...' : requiresOtp ? 'Verify & Sign In' : 'Continue to OTP'}
            </button>
          </form>

          {!requiresOtp && (
            <p className="text-center text-sm text-slate-soft mt-6">
              New to online banking? <Link to="/customer/register" className="text-brass-dark font-medium hover:underline">Register here</Link>
            </p>
          )}
        </div>

        <p className="text-center text-sm text-slate-soft mt-6">
          Bank employee? <Link to="/login" className="text-brass-dark font-medium hover:underline">Staff Sign In</Link>
        </p>
      </div>
    </div>
  );
}