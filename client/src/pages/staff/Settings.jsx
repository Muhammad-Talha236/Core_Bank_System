import { useEffect, useState } from 'react';
import api from '../../api/client';

const LABELS = {
  APPROVAL_THRESHOLD: {
    title: 'Maker-Checker Approval Threshold',
    hint: 'Staff deposits, withdrawals, and transfers above this amount are held for a second employee to approve.',
  },
  ONLINE_TRANSFER_LIMIT: {
    title: 'Online Transfer Limit',
    hint: 'The maximum amount a customer can transfer through online banking without visiting a branch.',
  },
};

const SETTING_ICONS = {
  APPROVAL_THRESHOLD: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M12 3v18M3 12h18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  ),

  ONLINE_TRANSFER_LIMIT: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M4 12h15"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="m14 7 5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 6h5M4 18h5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),
};

export default function Settings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [drafts, setDrafts] = useState({});
  const [savingKey, setSavingKey] = useState(null);
  const [savedKey, setSavedKey] = useState(null);
  const [rowError, setRowError] = useState({});

  async function loadSettings() {
    try {
      setError('');

      const { data } = await api.get('/settings');

      setSettings(data);

      const initialDrafts = {};

      data.forEach((setting) => {
        initialDrafts[setting.SettingKey] =
          setting.SettingValue;
      });

      setDrafts(initialDrafts);
    } catch (err) {
      setError('Could not load system settings.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  function updateDraft(key, value) {
    setDrafts({
      ...drafts,
      [key]: value,
    });

    if (rowError[key]) {
      setRowError({
        ...rowError,
        [key]: '',
      });
    }

    if (savedKey === key) {
      setSavedKey(null);
    }
  }

  async function handleSave(key) {
    const value = drafts[key];

    if (value === '' || Number(value) < 0) {
      setRowError({
        ...rowError,
        [key]: 'Please enter a valid amount.',
      });
      return;
    }

    setSavingKey(key);
    setSavedKey(null);

    setRowError({
      ...rowError,
      [key]: '',
    });

    try {
      await api.put(`/settings/${key}`, {
        value,
      });

      setSavedKey(key);

      await loadSettings();

      setTimeout(() => {
        setSavedKey(null);
      }, 2500);
    } catch (err) {
      setRowError({
        ...rowError,
        [key]:
          err.response?.data?.error ||
          'Failed to update setting.',
      });
    } finally {
      setSavingKey(null);
    }
  }

  const hasChanges = (setting) =>
    drafts[setting.SettingKey] !== setting.SettingValue;

  return (
    <div className="min-h-full bg-[#f6f6f4]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-9">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <section className="relative overflow-hidden rounded-[24px] bg-ink-900 text-white mb-7 shadow-[0_14px_40px_rgba(15,23,42,0.10)] animate-fade-up">

          {/* Grid background */}
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)',
              backgroundSize: '34px 34px',
            }}
          />

          {/* Decorative circles */}
          <div className="absolute -right-24 -top-28 w-80 h-80 rounded-full border border-white/[0.06]" />
          <div className="absolute -right-8 -top-16 w-52 h-52 rounded-full border border-brass/[0.10]" />

          <div className="relative p-6 sm:p-7 lg:p-8">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">

              {/* Title */}
              <div className="flex items-start gap-4">

                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-brass text-ink-900 flex items-center justify-center shrink-0 shadow-lg">
                  <svg
                    width="25"
                    height="25"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    />

                    <path
                      d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.4v-.2a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 0 0 8.4 15a1.7 1.7 0 0 0-1.56-1.03H6v-2.4h.84A1.7 1.7 0 0 0 8.4 10a1.7 1.7 0 0 0-.34-1.88L8 8.06l1.7-1.7.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 12.67 5.2V5h2.4v.2a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.7 1.7-.06.06A1.7 1.7 0 0 0 19.34 10a1.7 1.7 0 0 0 1.56 1.03H21v2.4h-.1A1.7 1.7 0 0 0 19.4 15Z"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/35">
                      Administration
                    </span>

                    <span className="w-1 h-1 rounded-full bg-white/20" />

                    <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-brass">
                      Configuration
                    </span>
                  </div>

                  <h1 className="font-display text-3xl sm:text-4xl tracking-tight">
                    System Settings
                  </h1>

                  <p className="text-white/45 text-xs sm:text-sm mt-2 max-w-xl">
                    Manage bank-wide transaction limits and approval
                    controls across all branches.
                  </p>
                </div>

              </div>

              {/* Status */}
              <div className="flex items-center gap-2 self-start sm:self-center px-3 py-2 rounded-full bg-white/[0.06] border border-white/[0.08]">
                <span className="w-1.5 h-1.5 rounded-full bg-ledger-green" />

                <span className="text-[9px] font-mono uppercase tracking-wider text-white/50">
                  System Active
                </span>
              </div>

            </div>

            {/* Header metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 mt-7 pt-5 border-t border-white/10 max-w-2xl">

              <div>
                <p className="text-[9px] font-mono uppercase tracking-wider text-white/30">
                  Controls
                </p>

                <p className="text-xl font-display text-white mt-1">
                  {settings.length}
                </p>
              </div>

              <div>
                <p className="text-[9px] font-mono uppercase tracking-wider text-white/30">
                  Scope
                </p>

                <p className="text-xl font-display text-white mt-1">
                  Bank-wide
                </p>
              </div>

              <div className="hidden sm:block">
                <p className="text-[9px] font-mono uppercase tracking-wider text-white/30">
                  Audit
                </p>

                <div className="flex items-center gap-2 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-ledger-green" />

                  <p className="text-xl font-display text-white">
                    Enabled
                  </p>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* =====================================================
            DESCRIPTION
        ===================================================== */}

        <div className="flex items-center justify-between gap-4 mb-5">

          <div>
            <p className="text-[9px] font-mono uppercase tracking-[0.16em] text-slate-soft">
              Configuration Controls
            </p>

            <h2 className="font-display text-xl text-ink-900 mt-1">
              Bank-wide Limits
            </h2>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-soft">
            <span className="w-1.5 h-1.5 rounded-full bg-ledger-green" />
            Changes are audit logged
          </div>

        </div>

        {/* =====================================================
            LOADING
        ===================================================== */}

        {loading && (
          <div className="bg-white rounded-2xl border border-paper-line p-12 text-center shadow-[0_8px_30px_rgba(15,23,42,0.045)]">

            <div className="w-6 h-6 mx-auto border-2 border-paper-line border-t-ink-900 rounded-full animate-spin" />

            <p className="text-xs text-slate-soft mt-4">
              Loading system configuration...
            </p>

          </div>
        )}

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="rounded-xl px-4 py-3 bg-ledger-red-100 border border-ledger-red/20 text-ledger-red text-sm">
            {error}
          </div>
        )}

        {/* =====================================================
            SETTINGS
        ===================================================== */}

        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {settings.map((setting) => {

              const meta =
                LABELS[setting.SettingKey] || {
                  title: setting.SettingKey,
                  hint: setting.Description,
                };

              const changed = hasChanges(setting);

              const isSaving =
                savingKey === setting.SettingKey;

              const isSaved =
                savedKey === setting.SettingKey;

              const errorMessage =
                rowError[setting.SettingKey];

              return (
                <section
                  key={setting.SettingKey}
                  className="bg-white rounded-2xl border border-paper-line overflow-hidden shadow-[0_8px_30px_rgba(15,23,42,0.045)] hover:shadow-[0_12px_35px_rgba(15,23,42,0.07)] transition-shadow animate-fade-up"
                >

                  {/* Card header */}
                  <div className="px-5 sm:px-6 py-5 border-b border-paper-line">

                    <div className="flex items-start gap-3">

                      <div className="w-10 h-10 rounded-xl bg-ink-900 text-brass flex items-center justify-center shrink-0">
                        {SETTING_ICONS[setting.SettingKey] || (
                          <span className="text-lg">⚙</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex items-start justify-between gap-3">

                          <div>
                            <p className="text-[9px] font-mono uppercase tracking-[0.14em] text-slate-soft mb-1">
                              System Control
                            </p>

                            <h3 className="font-display text-lg text-ink-900">
                              {meta.title}
                            </h3>
                          </div>

                          {isSaved && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ledger-green-100 text-ledger-green text-[9px] font-medium shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-ledger-green" />
                              Saved
                            </span>
                          )}

                        </div>

                        <p className="text-xs text-slate-soft mt-2 leading-relaxed max-w-lg">
                          {meta.hint}
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* Card body */}
                  <div className="p-5 sm:p-6">

                    <div className="flex flex-col sm:flex-row sm:items-end gap-4">

                      <div className="flex-1">

                        <label className="block text-[9px] font-mono uppercase tracking-[0.14em] text-slate-soft mb-2">
                          Amount (PKR)
                        </label>

                        <div className="relative">

                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-soft">
                            PKR
                          </span>

                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={
                              drafts[setting.SettingKey] ?? ''
                            }
                            onChange={(e) =>
                              updateDraft(
                                setting.SettingKey,
                                e.target.value
                              )
                            }
                            className={`w-full pl-12 pr-3 py-2.5 rounded-xl border bg-white font-mono text-sm text-ink-900 outline-none transition-all ${
                              errorMessage
                                ? 'border-ledger-red focus:ring-2 focus:ring-ledger-red/10'
                                : 'border-paper-line focus:border-brass focus:ring-2 focus:ring-brass/10'
                            }`}
                          />

                        </div>

                        <p className="text-[10px] text-slate-faint mt-2">
                          Last updated{' '}
                          {new Date(
                            setting.UpdatedAt
                          ).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>

                      </div>

                      <button
                        onClick={() =>
                          handleSave(setting.SettingKey)
                        }
                        disabled={
                          isSaving || !changed
                        }
                        className={`sm:w-auto px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                          changed && !isSaving
                            ? 'bg-ink-900 text-white hover:bg-ink-800 shadow-sm'
                            : 'bg-ink-50 text-slate-soft cursor-not-allowed'
                        }`}
                      >
                        {isSaving ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            Save Changes
                            {changed && (
                              <span>→</span>
                            )}
                          </>
                        )}
                      </button>

                    </div>

                    {errorMessage && (
                      <div className="mt-4 rounded-xl px-4 py-3 bg-ledger-red-100 border border-ledger-red/20 text-ledger-red text-xs">
                        {errorMessage}
                      </div>
                    )}

                    {changed && !errorMessage && (
                      <div className="mt-4 flex items-center gap-2 text-[10px] text-brass-dark">
                        <span className="w-1.5 h-1.5 rounded-full bg-brass-dark" />
                        Unsaved changes
                      </div>
                    )}

                  </div>

                </section>
              );
            })}

          </div>
        )}

        {/* =====================================================
            EMPTY STATE
        ===================================================== */}

        {!loading && !error && settings.length === 0 && (
          <div className="bg-white rounded-2xl border border-paper-line py-16 text-center">

            <div className="w-12 h-12 rounded-2xl bg-ink-50 mx-auto flex items-center justify-center text-slate-soft">
              <span className="text-xl">⚙</span>
            </div>

            <p className="text-sm font-medium text-ink-900 mt-4">
              No system settings found
            </p>

            <p className="text-xs text-slate-soft mt-1">
              There are currently no configurable system controls.
            </p>

          </div>
        )}

        {/* =====================================================
            BOTTOM NOTE
        ===================================================== */}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-6 text-[9px] font-mono uppercase tracking-[0.16em] text-slate-faint text-center">

          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-ledger-green" />
            System configuration secured
          </div>

          <span className="hidden sm:block text-slate-300">
            •
          </span>

          <span>
            Changes are recorded in Audit Log
          </span>

        </div>

      </div>
    </div>
  );
}