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
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (!requiresOtp) {
        // Step 1: Submit credentials to trigger OTP generation & email dispatch
        const response = await customerApi.post('/customer-auth/login', { cnic, password });
        if (response.data.requiresOtp) {
          setRequiresOtp(true);
        }
      } else {
        // Step 2: Submit credentials + OTP code to complete login & get JWT token
        await login(cnic, password, otpCode);
        navigate('/customer/portal');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
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
        <div className="bg-white border border-paper-line rounded-sm p-8 shadow-sm">
          <h2 className="font-display text-xl text-ink-900 mb-1">
            {requiresOtp ? 'Two-Factor Verification' : 'Welcome back'}
          </h2>
          <p className="text-slate-soft text-sm mb-6">
            {requiresOtp ? 'Enter the 6-digit verification code sent to your email.' : 'Log in to manage your accounts.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!requiresOtp ? (
              <>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">CNIC</label>
                  <input
                    id="cnic"
                    name="cnic"
                    required
                    value={cnic}
                    onChange={(e) => setCnic(e.target.value)}
                    placeholder="12345-1234567-1"
                    className="w-full px-4 py-2.5 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-brass transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-brass transition text-sm"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Verification Code (OTP)</label>
                <input
                  id="otpCode"
                  name="otpCode"
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-3 border border-brass rounded-sm focus:outline-none focus:ring-2 focus:ring-brass text-center font-mono text-xl tracking-widest bg-paper/50"
                />
              </div>
            )}

            {error && (
              <div className="text-sm text-ledger-red bg-ledger-red/10 border border-ledger-red/30 rounded-sm px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-ink-900 text-paper font-medium py-2.5 rounded-sm hover:bg-ink-800 transition disabled:opacity-50 text-sm shadow-sm"
            >
              {submitting ? 'Processing...' : requiresOtp ? 'Verify & Sign In' : 'Continue to OTP'}
            </button>
          </form>

          {!requiresOtp && (
            <p className="text-center text-sm text-slate-soft mt-6">
              New to online banking?{' '}
              <Link to="/customer/register" className="text-brass-dark font-medium hover:underline">
                Register here
              </Link>
            </p>
          )}
        </div>

        <p className="text-center text-sm text-slate-soft mt-6">
          Bank employee?{' '}
          <Link to="/login" className="text-brass-dark font-medium hover:underline">
            Staff Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}