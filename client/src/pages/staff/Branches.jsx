import { useEffect, useState } from 'react';
import api from '../../api/client';

// =========================================================
// VALIDATION HELPERS
// =========================================================

const NAME_REGEX = /^[A-Za-z\s]+$/;

// Letters and spaces only
function onlyLetters(value) {
  return value.replace(/[^A-Za-z\s]/g, '');
}

// Letters + numbers only, uppercase
function onlyAlphaNumeric(value) {
  return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

function validateBranchForm(form) {
  const errors = {};

  const trimmedName = form.branchName.trim();

  if (trimmedName.length < 3) {
    errors.branchName = 'Branch name must be at least 3 characters';
  } else if (!NAME_REGEX.test(trimmedName)) {
    errors.branchName = 'Branch name can only contain letters and spaces';
  }

  const code = form.branchCode.trim();

  if (code.length < 2 || code.length > 10) {
    errors.branchCode = 'Branch code must be 2-10 characters';
  } else if (!/^[A-Za-z0-9]+$/.test(code)) {
    errors.branchCode = 'Branch code can only contain letters and numbers';
  }

  if (form.city && !NAME_REGEX.test(form.city.trim())) {
    errors.city = 'City can only contain letters and spaces';
  }

  if (form.address && form.address.trim().length < 5) {
    errors.address = 'Address looks too short';
  }

  return errors;
}

// =========================================================
// MAIN COMPONENT
// =========================================================

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [stats, setStats] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // =========================================================
  // CREATE BRANCH
  // =========================================================

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    branchName: '',
    branchCode: '',
    city: '',
    address: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // =========================================================
  // EDIT BRANCH
  // =========================================================

  const [editingBranch, setEditingBranch] = useState(null);

  const [editForm, setEditForm] = useState({
    branchName: '',
    branchCode: '',
    city: '',
    address: '',
  });

  const [editFieldErrors, setEditFieldErrors] = useState({});
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // =========================================================
  // ACTIVATE / DEACTIVATE
  // =========================================================

  const [statusError, setStatusError] = useState({});
  const [statusBusyId, setStatusBusyId] = useState(null);

  // =========================================================
  // LOAD BRANCHES + STATS
  // =========================================================

  async function loadBranches() {
    try {
      setError('');

      const [branchesRes, customersRes, accountsRes] =
        await Promise.all([
          api.get('/branches'),
          api.get('/customers'),
          api.get('/accounts'),
        ]);

      const branchData = branchesRes.data;
      const customers = customersRes.data;
      const accounts = accountsRes.data;

      setBranches(branchData);

      const byBranch = {};

      branchData.forEach((branch) => {
        const branchAccounts = accounts.filter(
          (account) => account.BranchID === branch.BranchID
        );

        byBranch[branch.BranchID] = {
          customers: customers.filter(
            (customer) => customer.BranchID === branch.BranchID
          ).length,

          accounts: branchAccounts.length,

          balance: branchAccounts.reduce(
            (sum, account) =>
              sum + parseFloat(account.Balance || 0),
            0
          ),
        };
      });

      setStats(byBranch);
    } catch (err) {
      setError('Could not load branches.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBranches();
  }, []);

  // =========================================================
  // CREATE FORM FIELD UPDATE
  // =========================================================

  function updateField(key, value) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({
        ...prev,
        [key]: undefined,
      }));
    }
  }

  // =========================================================
  // CREATE BRANCH
  // =========================================================

  async function handleSubmit(e) {
    e.preventDefault();

    setFormError('');

    const errors = validateBranchForm(form);

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setFormError(
        'Please fix the highlighted fields before submitting.'
      );
      return;
    }

    setSubmitting(true);

    try {
      await api.post('/branches', {
        branchName: form.branchName.trim(),
        branchCode: form.branchCode.trim().toUpperCase(),
        city: form.city.trim() || null,
        address: form.address.trim() || null,
      });

      setForm({
        branchName: '',
        branchCode: '',
        city: '',
        address: '',
      });

      setFieldErrors({});
      setFormError('');
      setShowForm(false);

      await loadBranches();
    } catch (err) {
      setFormError(
        err.response?.data?.error ||
          'Failed to create branch.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  // =========================================================
  // OPEN EDIT MODAL
  // =========================================================

  function openEdit(branch) {
    setEditingBranch(branch);

    setEditForm({
      branchName: branch.BranchName || '',
      branchCode: branch.BranchCode || '',
      city: branch.City || '',
      address: branch.Address || '',
    });

    setEditFieldErrors({});
    setEditError('');
  }

  // =========================================================
  // EDIT FORM UPDATE
  // =========================================================

  function updateEditField(key, value) {
    setEditForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    if (editFieldErrors[key]) {
      setEditFieldErrors((prev) => ({
        ...prev,
        [key]: undefined,
      }));
    }
  }

  // =========================================================
  // UPDATE BRANCH
  // =========================================================

  async function handleEditSubmit(e) {
    e.preventDefault();

    setEditError('');

    const errors = validateBranchForm(editForm);

    setEditFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setEditError(
        'Please fix the highlighted fields before saving.'
      );
      return;
    }

    setEditSubmitting(true);

    try {
      await api.put(
        `/branches/${editingBranch.BranchID}`,
        {
          branchName: editForm.branchName.trim(),
          branchCode: editForm.branchCode
            .trim()
            .toUpperCase(),
          city: editForm.city.trim() || null,
          address: editForm.address.trim() || null,
        }
      );

      setEditingBranch(null);
      setEditFieldErrors({});
      setEditError('');

      await loadBranches();
    } catch (err) {
      setEditError(
        err.response?.data?.error ||
          'Failed to update branch.'
      );
    } finally {
      setEditSubmitting(false);
    }
  }

  // =========================================================
  // ACTIVATE / DEACTIVATE
  // =========================================================

  async function handleToggleStatus(branch) {
    setStatusBusyId(branch.BranchID);

    setStatusError((prev) => ({
      ...prev,
      [branch.BranchID]: '',
    }));

    try {
      await api.patch(
        `/branches/${branch.BranchID}/status`,
        {
          isActive: !branch.IsActive,
        }
      );

      await loadBranches();
    } catch (err) {
      setStatusError((prev) => ({
        ...prev,
        [branch.BranchID]:
          err.response?.data?.error ||
          'Could not update status.',
      }));
    } finally {
      setStatusBusyId(null);
    }
  }

  // =========================================================
  // CLOSE EDIT MODAL
  // =========================================================

  function closeEdit() {
    if (editSubmitting) return;

    setEditingBranch(null);
    setEditFieldErrors({});
    setEditError('');
  }

  // =========================================================
  // TOTAL STATS
  // =========================================================

  const totalCustomers = Object.values(stats).reduce(
    (sum, item) => sum + item.customers,
    0
  );

  const totalAccounts = Object.values(stats).reduce(
    (sum, item) => sum + item.accounts,
    0
  );

  const totalBalance = Object.values(stats).reduce(
    (sum, item) => sum + item.balance,
    0
  );

  const formatBalance = (value) => {
    if (value >= 10000000) {
      return `Rs ${(value / 10000000).toFixed(1)}Cr`;
    }

    if (value >= 100000) {
      return `Rs ${(value / 100000).toFixed(1)}L`;
    }

    return `Rs ${value.toLocaleString('en-PK')}`;
  };

  // =========================================================
  // CREATE FORM FIELDS
  // =========================================================

  const FIELDS = [
    {
      key: 'branchName',
      label: 'Branch Name',
      placeholder: 'e.g. Main City Branch',
      required: true,
      onChange: (v) =>
        updateField('branchName', onlyLetters(v)),
    },
    {
      key: 'branchCode',
      label: 'Branch Code',
      placeholder: 'e.g. LHR01',
      required: true,
      maxLength: 10,
      onChange: (v) =>
        updateField(
          'branchCode',
          onlyAlphaNumeric(v)
        ),
    },
    {
      key: 'city',
      label: 'City',
      placeholder: 'e.g. Lahore',
      onChange: (v) =>
        updateField('city', onlyLetters(v)),
    },
    {
      key: 'address',
      label: 'Address',
      placeholder: 'Branch address',
      onChange: (v) =>
        updateField('address', v),
    },
  ];

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-full bg-[#f6f7f9]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

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

          <div className="absolute -right-24 -top-32 w-80 h-80 rounded-full border border-white/10" />

          <div className="absolute -right-8 -top-20 w-56 h-56 rounded-full border border-brass/10" />

          <div className="relative p-5 sm:p-7 lg:p-8">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

              {/* LEFT */}

              <div className="flex items-start gap-4">

                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-brass text-ink-900 flex items-center justify-center shrink-0 shadow-lg">
                  <svg
                    width="25"
                    height="25"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M3 10.5 12 4l9 6.5"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    <path
                      d="M5 10v8m4-8v8m6-8v8m4-8v8M3 20h18"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1.5">

                    <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/40">
                      Administration
                    </span>

                    <span className="w-1 h-1 rounded-full bg-brass" />

                    <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-brass">
                      Network
                    </span>

                  </div>

                  <h1 className="font-display text-3xl sm:text-4xl leading-none tracking-tight">
                    Branches
                  </h1>

                  <p className="text-white/45 text-xs sm:text-sm mt-2 max-w-xl">
                    Monitor branches, customer volume and account balances
                    across the banking network.
                  </p>
                </div>

              </div>

              {/* ADD BUTTON */}

              <button
                onClick={() => {
                  setShowForm(!showForm);
                  setFormError('');
                  setFieldErrors({});
                }}
                className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-white text-ink-900 px-5 py-3 text-sm font-medium hover:bg-brass transition-all duration-200 shadow-sm"
              >
                <span className="text-lg leading-none">
                  {showForm ? '×' : '+'}
                </span>

                {showForm
                  ? 'Close Form'
                  : 'Add Branch'}
              </button>

            </div>

            {/* HEADER STATS */}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-7 pt-5 border-t border-white/10">

              <HeaderStat
                label="Network Branches"
                value={branches.length}
                icon="branch"
              />

              <HeaderStat
                label="Total Customers"
                value={totalCustomers.toLocaleString('en-PK')}
                icon="users"
              />

              <HeaderStat
                label="Managed Balance"
                value={formatBalance(totalBalance)}
                icon="balance"
              />

            </div>
          </div>
        </section>

        {/* =====================================================
            CREATE BRANCH FORM
        ===================================================== */}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-paper-line rounded-2xl p-5 sm:p-6 mb-6 shadow-[0_8px_28px_rgba(15,23,42,0.05)] animate-scale-in"
          >

            <div className="flex items-center justify-between mb-5">

              <div>
                <p className="text-[9px] font-mono uppercase tracking-[0.18em] text-slate-soft">
                  New Location
                </p>

                <h2 className="font-display text-xl text-ink-900 mt-1">
                  Create Branch
                </h2>
              </div>

              <div className="w-9 h-9 rounded-xl bg-ink-50 flex items-center justify-center text-ink-700">
                +
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {FIELDS.map((field) => (
                <div key={field.key}>

                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-soft mb-2">
                    {field.label}
                  </label>

                  <input
                    required={field.required}
                    maxLength={field.maxLength}
                    placeholder={field.placeholder}
                    value={form[field.key]}
                    onChange={(e) =>
                      field.onChange(e.target.value)
                    }
                    className={`w-full px-4 py-3 border rounded-xl bg-white text-sm text-ink-900 placeholder:text-slate-faint focus:outline-none focus:ring-2 transition-all ${
                      fieldErrors[field.key]
                        ? 'border-ledger-red focus:ring-ledger-red/30 focus:border-ledger-red'
                        : 'border-paper-line focus:ring-brass/50 focus:border-brass'
                    }`}
                  />

                  {fieldErrors[field.key] && (
                    <p className="text-[11px] text-ledger-red mt-1.5">
                      {fieldErrors[field.key]}
                    </p>
                  )}

                </div>
              ))}

              {formError && (
                <div className="sm:col-span-2 flex items-center gap-2 text-sm text-ledger-red bg-ledger-red-100 border border-ledger-red/20 rounded-xl px-4 py-3">
                  <span>!</span>
                  {formError}
                </div>
              )}

              <div className="sm:col-span-2 flex justify-end">

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-3 rounded-xl bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 disabled:opacity-50 transition-all"
                >
                  {submitting
                    ? 'Creating...'
                    : 'Create Branch'}
                </button>

              </div>
            </div>
          </form>
        )}

        {/* =====================================================
            STATUS
        ===================================================== */}

        {loading && (
          <div className="bg-white border border-paper-line rounded-2xl p-10 text-center">

            <div className="inline-flex items-center gap-2 text-sm text-slate-soft">

              <span className="w-4 h-4 border-2 border-ink-200 border-t-ink-900 rounded-full animate-spin" />

              Loading branches...

            </div>
          </div>
        )}

        {error && (
          <div className="bg-ledger-red-100 border border-ledger-red/20 rounded-xl px-4 py-3 text-sm text-ledger-red">
            {error}
          </div>
        )}

        {/* =====================================================
            BRANCH GRID
        ===================================================== */}

        {!loading && !error && (
          <>

            <div className="flex items-end justify-between mb-4">

              <div>

                <p className="text-[9px] font-mono uppercase tracking-[0.18em] text-slate-soft">
                  Network Directory
                </p>

                <h2 className="font-display text-xl text-ink-900 mt-1">
                  Branches
                </h2>

              </div>

              <span className="hidden sm:block text-[10px] font-mono text-slate-faint">
                {branches.length} LOCATIONS
              </span>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

              {branches.map((branch, index) => {

                const s =
                  stats[branch.BranchID] || {
                    customers: 0,
                    accounts: 0,
                    balance: 0,
                  };

                const isActive =
                  branch.IsActive !== false;

                const isBusy =
                  statusBusyId === branch.BranchID;

                return (
                  <div
                    key={branch.BranchID}
                    className="group relative bg-white border border-paper-line rounded-2xl overflow-hidden shadow-[0_5px_22px_rgba(15,23,42,0.035)] hover:shadow-[0_14px_35px_rgba(15,23,42,0.09)] hover:-translate-y-0.5 transition-all duration-300 animate-fade-up"
                    style={{
                      animationDelay: `${index * 60}ms`,
                    }}
                  >

                    {/* ACCENT */}

                    <div
                      className={`h-[3px] ${
                        isActive
                          ? 'bg-gradient-to-r from-ink-900 via-ink-700 to-brass'
                          : 'bg-ledger-red'
                      }`}
                    />

                    <div className="p-5">

                      {/* BRANCH HEADING */}

                      <div className="flex items-start justify-between gap-3">

                        <div className="flex items-start gap-3">

                          <div className="w-10 h-10 rounded-xl bg-ink-900 text-brass flex items-center justify-center shrink-0">

                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M3 10.5 12 4l9 6.5"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />

                              <path
                                d="M5 10v8m4-8v8m6-8v8m4-8v8M3 20h18"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                              />
                            </svg>

                          </div>

                          <div className="min-w-0">

                            <h3 className="font-display text-xl text-ink-900 truncate">
                              {branch.BranchName}
                            </h3>

                            <p className="font-mono text-[10px] text-brass-dark mt-0.5 tracking-wider">
                              {branch.BranchCode}
                            </p>

                          </div>

                        </div>

                        {/* STATUS + CITY */}

                        <div className="flex flex-col items-end gap-1.5 shrink-0">

                          <span
                            className={`text-[9px] font-mono uppercase tracking-wider px-2 py-1 rounded-full ${
                              isActive
                                ? 'bg-ledger-green/10 text-ledger-green'
                                : 'bg-ledger-red/10 text-ledger-red'
                            }`}
                          >
                            {isActive
                              ? 'Active'
                              : 'Inactive'}
                          </span>

                          <span className="pill pill-navy">
                            {branch.City ||
                              'Unassigned'}
                          </span>

                        </div>

                      </div>

                      {/* ADDRESS */}

                      {branch.Address ? (
                        <div className="flex items-start gap-2 mt-5">

                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="text-slate-soft mt-0.5 shrink-0"
                          >
                            <path
                              d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12z"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            />

                            <circle
                              cx="12"
                              cy="9"
                              r="2"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            />
                          </svg>

                          <p className="text-xs text-slate-soft leading-relaxed line-clamp-2">
                            {branch.Address}
                          </p>

                        </div>
                      ) : (
                        <p className="text-xs text-slate-faint mt-5">
                          No address provided
                        </p>
                      )}

                      {/* DIVIDER */}

                      <div className="h-px bg-paper-line my-5" />

                      {/* STATS */}

                      <div className="grid grid-cols-3 divide-x divide-paper-line">

                        <BranchMetric
                          value={s.customers}
                          label="Customers"
                        />

                        <BranchMetric
                          value={s.accounts}
                          label="Accounts"
                        />

                        <BranchMetric
                          value={formatBalance(s.balance)}
                          label="Balance"
                          small
                        />

                      </div>

                    </div>

                    {/* =================================================
                        CARD ACTIONS
                    ================================================= */}

                    <div className="px-5 py-3 bg-[#fafafa] border-t border-paper-line">

                      <div className="flex items-center justify-between gap-3">

                        <div className="flex items-center gap-3">

                          <button
                            type="button"
                            onClick={() =>
                              openEdit(branch)
                            }
                            className="text-xs text-ink-900 hover:text-brass-dark hover:underline font-medium transition"
                          >
                            Edit
                          </button>

                          <span className="w-px h-3 bg-paper-line" />

                          <button
                            type="button"
                            onClick={() =>
                              handleToggleStatus(
                                branch
                              )
                            }
                            disabled={isBusy}
                            className={`text-xs hover:underline font-medium disabled:opacity-50 transition ${
                              isActive
                                ? 'text-ledger-red'
                                : 'text-ledger-green'
                            }`}
                          >
                            {isBusy
                              ? 'Updating...'
                              : isActive
                              ? 'Deactivate'
                              : 'Activate'}
                          </button>

                        </div>

                        <div className="flex items-center gap-2">

                          <span className="text-[9px] font-mono uppercase tracking-wider text-slate-faint">
                            ID
                          </span>

                          <span className="text-[10px] font-mono text-slate-soft">
                            #{branch.BranchID}
                          </span>

                        </div>

                      </div>

                      {statusError[
                        branch.BranchID
                      ] && (
                        <p className="text-[10px] text-ledger-red mt-2">
                          {
                            statusError[
                              branch.BranchID
                            ]
                          }
                        </p>
                      )}

                    </div>

                  </div>
                );
              })}

              {/* EMPTY STATE */}

              {branches.length === 0 && (
                <div className="col-span-full bg-white border border-paper-line rounded-2xl py-16 text-center">

                  <div className="w-12 h-12 rounded-2xl bg-ink-50 mx-auto flex items-center justify-center text-ink-700 text-xl">
                    +
                  </div>

                  <p className="font-display text-lg text-ink-900 mt-4">
                    No branches yet
                  </p>

                  <p className="text-xs text-slate-soft mt-1">
                    Create your first branch to get started.
                  </p>

                </div>
              )}

            </div>
          </>
        )}
      </div>

      {/* =========================================================
          EDIT BRANCH MODAL
      ========================================================= */}

      {editingBranch && (
        <div
          className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeEdit();
            }
          }}
        >

          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-[0_25px_70px_rgba(15,23,42,0.25)] animate-scale-in max-h-[90vh] overflow-y-auto">

            {/* MODAL HEADER */}

            <div className="flex items-start justify-between gap-4 mb-5">

              <div>

                <p className="text-[9px] font-mono uppercase tracking-[0.18em] text-slate-soft">
                  Branch Management
                </p>

                <h3 className="font-display text-xl text-ink-900 mt-1">
                  Edit Branch
                </h3>

              </div>

              <button
                type="button"
                onClick={closeEdit}
                disabled={editSubmitting}
                className="w-8 h-8 rounded-lg bg-ink-50 text-ink-700 hover:bg-ink-100 transition disabled:opacity-50"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleEditSubmit}
              className="space-y-4"
            >

              {/* BRANCH NAME */}

              <EditInput
                label="Branch Name"
                value={editForm.branchName}
                required
                error={editFieldErrors.branchName}
                onChange={(value) =>
                  updateEditField(
                    'branchName',
                    onlyLetters(value)
                  )
                }
              />

              {/* BRANCH CODE */}

              <EditInput
                label="Branch Code"
                value={editForm.branchCode}
                required
                maxLength={10}
                error={editFieldErrors.branchCode}
                onChange={(value) =>
                  updateEditField(
                    'branchCode',
                    onlyAlphaNumeric(value)
                  )
                }
              />

              {/* CITY */}

              <EditInput
                label="City"
                value={editForm.city}
                error={editFieldErrors.city}
                onChange={(value) =>
                  updateEditField(
                    'city',
                    onlyLetters(value)
                  )
                }
              />

              {/* ADDRESS */}

              <EditInput
                label="Address"
                value={editForm.address}
                error={editFieldErrors.address}
                onChange={(value) =>
                  updateEditField(
                    'address',
                    value
                  )
                }
              />

              {/* ERROR */}

              {editError && (
                <div className="flex items-center gap-2 text-sm text-ledger-red bg-ledger-red-100 border border-ledger-red/20 rounded-xl px-4 py-3">
                  <span>!</span>
                  {editError}
                </div>
              )}

              {/* BUTTONS */}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">

                <button
                  type="button"
                  onClick={closeEdit}
                  disabled={editSubmitting}
                  className="px-4 py-2.5 rounded-xl text-sm text-slate-soft hover:bg-ink-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 transition disabled:opacity-50"
                >
                  {editSubmitting
                    ? 'Saving...'
                    : 'Save Changes'}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================
