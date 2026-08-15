import { useEffect, useState } from 'react';
import api from '../../api/client';
import SearchableSelect from '../../components/SearchableSelect';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';

const ROLE_ICONS = {
  SuperAdmin: '◆',
  Manager: '◇',
  Teller: '●',
  Auditor: '◌',
};

// --- Validation helpers -----------------------------------------------
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[A-Za-z\s]+$/; // letters and spaces only

// Strips anything that isn't a letter or space, as the user types.
function onlyLetters(value) {
  return value.replace(/[^A-Za-z\s]/g, '');
}

function validateCreateForm(form) {
  const errors = {};

  const trimmedName = form.name.trim();
  if (trimmedName.length < 3) {
    errors.name = 'Name must be at least 3 characters';
  } else if (!NAME_REGEX.test(trimmedName)) {
    errors.name = 'Name can only contain letters and spaces';
  }

  if (!EMAIL_REGEX.test(form.email.trim())) {
    errors.email = 'Please enter a valid email address';
  }

  if (!form.password || form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  if (!form.roleId) {
    errors.roleId = 'Please select a role';
  }

  if (!form.branchId) {
    errors.branchId = 'Please select a branch';
  }

  return errors;
}

function validateEditForm(form) {
  const errors = {};

  const trimmedName = form.name.trim();
  if (trimmedName.length < 3) {
    errors.name = 'Name must be at least 3 characters';
  } else if (!NAME_REGEX.test(trimmedName)) {
    errors.name = 'Name can only contain letters and spaces';
  }

  if (!form.roleId) {
    errors.roleId = 'Please select a role';
  }

  return errors;
}
// ------------------------------------------------------------------------

export default function Employees() {
  const { employee: currentEmployee } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    roleId: '',
    branchId: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    roleId: '',
    branchId: '',
  });
  const [editFieldErrors, setEditFieldErrors] = useState({});
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Reset password modal
  const [resettingEmployee, setResettingEmployee] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

  async function loadData() {
    try {
      setError('');

      const [empRes, rolesRes, branchesRes] = await Promise.all([
        api.get('/employees'),
        api.get('/employees/roles'),
        api.get('/branches'),
      ]);

      setEmployees(empRes.data);
      setRoles(rolesRes.data);
      setBranches(branchesRes.data);
    } catch {
      setError('Could not load employees.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateField(key, value) {
    setForm({ ...form, [key]: value });
    if (fieldErrors[key]) {
      setFieldErrors({ ...fieldErrors, [key]: undefined });
    }
  }

  function updateEditField(key, value) {
    setEditForm({ ...editForm, [key]: value });
    if (editFieldErrors[key]) {
      setEditFieldErrors({ ...editFieldErrors, [key]: undefined });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    const errors = validateCreateForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError('Please fix the highlighted fields before submitting.');
      return;
    }

    setSubmitting(true);

    try {
      await api.post('/employees', {
        ...form,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
      });

      setForm({
        name: '',
        email: '',
        password: '',
        roleId: '',
        branchId: '',
      });
      setFieldErrors({});

      setShowCreate(false);
      loadData();
    } catch (err) {
      setFormError(
        err.response?.data?.error || 'Failed to create employee.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(emp) {
    setEditingEmployee(emp);

    setEditForm({
      name: emp.Name,
      roleId: emp.RoleID,
      branchId: emp.BranchID || '',
    });

    setEditFieldErrors({});
    setEditError('');
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditError('');

    const errors = validateEditForm(editForm);
    setEditFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setEditError('Please fix the highlighted fields before submitting.');
      return;
    }

    setEditSubmitting(true);

    try {
      await api.put(`/employees/${editingEmployee.EmployeeID}`, {
        name: editForm.name.trim(),
        roleId: editForm.roleId,
        branchId: editForm.branchId || null,
      });

      setEditingEmployee(null);
      loadData();
    } catch (err) {
      setEditError(
        err.response?.data?.error || 'Failed to update employee.'
      );
    } finally {
      setEditSubmitting(false);
    }
  }

  function openReset(emp) {
    setResettingEmployee(emp);
    setNewPassword('');
    setResetError('');
    setResetSuccess('');
  }

  async function handleResetSubmit(e) {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!newPassword || newPassword.length < 8) {
      setResetError('Password must be at least 8 characters.');
      return;
    }

    setResetSubmitting(true);

    try {
      await api.patch(
        `/employees/${resettingEmployee.EmployeeID}/reset-password`,
        { newPassword }
      );

      setResetSuccess(
        `Password reset. Share the new password with ${resettingEmployee.Name} securely.`
      );
      setNewPassword('');
      loadData();
    } catch (err) {
      setResetError(
        err.response?.data?.error || 'Failed to reset password.'
      );
    } finally {
      setResetSubmitting(false);
    }
  }

  async function handleStatusChange(employeeId, status) {
    try {
      await api.patch(`/employees/${employeeId}/status`, { status });
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not update status.');
    }
  }

  const activeCount = employees.filter((e) => e.Status === 'Active').length;
  const suspendedCount = employees.filter(
    (e) => e.Status === 'Suspended'
  ).length;
  const lockedCount = employees.filter(
    (e) => e.Status === 'Locked'
  ).length;

  const statusConfig = {
    Active: {
      dot: 'bg-ledger-green',
      text: 'text-ledger-green',
      bg: 'bg-ledger-green-100',
      label: 'Active',
    },
    Suspended: {
      dot: 'bg-brass-dark',
      text: 'text-brass-dark',
      bg: 'bg-brass-100',
      label: 'Suspended',
    },
    Locked: {
      dot: 'bg-ledger-red',
      text: 'text-ledger-red',
      bg: 'bg-ledger-red-100',
      label: 'Locked',
    },
  };

  function getStatus(status) {
    return statusConfig[status] || {
      dot: 'bg-slate-400',
      text: 'text-slate-600',
      bg: 'bg-slate-100',
      label: status || 'Unknown',
    };
  }

  return (
    <div className="min-h-full bg-[#f6f6f4]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-9">

        {/* =========================================================
            HEADER
        ========================================================= */}

        <section className="relative overflow-hidden rounded-[24px] bg-ink-900 text-white mb-7 shadow-[0_14px_40px_rgba(15,23,42,0.10)] animate-fade-up">

          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)',
              backgroundSize: '34px 34px',
            }}
          />

          <div className="absolute -right-24 -top-28 w-80 h-80 rounded-full border border-white/[0.06]" />
          <div className="absolute -right-8 -top-16 w-52 h-52 rounded-full border border-brass/[0.10]" />

          <div className="relative p-6 sm:p-7 lg:p-8">

            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-7">

              <div className="flex items-start gap-4">

                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-brass text-ink-900 flex items-center justify-center shrink-0 shadow-lg">
                  <svg
                    width="25"
                    height="25"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="9.5"
                      cy="7"
                      r="3"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    />
                    <path
                      d="M17 11a3 3 0 1 0 0-6"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                    <path
                      d="M17 14.5h1a4 4 0 0 1 4 4V20"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
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
                      Workforce
                    </span>
                  </div>

                  <h1 className="font-display text-3xl sm:text-4xl tracking-tight">
                    Employees
                  </h1>

                  <p className="text-white/45 text-xs sm:text-sm mt-2 max-w-xl">
                    Manage staff accounts, permissions, roles and branch
                    assignments from one workspace.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowCreate(!showCreate);
                  setFormError('');
                  setFieldErrors({});
                }}
                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all shrink-0 ${
                  showCreate
                    ? 'bg-white/10 text-white border border-white/10 hover:bg-white/15'
                    : 'bg-brass text-ink-900 hover:bg-brass-light shadow-[0_8px_20px_rgba(0,0,0,0.15)]'
                }`}
              >
                {showCreate ? (
                  <>
                    <span className="text-base">×</span>
                    Close
                  </>
                ) : (
                  <>
                    <span className="text-lg leading-none">+</span>
                    Add Employee
                  </>
                )}
              </button>
            </div>

            {/* Header metrics */}

            <div className="grid grid-cols-3 gap-3 sm:gap-5 mt-7 pt-5 border-t border-white/10 max-w-2xl">

              <div>
                <p className="text-[9px] font-mono uppercase tracking-wider text-white/30">
                  Total Staff
                </p>
                <p className="text-xl font-display text-white mt-1">
                  {employees.length}
                </p>
              </div>

              <div>
                <p className="text-[9px] font-mono uppercase tracking-wider text-white/30">
                  Active
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-ledger-green" />
                  <p className="text-xl font-display text-white">
                    {activeCount}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[9px] font-mono uppercase tracking-wider text-white/30">
                  Attention
                </p>
                <p className="text-xl font-display text-brass mt-1">
                  {suspendedCount + lockedCount}
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================
            CREATE EMPLOYEE
        ========================================================= */}

        {showCreate && (
          <section className="bg-white rounded-2xl border border-paper-line shadow-[0_8px_30px_rgba(15,23,42,0.05)] mb-7 overflow-hidden animate-scale-in">

            <div className="px-5 sm:px-6 py-5 border-b border-paper-line flex items-center justify-between">
              <div>
                <p className="text-[9px] font-mono uppercase tracking-[0.16em] text-slate-soft">
                  New Staff Account
                </p>
                <h2 className="font-display text-xl text-ink-900 mt-1">
                  Create Employee
                </h2>
              </div>

              <span className="hidden sm:block text-[9px] font-mono uppercase tracking-wider text-slate-faint">
                Secure onboarding
              </span>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-5 sm:p-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

                <Field label="Full Name" error={fieldErrors.name}>
                  <input
                    required
                    value={form.name}
                    onChange={(e) =>
                      updateField('name', onlyLetters(e.target.value))
                    }
                    placeholder="Enter full name"
                    className={`luxury-input ${fieldErrors.name ? 'luxury-input-error' : ''}`}
                  />
                </Field>

                <Field label="Email Address" error={fieldErrors.email}>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="employee@bank.com"
                    className={`luxury-input ${fieldErrors.email ? 'luxury-input-error' : ''}`}
                  />
                </Field>

                <Field label="Temporary Password" error={fieldErrors.password}>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder="Minimum 8 characters"
                    className={`luxury-input ${fieldErrors.password ? 'luxury-input-error' : ''}`}
                  />
                </Field>

                <Field label="Role" error={fieldErrors.roleId}>
                  <SearchableSelect
                    placeholder="Select role"
                    value={form.roleId}
                    onChange={(v) => updateField('roleId', v)}
                    options={roles.map((r) => ({
                      value: r.RoleID,
                      label: r.RoleName,
                      sublabel: r.Description,
                    }))}
                  />
                </Field>

                <Field label="Branch" error={fieldErrors.branchId}>
                  <SearchableSelect
                    placeholder="Select branch"
                    value={form.branchId}
                    onChange={(v) => updateField('branchId', v)}
                    options={branches.map((b) => ({
                      value: b.BranchID,
                      label: `${b.BranchName} (${b.BranchCode})`,
                    }))}
                  />
                </Field>

              </div>

              {formError && (
                <div className="mt-5 rounded-xl px-4 py-3 bg-ledger-red-100 border border-ledger-red/20 text-ledger-red text-sm">
                  {formError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-5 border-t border-paper-line">

                <p className="text-[11px] text-slate-soft">
                  The employee will receive access according to the selected role.
                </p>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 disabled:opacity-40 transition-all"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Employee
                      <span>→</span>
                    </>
                  )}
                </button>

              </div>
            </form>
          </section>
        )}

        {/* =========================================================
            ERROR / LOADING
        ========================================================= */}

        {loading && (
          <div className="bg-white rounded-2xl border border-paper-line p-12 text-center">
            <div className="w-6 h-6 mx-auto border-2 border-paper-line border-t-ink-900 rounded-full animate-spin" />
            <p className="text-xs text-slate-soft mt-4">
              Loading employee directory...
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-xl px-4 py-3 bg-ledger-red-100 border border-ledger-red/20 text-ledger-red text-sm">
            {error}
          </div>
        )}

        {/* =========================================================
            EMPLOYEE DIRECTORY
        ========================================================= */}

        {!loading && !error && (
          <section className="bg-white rounded-2xl border border-paper-line overflow-hidden shadow-[0_8px_30px_rgba(15,23,42,0.045)] animate-fade-up">

            {/* Table header */}

            <div className="px-5 sm:px-6 py-5 border-b border-paper-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

              <div>
                <p className="text-[9px] font-mono uppercase tracking-[0.16em] text-slate-soft">
                  Staff Directory
                </p>

                <div className="flex items-center gap-2 mt-1">
                  <h2 className="font-display text-xl text-ink-900">
                    Team Members
                  </h2>

                  <span className="px-2 py-0.5 rounded-full bg-ink-50 text-ink-700 text-[10px] font-mono">
                    {employees.length}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-ledger-green" />
                  <span className="text-slate-soft">
                    {activeCount} active
                  </span>
                </div>

                {suspendedCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brass-dark" />
                    <span className="text-slate-soft">
                      {suspendedCount} suspended
                    </span>
                  </div>
                )}
              </div>

            </div>

            {/* Table */}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px]">

                <thead>
                  <tr className="bg-[#fafaf8] border-b border-paper-line">
                    <th className="px-5 py-3.5 text-left text-[9px] font-mono uppercase tracking-wider text-slate-soft font-medium">
                      Employee
                    </th>

                    <th className="px-5 py-3.5 text-left text-[9px] font-mono uppercase tracking-wider text-slate-soft font-medium">
                      Role
                    </th>

                    <th className="px-5 py-3.5 text-left text-[9px] font-mono uppercase tracking-wider text-slate-soft font-medium">
                      Branch
                    </th>

                    <th className="px-5 py-3.5 text-left text-[9px] font-mono uppercase tracking-wider text-slate-soft font-medium">
                      Status
                    </th>

                    <th className="px-5 py-3.5 text-left text-[9px] font-mono uppercase tracking-wider text-slate-soft font-medium">
                      Last Login
                    </th>

                    <th className="px-5 py-3.5 text-right text-[9px] font-mono uppercase tracking-wider text-slate-soft font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-paper-line">

                  {employees.map((e, index) => {
                    const status = getStatus(e.Status);
                    const roleIcon = ROLE_ICONS[e.RoleName] || '•';

                    return (
                      <tr
                        key={e.EmployeeID}
                        className="group hover:bg-[#fcfcfa] transition-colors"
                      >

                        {/* Employee */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">

                            <div className="w-9 h-9 rounded-xl bg-ink-900 text-brass flex items-center justify-center text-xs font-display shrink-0">
                              {e.Name
                                ?.split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm font-medium text-ink-900 truncate">
                                {e.Name}
                              </p>

                              <p className="text-[11px] text-slate-soft truncate max-w-[230px]">
                                {e.Email}
                              </p>
                            </div>

                          </div>
                        </td>

                        {/* Role */}

                        <td className="px-5 py-4">
                          <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-ink-50 border border-paper-line">
                            <span className="text-[9px] text-brass-dark">
                              {roleIcon}
                            </span>

                            <span className="text-[11px] font-medium text-ink-800">
                              {e.RoleName}
                            </span>
                          </div>
                        </td>

                        {/* Branch */}

                        <td className="px-5 py-4">
                          <p className="text-xs text-ink-800">
                            {e.BranchName || '—'}
                          </p>

                          {e.BranchCode && (
                            <p className="text-[10px] font-mono text-slate-faint mt-0.5">
                              {e.BranchCode}
                            </p>
                          )}
                        </td>

                        {/* Status */}

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-medium ${status.bg} ${status.text}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${status.dot}`}
                            />
                            {status.label}
                          </span>
                        </td>

                        {/* Last login */}

                        <td className="px-5 py-4">
                          <p className="text-[11px] font-mono text-slate-soft">
                            {e.LastLogin
                              ? new Date(e.LastLogin).toLocaleDateString(
                                  'en-GB',
                                  {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  }
                                )
                              : 'Never'}
                          </p>
                        </td>

                        {/* Actions */}

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">

                            <button
                              onClick={() => openEdit(e)}
                              className="px-3 py-1.5 rounded-lg border border-paper-line text-[10px] font-medium text-ink-800 hover:border-ink-300 hover:bg-ink-50 transition-colors"
                            >
                              Edit
                            </button>
 
                            <button
                              onClick={() => openReset(e)}
                              className="px-3 py-1.5 rounded-lg border border-brass/30 text-[10px] font-medium text-brass-dark hover:bg-brass-100 transition-colors"
                            >
                              Reset Password
                            </button>

                            {e.EmployeeID !== currentEmployee.employeeId && (
                              <>
                                {e.Status !== 'Active' && (
                                  <button
                                    onClick={() =>
                                      handleStatusChange(
                                        e.EmployeeID,
                                        'Active'
                                      )
                                    }
                                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-ledger-green hover:bg-ledger-green-100 transition-colors"
                                  >
                                    Activate
                                  </button>
                                )}

                                {e.Status !== 'Suspended' && (
                                  <button
                                    onClick={() =>
                                      handleStatusChange(
                                        e.EmployeeID,
                                        'Suspended'
                                      )
                                    }
                                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-brass-dark hover:bg-brass-100 transition-colors"
                                  >
                                    Suspend
                                  </button>
                                )}
                              </>
                            )}

                          </div>
                        </td>

                      </tr>
                    );
                  })}

                </tbody>
              </table>
            </div>

            {employees.length === 0 && (
              <div className="py-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-ink-50 mx-auto flex items-center justify-center text-slate-soft">
                  <span className="text-xl">◌</span>
                </div>

                <p className="text-sm font-medium text-ink-900 mt-4">
                  No employees yet
                </p>

                <p className="text-xs text-slate-soft mt-1">
                  Create your first staff account to get started.
                </p>
              </div>
            )}

            {/* Footer */}

            {employees.length > 0 && (
              <div className="px-5 sm:px-6 py-3.5 bg-[#fafaf8] border-t border-paper-line flex items-center justify-between">
                <p className="text-[10px] font-mono text-slate-faint">
                  DIRECTORY · {employees.length} RECORDS
                </p>

                <p className="text-[10px] text-slate-soft">
                  Staff access is role controlled
                </p>
              </div>
            )}

          </section>
        )}

        {/* =========================================================
            EDIT MODAL
        ========================================================= */}

        <Modal
          open={!!editingEmployee}
          onClose={() => setEditingEmployee(null)}
          title="Edit Employee"
          subtitle={
            editingEmployee
              ? `#${editingEmployee.EmployeeID} — ${editingEmployee.Email}`
              : ''
          }
        >
          {editingEmployee && (
            <form
              onSubmit={handleEditSubmit}
              className="space-y-5"
            >

              <div className="rounded-xl bg-ink-50 border border-paper-line p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-ink-900 text-brass flex items-center justify-center text-xs font-display">
                  {editingEmployee.Name
                    ?.split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>

                <div>
                  <p className="text-sm font-medium text-ink-900">
                    {editingEmployee.Name}
                  </p>

                  <p className="text-[11px] text-slate-soft">
                    Update staff assignment and access
                  </p>
                </div>
              </div>

              <Field label="Full Name" error={editFieldErrors.name}>
                <input
                  required
                  value={editForm.name}
                  onChange={(e) =>
                    updateEditField('name', onlyLetters(e.target.value))
                  }
                  className={`luxury-input ${editFieldErrors.name ? 'luxury-input-error' : ''}`}
                />
              </Field>

              <Field label="Role" error={editFieldErrors.roleId}>
                <SearchableSelect
                  placeholder="Select role"
                  value={editForm.roleId}
                  onChange={(v) => updateEditField('roleId', v)}
                  options={roles.map((r) => ({
                    value: r.RoleID,
                    label: r.RoleName,
                    sublabel: r.Description,
                  }))}
                />
              </Field>

              <Field label="Branch">
                <SearchableSelect
                  placeholder="Select branch"
                  value={editForm.branchId}
                  onChange={(v) => updateEditField('branchId', v)}
                  options={branches.map((b) => ({
                    value: b.BranchID,
                    label: `${b.BranchName} (${b.BranchCode})`,
                  }))}
                />
              </Field>

              {editError && (
                <div className="text-sm text-ledger-red bg-ledger-red-100 border border-ledger-red/20 rounded-xl px-4 py-3">
                  {editError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 disabled:opacity-40 transition-colors"
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>

                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-5 py-2.5 rounded-xl border border-paper-line text-sm text-ink-800 hover:bg-ink-50 transition-colors"
                >
                  Cancel
                </button>
              </div>

            </form>
          )}
        </Modal>

        {/* =========================================================
            RESET PASSWORD MODAL
        ========================================================= */}

        <Modal
          open={!!resettingEmployee}
          onClose={() => setResettingEmployee(null)}
          title="Reset Password"
          subtitle={
            resettingEmployee
              ? `#${resettingEmployee.EmployeeID} — ${resettingEmployee.Email}`
              : ''
          }
        >
          {resettingEmployee && (
            <div className="space-y-5">
              <div className="rounded-xl bg-ink-50 border border-paper-line p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-ink-900 text-brass flex items-center justify-center text-xs font-display">
                  {resettingEmployee.Name
                    ?.split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>

                <div>
                  <p className="text-sm font-medium text-ink-900">
                    {resettingEmployee.Name}
                  </p>
                  <p className="text-[11px] text-slate-soft">
                    Set a new password for this employee account.
                  </p>
                </div>
              </div>

              {!resetSuccess ? (
                <form onSubmit={handleResetSubmit} className="space-y-5">
                  <Field label="New Password">
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className={`luxury-input ${
                        resetError ? 'luxury-input-error' : ''
                      }`}
                    />
                  </Field>

                  {resetError && (
                    <div className="text-sm text-ledger-red bg-ledger-red-100 border border-ledger-red/20 rounded-xl px-4 py-3">
                      {resetError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={resetSubmitting}
                      className="flex-1 py-2.5 rounded-xl bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 disabled:opacity-40 transition-colors"
                    >
                      {resetSubmitting ? 'Resetting...' : 'Reset Password'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setResettingEmployee(null)}
                      className="px-5 py-2.5 rounded-xl border border-paper-line text-sm text-ink-800 hover:bg-ink-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="text-sm text-ledger-green bg-ledger-green-100 border border-ledger-green/20 rounded-xl px-4 py-3 mb-4">
                    {resetSuccess}
                  </div>

                  <button
                    type="button"
                    onClick={() => setResettingEmployee(null)}
                    className="w-full py-2.5 rounded-xl bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Bottom note */}

        <div className="flex items-center justify-center gap-2 mt-6 text-[9px] font-mono uppercase tracking-[0.16em] text-slate-faint">
          <span className="w-1.5 h-1.5 rounded-full bg-ledger-green" />
          Staff directory secured
          <span className="text-slate-300">•</span>
          Role based access enabled
        </div>

      </div>

      {/* Small reusable input styling */}

      <style>{`
        .luxury-input {
          width: 100%;
          padding: 10px 13px;
          border: 1px solid #e7e5df;
          border-radius: 10px;
          background: #fff;
          color: #111827;
          font-size: 13px;
          outline: none;
          transition: all 180ms ease;
        }

        .luxury-input::placeholder {
          color: #a1a1aa;
        }

        .luxury-input:hover {
          border-color: #d4d1c8;
        }

        .luxury-input:focus {
          border-color: #b59a5a;
          box-shadow: 0 0 0 3px rgba(181,154,90,0.10);
        }

        .luxury-input-error {
          border-color: #b3261e !important;
        }

        .luxury-input-error:focus {
          box-shadow: 0 0 0 3px rgba(179,38,30,0.10);
        }
      `}</style>
    </div>
  );
}


/* =========================================================
   FIELD
========================================================= */

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-[9px] font-mono uppercase tracking-[0.14em] text-slate-soft mb-2">
        {label}
      </label>

      {children}

      {error && (
        <p className="text-[11px] text-ledger-red mt-1.5">{error}</p>
      )}
    </div>
  );
}