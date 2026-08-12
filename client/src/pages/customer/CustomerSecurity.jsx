import { useState } from 'react';
import customerApi from '../../api/customerClient';

export default function CustomerSecurity() {
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      await customerApi.put('/customer-auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });

      setPwSuccess(true);
      setPwForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setPwError(
        err.response?.data?.error || 'Failed to change password.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  const fields = [
    {
      key: 'currentPassword',
      label: 'Current Password',
      placeholder: 'Enter your current password',
      show: showCurrent,
      setShow: setShowCurrent,
    },
    {
      key: 'newPassword',
      label: 'New Password',
      placeholder: 'Create a new password',
      minLength: 8,
      show: showNew,
      setShow: setShowNew,
    },
    {
      key: 'confirmPassword',
      label: 'Confirm New Password',
      placeholder: 'Re-enter your new password',
      show: showConfirm,
      setShow: setShowConfirm,
    },
  ];

  return (
    <div className="min-h-full pb-12">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-2">
        <div className="relative overflow-hidden rounded-2xl bg-ink-900 px-6 sm:px-8 py-7 sm:py-8 text-paper shadow-elevated animate-fade-up">
          {/* Decorative elements */}
          <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border border-brass/20" />
          <div className="absolute -right-5 -top-14 h-44 w-44 rounded-full border border-brass/10" />
          <div className="absolute right-10 bottom-[-70px] h-40 w-40 rounded-full bg-brass/10 blur-3xl" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brass/30 bg-brass/10">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="text-brass"
              >
                <rect x="4" y="10" width="16" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                <path d="M12 14v3" />
              </svg>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-brass">
                Account Protection
              </p>

              <h1 className="font-display text-2xl sm:text-3xl text-paper mt-1">
                Security Settings
              </h1>

              <p className="mt-1 text-sm text-paper/60">
                Keep your online banking credentials secure.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Password Form */}
          <form
            onSubmit={handleChangePassword}
            className="rounded-2xl border border-paper-line bg-white shadow-sm overflow-hidden animate-scale-in"
          >
            <div className="px-6 sm:px-7 py-5 border-b border-paper-line flex items-center justify-between">
              <div>
                <p className="font-display text-xl text-ink-900">
                  Change Password
                </p>
                <p className="text-xs text-slate-soft mt-1">
                  Choose a strong password you don't use elsewhere.
                </p>
              </div>

              <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-paper text-ink-800">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <path d="M12 3l7 4v5c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V7l7-4z" />
                  <path d="M9.5 12l1.7 1.7 3.6-3.8" />
                </svg>
              </div>
            </div>

            <div className="p-6 sm:p-7 space-y-5">
              {fields.map((field, index) => (
                <div key={field.key}>
                  <label className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-slate-soft">
                      {field.label}
                    </span>

                    {index === 0 && (
                      <span className="text-[10px] text-slate-soft">
                        Required
                      </span>
                    )}
                  </label>

                  <div className="relative">
                    <input
                      type={field.show ? 'text' : 'password'}
                      required
                      minLength={field.minLength}
                      value={pwForm[field.key]}
                      placeholder={field.placeholder}
                      onChange={(e) =>
                        setPwForm({
                          ...pwForm,
                          [field.key]: e.target.value,
                        })
                      }
                      className="
                        w-full
                        rounded-xl
                        border border-paper-line
                        bg-paper/40
                        px-4 py-3
                        pr-12
                        text-sm text-ink-900
                        placeholder:text-slate-soft/60
                        transition-all duration-200
                        focus:border-brass
                        focus:bg-white
                        focus:outline-none
                        focus:ring-4 focus:ring-brass/10
                      "
                    />

                    <button
                      type="button"
                      onClick={() => field.setShow(!field.show)}
                      className="
                        absolute right-3 top-1/2 -translate-y-1/2
                        flex h-8 w-8 items-center justify-center
                        rounded-lg text-slate-soft
                        hover:bg-paper hover:text-ink-900
                        transition-colors
                      "
                      aria-label={
                        field.show ? 'Hide password' : 'Show password'
                      }
                    >
                      {field.show ? (
                        <svg
                          width="17"
                          height="17"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        >
                          <path d="M3 3l18 18" />
                          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                          <path d="M9.9 4.3A10.8 10.8 0 0 1 12 4c5 0 8.7 4 10 8-0.5 1.5-1.3 2.7-2.4 3.8" />
                          <path d="M6.1 6.1C4.5 7.2 3.5 9 2 12c1.3 4 5 8 10 8 1 0 2-.2 2.9-.5" />
                        </svg>
                      ) : (
                        <svg
                          width="17"
                          height="17"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        >
                          <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
                          <circle cx="12" cy="12" r="2.5" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {field.key === 'newPassword' && (
                    <p className="mt-2 text-[11px] text-slate-soft">
                      Use at least 8 characters with a mix of letters,
                      numbers, and symbols.
                    </p>
                  )}
                </div>
              ))}

              {/* Alerts */}
              {pwError && (
                <div className="flex items-start gap-3 rounded-xl border border-ledger-red/20 bg-ledger-red-100/70 px-4 py-3.5 animate-fade-up">
                  <div className="mt-0.5 text-ledger-red">
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 8v5" />
                      <path d="M12 16h.01" />
                    </svg>
                  </div>

                  <p className="text-sm text-ledger-red">{pwError}</p>
                </div>
              )}

              {pwSuccess && (
                <div className="flex items-start gap-3 rounded-xl border border-ledger-green/20 bg-ledger-green-100/70 px-4 py-3.5 animate-scale-in">
                  <div className="mt-0.5 text-ledger-green">
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path d="m8.5 12 2.3 2.3 4.8-5" />
                    </svg>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-ledger-green">
                      Password updated successfully.
                    </p>
                    <p className="text-[11px] text-ledger-green/70 mt-0.5">
                      Your account is now protected with the new credentials.
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="
                    group relative w-full overflow-hidden
                    rounded-xl bg-ink-900
                    px-5 py-3.5
                    text-sm font-medium text-paper
                    transition-all duration-300
                    hover:-translate-y-0.5
                    hover:shadow-elevated
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {submitting ? 'Updating Password...' : 'Update Password'}

                    {!submitting && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      >
                        <path d="M5 12h14" />
                        <path d="m13 6 6 6-6 6" />
                      </svg>
                    )}
                  </span>

                  <span className="absolute inset-y-0 right-0 w-24 bg-brass/20 blur-xl transition-transform duration-500 group-hover:translate-x-[-10px]" />
                </button>
              </div>
            </div>
          </form>

          {/* Security Information */}
          <aside className="space-y-4 animate-fade-up">
            <div className="rounded-2xl border border-paper-line bg-paper/50 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-lg bg-brass/10 border border-brass/20 flex items-center justify-center text-brass">
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <path d="M12 3l7 4v5c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V7l7-4z" />
                  </svg>
                </div>

                <div>
                  <p className="font-medium text-sm text-ink-900">
                    Security Tips
                  </p>
                  <p className="text-[10px] text-slate-soft">
                    Keep your account protected
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  'Never share your password with anyone.',
                  'Avoid using passwords from other accounts.',
                  'Use a unique password for online banking.',
                ].map((tip) => (
                  <div key={tip} className="flex gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brass" />
                    <p className="text-xs leading-5 text-slate-soft">
                      {tip}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-ink-900 p-5 text-paper">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-brass">
                Protected
              </p>

              <p className="font-display text-lg mt-2">
                Your security matters.
              </p>

              <p className="text-xs leading-5 text-paper/55 mt-2">
                Your credentials are securely transmitted and never displayed
                in plain text.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}