import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel - brand presence, ledger-paper motif */}
      <div className="hidden lg:flex lg:w-1/2 bg-ink-900 relative overflow-hidden flex-col justify-between p-16">
        {/* Faint ruled ledger lines, ambient texture */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 47px, #C9A227 47px, #C9A227 48px)'
          }}
        />
        <div className="relative">
          <p className="font-mono text-xs tracking-[0.3em] text-brass uppercase mb-4">Core Banking System</p>
          <h1 className="font-display text-6xl text-paper leading-tight">
            Meridian<br />Bank
          </h1>
        </div>
        <div className="relative">
          <p className="font-mono text-sm text-paper/60 leading-relaxed max-w-sm">
            Every entry recorded. Every balance accounted for.
            <br />Double-entry ledger, since day one.
          </p>
        </div>
      </div>

      {/* Right panel - the actual form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-paper p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-10 text-center">
            <h1 className="font-display text-3xl text-ink-900">Meridian Bank</h1>
          </div>

          <h2 className="font-display text-2xl text-ink-900 mb-1">Staff Sign In</h2>
          <p className="text-slate-soft text-sm mb-8">Enter your employee credentials to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-paper-line bg-white rounded-sm text-slate focus:outline-none focus:ring-2 focus:ring-brass focus:border-brass transition"
                placeholder="you@meridianbank.com"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-paper-line bg-white rounded-sm text-slate focus:outline-none focus:ring-2 focus:ring-brass focus:border-brass transition"
                placeholder="••••••••"
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
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-soft mt-8">
            Are you a customer?{' '}
            <a href="/customer/login" className="text-brass-dark font-medium hover:underline">
              Go to Online Banking
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}