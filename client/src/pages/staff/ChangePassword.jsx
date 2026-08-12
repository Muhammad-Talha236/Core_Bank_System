import { useState } from 'react';
import api from '../../api/client';

export default function ChangePassword() {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    setError('');
    setSuccess(false);

    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      await api.put('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      setSuccess(true);

      setForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(
        err.response?.data?.error || 'Failed to change password.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-full bg-[#f6f7f9]">
      <div className="max-w-[1050px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <section className="relative overflow-hidden rounded-[24px] bg-ink-900 text-white mb-6 shadow-[0_18px_45px_rgba(15,23,42,0.12)] animate-fade-up">

          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)',
              backgroundSize: '34px 34px',
            }}
          />

          <div className="absolute -right-20 -top-28 w-72 h-72 rounded-full border border-white/10" />
          <div className="absolute -right-5 -top-16 w-48 h-48 rounded-full border border-brass/10" />

          <div className="relative p-5 sm:p-7">

            <div className="flex items-start gap-4">

              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-brass text-ink-900 flex items-center justify-center shrink-0 shadow-lg">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <rect
                    x="5"
                    y="10"
                    width="14"
                    height="10"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />

                  <path
                    d="M8 10V7a4 4 0 0 1 8 0v3"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />

                  <circle
                    cx="12"
                    cy="15"
                    r="1.2"
                    fill="currentColor"
                  />
                </svg>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/40">
                    Account Security
                  </span>

                  <span className="w-1 h-1 rounded-full bg-brass" />

                  <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-brass">
                    Secure
                  </span>
                </div>

                <h1 className="font-display text-3xl sm:text-4xl leading-none">
                  Change Password
                </h1>

                <p className="text-white/45 text-xs sm:text-sm mt-2 max-w-xl">
                  Update your account password to keep your banking
                  credentials secure.
                </p>
              </div>

            </div>

            {/* Security strip */}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-6 pt-4 border-t border-white/10">

              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-ledger-green" />
                <span className="text-[10px] text-white/50">
                  Secure connection
                </span>
              </div>

              <span className="hidden sm:block text-white/15">•</span>

              <span className="text-[10px] text-white/35">
                Passwords are encrypted
              </span>

              <span className="hidden sm:block text-white/15">•</span>

              <span className="text-[10px] text-white/35">
                Authorized account only
              </span>

            </div>
          </div>
        </section>

        {/* =====================================================
            CONTENT
        ===================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-5">

          {/* =================================================
              PASSWORD FORM
          ================================================= */}

          <form
            onSubmit={handleSubmit}
            className="bg-white border border-paper-line rounded-2xl shadow-[0_8px_28px_rgba(15,23,42,0.05)] overflow-hidden animate-scale-in"
          >

            <div className="p-5 sm:p-6">

              <div className="flex items-center justify-between mb-6">

                <div>
                  <p className="text-[9px] font-mono uppercase tracking-[0.18em] text-slate-soft">
                    Credentials
                  </p>

                  <h2 className="font-display text-xl text-ink-900 mt-1">
                    Update Login Password
                  </h2>
                </div>

                <div className="w-10 h-10 rounded-xl bg-ink-50 text-ink-700 flex items-center justify-center">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M7 11V8a5 5 0 0 1 10 0v3"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />

                    <rect
                      x="4"
                      y="11"
                      width="16"
                      height="10"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                  </svg>
                </div>

              </div>

              <div className="space-y-5">

                {/* Current */}

                <PasswordField
                  label="Current Password"
                  value={form.currentPassword}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      currentPassword: value,
                    })
                  }
                  placeholder="Enter your current password"
                />

                {/* Divider */}

                <div className="h-px bg-paper-line" />

                {/* New */}

                <PasswordField
                  label="New Password"
                  value={form.newPassword}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      newPassword: value,
                    })
                  }
                  placeholder="Enter your new password"
                  minLength={8}
                />

                {/* Confirm */}

                <PasswordField
                  label="Confirm New Password"
                  value={form.confirmPassword}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      confirmPassword: value,
                    })
                  }
                  placeholder="Confirm your new password"
                />

                {/* Error */}

                {error && (
                  <div className="flex items-start gap-3 rounded-xl px-4 py-3.5 bg-ledger-red-100 border border-ledger-red/20 text-ledger-red animate-fade-up">

                    <div className="w-6 h-6 rounded-lg bg-ledger-red/10 flex items-center justify-center shrink-0 font-semibold text-xs">
                      !
                    </div>

                    <div>
                      <p className="text-xs font-medium">
                        Password update failed
                      </p>

                      <p className="text-[11px] mt-0.5 opacity-80">
                        {error}
                      </p>
                    </div>

                  </div>
                )}

                {/* Success */}

                {success && (
                  <div className="flex items-start gap-3 rounded-xl px-4 py-3.5 bg-ledger-green-100 border border-ledger-green/20 text-ledger-green animate-scale-in">

                    <div className="w-6 h-6 rounded-lg bg-ledger-green/10 flex items-center justify-center shrink-0">
                      ✓
                    </div>

                    <div>
                      <p className="text-xs font-medium">
                        Password updated successfully
                      </p>

                      <p className="text-[11px] mt-0.5 opacity-80">
                        Your new password is now active.
                      </p>
                    </div>

                  </div>
                )}

              </div>
            </div>

            {/* Submit area */}

            <div className="px-5 sm:px-6 py-4 bg-[#fafafa] border-t border-paper-line flex justify-end">

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto min-w-[170px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M5 12h14M13 6l6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                    Update Password
                  </>
                )}
              </button>

            </div>
          </form>

          {/* =================================================
              SECURITY PANEL
          ================================================= */}

          <aside className="space-y-5">

            <div className="bg-white border border-paper-line rounded-2xl p-5 sm:p-6 animate-fade-up">

              <div className="flex items-center gap-3 mb-5">

                <div className="w-9 h-9 rounded-xl bg-ledger-green-100 text-ledger-green flex items-center justify-center">
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />

                    <path
                      d="m9 12 2 2 4-4"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div>
                  <p className="text-sm font-medium text-ink-900">
                    Password standards
                  </p>

                  <p className="text-[10px] text-slate-soft mt-0.5">
                    Recommended security rules
                  </p>
                </div>

              </div>

              <div className="space-y-4">

                <SecurityRule
                  title="Minimum 8 characters"
                  description="Use a password with at least 8 characters."
                />

                <SecurityRule
                  title="Use a unique password"
                  description="Avoid reusing passwords from other services."
                />

                <SecurityRule
                  title="Keep it private"
                  description="Never share your password with anyone."
                />

              </div>

            </div>

            <div className="relative overflow-hidden rounded-2xl bg-ink-900 text-white p-5 sm:p-6 animate-fade-up">

              <div className="absolute -right-10 -bottom-16 w-32 h-32 rounded-full border border-white/10" />

              <div className="relative">

                <div className="w-9 h-9 rounded-xl bg-white/10 text-brass flex items-center justify-center mb-4">
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <p className="font-display text-lg">
                  Stay protected
                </p>

                <p className="text-[11px] text-white/45 leading-relaxed mt-2">
                  Changing your password regularly helps protect
                  your account from unauthorized access.
                </p>

              </div>
            </div>

          </aside>
        </div>

        {/* Footer */}

        <div className="flex items-center justify-center gap-2 mt-6 text-[9px] font-mono uppercase tracking-wider text-slate-faint">
          <span className="w-1.5 h-1.5 rounded-full bg-ledger-green" />
          Account security protected
        </div>

      </div>
    </div>
  );
}