// HEADER STAT
// =========================================================

function HeaderStat({ label, value, icon }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3.5 backdrop-blur-sm">

      <div className="flex items-center gap-3">

        <div className="w-8 h-8 rounded-lg bg-white/[0.07] text-brass flex items-center justify-center shrink-0">

          {icon === 'branch' && '⌂'}
          {icon === 'users' && '◉'}
          {icon === 'balance' && '₨'}

        </div>

        <div className="min-w-0">

          <p className="text-[9px] font-mono uppercase tracking-wider text-white/35">
            {label}
          </p>

          <p className="text-base sm:text-lg font-medium text-white/90 mt-0.5 truncate">
            {value}
          </p>

        </div>

      </div>
    </div>
  );
}

// =========================================================
// BRANCH METRIC
// =========================================================

function BranchMetric({
  value,
  label,
  small = false,
}) {
  return (
    <div className="text-center px-2">

      <p
        className={`font-display text-ink-900 ${
          small ? 'text-sm' : 'text-xl'
        }`}
      >
        {value}
      </p>

      <p className="font-mono text-[9px] uppercase tracking-wider text-slate-soft mt-1">
        {label}
      </p>

    </div>
  );
}

// =========================================================
// EDIT INPUT
// =========================================================

function EditInput({
  label,
  value,
  onChange,
  error,
  placeholder,
  required,
  maxLength,
}) {
  return (
    <div>

      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-soft mb-2">
        {label}
      </label>

      <input
        required={required}
        maxLength={maxLength}
        value={value}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className={`w-full px-4 py-3 border rounded-xl bg-white text-sm text-ink-900 placeholder:text-slate-faint focus:outline-none focus:ring-2 transition-all ${
          error
            ? 'border-ledger-red focus:ring-ledger-red/30 focus:border-ledger-red'
            : 'border-paper-line focus:ring-brass/50 focus:border-brass'
        }`}
      />

      {error && (
        <p className="text-[11px] text-ledger-red mt-1.5">
          {error}
        </p>
      )}

    </div>
  );
}