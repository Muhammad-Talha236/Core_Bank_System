import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const SYSTEM_WIDE_ROLES = ['SuperAdmin', 'Auditor'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCustomerForm(form) {
  const errors = {};

  if (!form.name || form.name.trim().length < 3) {
    errors.name = 'Name must be at least 3 characters';
  }

  const cnicDigits = form.cnic.replace(/\D/g, ''); // sirf digits nikaalo
  if (cnicDigits.length !== 13) {
    errors.cnic = 'CNIC must be exactly 13 digits (e.g. 12345-1234567-1)';
  }

  const contactDigits = form.contact.replace(/\D/g, '');
  if (contactDigits.length !== 11) {
    errors.contact = 'Mobile number must be exactly 11 digits (e.g. 03001234567)';
  } else if (!contactDigits.startsWith('03')) {
    errors.contact = 'Mobile number must start with 03';
  }

  if (!EMAIL_REGEX.test(form.gmail.trim())) {
    errors.gmail = 'Please enter a valid email address';
  }

  return errors;
}

export default function Customers() {
  const { employee } = useAuth();
  const showBranch = SYSTEM_WIDE_ROLES.includes(employee.role);

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({
    name: '',
    cnic: '',
    contact: '',
    gmail: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadCustomers() {
    try {
      const { data } = await api.get('/customers');
      setCustomers(data);
    } catch {
      setError('Could not load customers.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    const errors = validateCustomerForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError('Please fix the highlighted fields before submitting.');
      return;
    }

    setSubmitting(true);

    try {
      await api.post('/customers', {
        name: form.name.trim(),
        cnic: form.cnic.replace(/\D/g, ''),
        contact: form.contact.replace(/\D/g, ''),
        gmail: form.gmail.trim().toLowerCase(),
      });

      setForm({
        name: '',
        cnic: '',
        contact: '',
        gmail: '',
      });
      setFieldErrors({});

      setShowForm(false);
      loadCustomers();
    } catch (err) {
      setFormError(
        err.response?.data?.error || 'Failed to add customer.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  function updateField(key, value) {
    setForm({ ...form, [key]: value });
    if (fieldErrors[key]) {
      setFieldErrors({ ...fieldErrors, [key]: undefined });
    }
  }

  const filtered = customers.filter(
    (c) =>
      !query ||
      c.Name.toLowerCase().includes(query.toLowerCase()) ||
      c.CNIC.includes(query) ||
      String(c.CustID).includes(query)
  );

  function avatarColor(id) {
    const colors = [
      'bg-ink-700',
      'bg-brass-dark',
      'bg-ledger-green',
      'bg-ink-600',
    ];

    return colors[id % colors.length];
  }

  const FIELDS = [
    {
      key: 'name',
      label: 'Full Name',
      placeholder: 'Enter full name',
    },
    {
      key: 'cnic',
      label: 'CNIC (13 digits)',
      placeholder: '12345-1234567-1',
      maxLength: 15,
    },
    {
      key: 'contact',
      label: 'Contact (11 digits)',
      placeholder: '03XX-XXXXXXX',
      maxLength: 12,
    },
    {
      key: 'gmail',
      label: 'Email Address',
      type: 'email',
      placeholder: 'customer@gmail.com',
    },
  ];

  return (
    <div className="min-h-full bg-[#f7f8fa]">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">

        {/* =========================================================
            HEADER
        ========================================================= */}
        <div className="relative overflow-hidden rounded-2xl bg-ink-900 text-white mb-7 sm:mb-8 shadow-[0_12px_35px_rgba(15,23,42,0.12)] animate-fade-up">

          <div className="absolute -right-20 -top-24 w-72 h-72 rounded-full bg-brass/10 blur-2xl" />
          <div className="absolute right-20 bottom-[-120px] w-64 h-64 rounded-full bg-white/5 blur-3xl" />

          <div className="relative px-5 py-6 sm:px-7 sm:py-7 lg:px-9 lg:py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

              <div className="flex items-start gap-4">
                <div className="hidden sm:flex w-12 h-12 rounded-xl bg-white/10 border border-white/10 items-center justify-center shrink-0">
                  <svg
                    className="w-6 h-6 text-brass"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4-8a4 4 0 110 8 4 4 0 010-8z"
                    />
                  </svg>
                </div>

                <div>
                  <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-brass mb-1.5">
                    Customer Management
                  </p>

                  <h1 className="font-display text-2xl sm:text-3xl lg:text-[34px] leading-tight">
                    Customers
                  </h1>

                  <p className="text-white/60 text-sm mt-1.5 max-w-xl">
                    Manage customer profiles, identification details and
                    account-related records.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowForm(!showForm)}
                className="group inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-brass text-ink-900 font-semibold text-sm shadow-lg shadow-black/10 hover:bg-brass/90 active:scale-[0.98] transition-all duration-200 w-full sm:w-auto"
              >
                <span className="text-lg leading-none">
                  {showForm ? '×' : '+'}
                </span>

                <span>
                  {showForm ? 'Cancel' : 'Add Customer'}
                </span>
              </button>

            </div>
          </div>
        </div>

        {/* =========================================================
            ADD CUSTOMER FORM
        ========================================================= */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-paper-line rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.06)] p-5 sm:p-7 mb-7 animate-scale-in"
          >
            <div className="flex items-center gap-3 pb-5 mb-5 border-b border-paper-line">
              <div className="w-10 h-10 rounded-xl bg-ink-900 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-brass"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>

              <div>
                <h2 className="font-display text-lg text-ink-900">
                  New Customer
                </h2>

                <p className="text-xs text-slate-soft mt-0.5">
                  Enter the customer's verified information.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-soft mb-2">
                    {f.label}
                  </label>

                  <input
                    type={f.type || 'text'}
                    required
                    maxLength={f.maxLength}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={(e) => updateField(f.key, e.target.value)}
                    className={`w-full h-11 px-3.5 bg-[#fafafa] border rounded-xl text-sm text-ink-900 placeholder:text-slate-soft/60 focus:outline-none focus:bg-white focus:ring-4 transition-all ${
                      fieldErrors[f.key]
                        ? 'border-ledger-red focus:border-ledger-red focus:ring-ledger-red/10'
                        : 'border-paper-line focus:border-brass focus:ring-brass/10'
                    }`}
                  />

                  {fieldErrors[f.key] && (
                    <p className="text-xs text-ledger-red mt-1.5">{fieldErrors[f.key]}</p>
                  )}
                </div>
              ))}
            </div>

            {formError && (
              <div className="mt-5 flex items-start gap-2.5 text-sm text-ledger-red bg-ledger-red-100/60 border border-ledger-red/20 rounded-xl px-4 py-3">
                <svg
                  className="w-4 h-4 mt-0.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path
                    strokeLinecap="round"
                    d="M12 8v4m0 4h.01"
                  />
                </svg>

                <span>{formError}</span>
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFieldErrors({});
                  setFormError('');
                }}
                className="h-11 px-5 rounded-xl border border-paper-line text-sm font-medium text-slate hover:bg-paper transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="h-11 px-6 rounded-xl bg-ink-900 text-white text-sm font-semibold hover:bg-ink-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? 'Saving Customer...' : 'Save Customer'}
              </button>
            </div>
          </form>
        )}

        {/* =========================================================
            TOOLBAR
        ========================================================= */}
        {!loading && !error && customers.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5 animate-fade-up">

            <div>
              <p className="text-sm font-medium text-ink-900">
                Customer Directory
              </p>

              <p className="text-xs text-slate-soft mt-0.5">
                {filtered.length} of {customers.length} customers
              </p>
            </div>

            <div className="relative w-full sm:w-[340px]">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-soft"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="7" />
                <path
                  strokeLinecap="round"
                  d="m20 20-4-4"
                />
              </svg>

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, CNIC or ID..."
                className="w-full h-11 pl-10 pr-4 bg-white border border-paper-line rounded-xl text-sm focus:outline-none focus:border-brass focus:ring-4 focus:ring-brass/10 transition-all shadow-sm"
              />
            </div>
          </div>
        )}

        {/* =========================================================
            LOADING
        ========================================================= */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="bg-white border border-paper-line rounded-2xl p-5 animate-pulse"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-full bg-slate-100" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-100 rounded w-32 mb-2" />
                    <div className="h-3 bg-slate-100 rounded w-16" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="h-3 bg-slate-100 rounded" />
                  <div className="h-3 bg-slate-100 rounded" />
                  <div className="h-3 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* =========================================================
            ERROR
        ========================================================= */}
        {error && (
          <div className="bg-white border border-ledger-red/20 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-ledger-red-100 flex items-center justify-center mb-3">
              <svg
                className="w-6 h-6 text-ledger-red"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3m0 4h.01M10.3 3.8L2.7 17a2 2 0 001.7 3h15.2a2 2 0 001.7-3L13.7 3.8a2 2 0 00-3.4 0z"
                />
              </svg>
            </div>

            <p className="text-ledger-red font-medium text-sm">
              {error}
            </p>
          </div>
        )}

        {/* =========================================================
            CUSTOMER GRID
        ========================================================= */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">

            {filtered.map((c, i) => (
              <div
                key={c.CustID}
                className="group relative bg-white border border-paper-line rounded-2xl p-5 sm:p-6 shadow-[0_4px_18px_rgba(15,23,42,0.035)] hover:shadow-[0_12px_30px_rgba(15,23,42,0.09)] hover:-translate-y-0.5 transition-all duration-300 animate-fade-up overflow-hidden"
                style={{
                  animationDelay: `${Math.min(i, 8) * 45}ms`,
                }}
              >
                {/* Top accent */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-ink-900 via-brass to-transparent opacity-70" />

                {/* Customer Header */}
                <div className="flex items-center justify-between gap-3 mb-5">

                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl ${avatarColor(
                        c.CustID
                      )} flex items-center justify-center text-white font-display text-base shrink-0 shadow-sm`}
                    >
                      {c.Name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-ink-900 truncate text-[15px]">
                        {c.Name}
                      </p>

                      <p className="font-mono text-[10px] text-slate-soft uppercase tracking-wide mt-0.5">
                        Customer #{c.CustID}
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 w-2 h-2 rounded-full bg-ledger-green ring-4 ring-ledger-green/10" />
                </div>

                {/* Divider */}
                <div className="border-t border-paper-line mb-4" />

                {/* Details */}
                <div className="space-y-3">

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                      <svg
                        className="w-4 h-4 text-slate-soft"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        viewBox="0 0 24 24"
                      >
                        <rect
                          x="3"
                          y="5"
                          width="18"
                          height="14"
                          rx="2"
                        />
                        <path d="M7 10h4M7 14h7" />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase tracking-wider font-mono text-slate-soft">
                        CNIC
                      </p>

                      <p className="font-mono text-xs sm:text-sm text-ink-900 truncate mt-0.5">
                        {c.CNIC}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                      <svg
                        className="w-4 h-4 text-slate-soft"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 4h3l2 5-2 1.5a16 16 0 005.5 5.5L15 14l5 2v3a1 1 0 01-1 1C10.7 20 4 13.3 4 5a1 1 0 011-1z"
                        />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase tracking-wider font-mono text-slate-soft">
                        Contact
                      </p>

                      <p className="text-sm text-ink-900 truncate mt-0.5">
                        {c.Contact}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                      <svg
                        className="w-4 h-4 text-slate-soft"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        viewBox="0 0 24 24"
                      >
                        <rect
                          x="3"
                          y="5"
                          width="18"
                          height="14"
                          rx="2"
                        />
                        <path
                          strokeLinecap="round"
                          d="m4 7 8 6 8-6"
                        />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase tracking-wider font-mono text-slate-soft">
                        Email
                      </p>

                      <p
                        title={c.Gmail}
                        className="text-sm text-ink-900 truncate mt-0.5"
                      >
                        {c.Gmail}
                      </p>
                    </div>
                  </div>

                  {/* Branch */}
                  {showBranch && (
                    <>
                      <div className="border-t border-paper-line pt-3 mt-1" />

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] uppercase tracking-wider font-mono text-slate-soft">
                          Branch
                        </span>

                        {c.BranchName ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-ink-900 text-white text-[10px] font-medium max-w-[65%] truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-brass shrink-0" />
                            {c.BranchName}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-ledger-red-100 text-ledger-red text-[10px] font-medium">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* =====================================================
                EMPTY STATE
            ===================================================== */}
            {filtered.length === 0 && (
              <div className="col-span-full bg-white border border-paper-line rounded-2xl py-16 px-6 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                  <svg
                    className="w-7 h-7 text-slate-soft"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="11" cy="11" r="6" />
                    <path
                      strokeLinecap="round"
                      d="m16 16 4 4"
                    />
                  </svg>
                </div>

                <h3 className="font-display text-lg text-ink-900">
                  {customers.length === 0
                    ? 'No customers yet'
                    : 'No matching customers'}
                </h3>

                <p className="text-sm text-slate-soft mt-1 max-w-sm mx-auto">
                  {customers.length === 0
                    ? 'Customer records will appear here once they are added.'
                    : 'Try searching with a different name, CNIC or customer ID.'}
                </p>

                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="mt-5 text-sm font-medium text-ink-900 hover:text-brass transition-colors"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}