/* =========================================================
   PASSWORD FIELD
========================================================= */

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  minLength,
}) {
  const [show, setShow] = useState(false);

  return (
    <div>

      <div className="flex items-center justify-between mb-2">

        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-soft">
          {label}
        </label>

        {minLength && (
          <span className="text-[9px] font-mono text-slate-faint">
            MIN 8
          </span>
        )}

      </div>

      <div className="relative">

        <input
          type={show ? 'text' : 'password'}
          required
          minLength={minLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3.5 pr-12 border border-paper-line rounded-xl bg-white text-sm text-ink-900 placeholder:text-slate-faint focus:outline-none focus:ring-2 focus:ring-brass/40 focus:border-brass transition-all"
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg text-slate-soft hover:bg-ink-50 hover:text-ink-900 transition-colors"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="mx-auto"
            >
              <path
                d="M3 3l18 18"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
              <path
                d="M10.6 10.6a2 2 0 0 0 2.8 2.8"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
              <path
                d="M9.9 4.4A10.7 10.7 0 0 0 3 12s3 6 9 6a10.7 10.7 0 0 0 4.1-.8M14.1 5.1A10.7 10.7 0 0 1 21 12s-3 6-9 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="mx-auto"
            >
              <path
                d="M3 12s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6z"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <circle
                cx="12"
                cy="12"
                r="2.5"
                stroke="currentColor"
                strokeWidth="1.6"
              />
            </svg>
          )}
        </button>

      </div>
    </div>
  );
}


/* =========================================================
   SECURITY RULE
========================================================= */

function SecurityRule({ title, description }) {
  return (
    <div className="flex items-start gap-3">

      <span className="w-1.5 h-1.5 rounded-full bg-ledger-green mt-1.5 shrink-0" />

      <div>
        <p className="text-xs font-medium text-ink-900">
          {title}
        </p>

        <p className="text-[11px] text-slate-soft mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>

    </div>
  );
}