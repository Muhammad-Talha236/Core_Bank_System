import { useEffect, useState } from 'react';
import api from '../../api/client';
import SearchableSelect from '../../components/SearchableSelect';
import { useAuth } from '../../context/AuthContext';

export default function Employees() {
  const { employee: currentEmployee } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', roleId: '', branchId: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    try {
      const [empRes, rolesRes, branchesRes] = await Promise.all([
        api.get('/employees'),
        api.get('/employees/roles'),
        api.get('/branches')
      ]);
      setEmployees(empRes.data);
      setRoles(rolesRes.data);
      setBranches(branchesRes.data);
    } catch (err) {
      setError('Could not load employees.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/employees', form);
      setForm({ name: '', email: '', password: '', roleId: '', branchId: '' });
      setShowForm(false);
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create employee.');
    } finally {
      setSubmitting(false);
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

  const statusColor = (status) => {
    if (status === 'Active') return 'text-ledger-green';
    if (status === 'Locked') return 'text-ledger-red';
    return 'text-brass-dark';
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-ink-900 mb-1">Employees</h1>
          <p className="text-slate-soft">Manage staff accounts and roles.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-ink-900 text-paper px-5 py-2.5 rounded-sm font-medium hover:bg-ink-800 transition"
        >
          {showForm ? 'Cancel' : '+ Add Employee'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-paper-line rounded-sm p-6 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Full Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 border border-paper-line rounded-sm focus:outline-none focus:ring-2 focus:ring-brass"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Role</label>
            <SearchableSelect
              placeholder="Select role"
              value={form.roleId}
              onChange={(v) => setForm({ ...form, roleId: v })}
              options={roles.map((r) => ({ value: r.RoleID, label: r.RoleName, sublabel: r.Description }))}
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Branch</label>
            <SearchableSelect
              placeholder="Select branch"
              value={form.branchId}
              onChange={(v) => setForm({ ...form, branchId: v })}
              options={branches.map((b) => ({ value: b.BranchID, label: `${b.BranchName} (${b.BranchCode})` }))}
            />
          </div>

          {formError && (
            <div className="sm:col-span-2 text-sm text-ledger-red bg-ledger-red/10 border border-ledger-red/30 rounded-sm px-3 py-2">
              {formError}
            </div>
          )}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-brass text-ink-900 font-medium px-5 py-2.5 rounded-sm hover:bg-brass-dark transition disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Employee'}
            </button>
          </div>
        </form>
      )}

      {loading && <p className="text-slate-soft">Loading...</p>}
      {error && <p className="text-ledger-red">{error}</p>}

      {!loading && !error && (
        <div className="bg-white border border-paper-line rounded-sm overflow-x-auto">
          <table className="w-full ledger-table min-w-[800px]">
            <thead>
              <tr className="bg-ink-900 text-paper text-left text-sm">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Branch</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Last Login</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.EmployeeID} className="text-sm">
                  <td className="px-5 py-3 font-medium text-ink-900">{e.Name}</td>
                  <td className="px-5 py-3 text-slate-soft">{e.Email}</td>
                  <td className="px-5 py-3">{e.RoleName}</td>
                  <td className="px-5 py-3 text-slate-soft">{e.BranchName || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`stamp ${statusColor(e.Status)}`}>{e.Status}</span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-soft">
                    {e.LastLogin ? new Date(e.LastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-5 py-3 space-x-2 whitespace-nowrap">
                    {e.EmployeeID === currentEmployee.employeeId ? (
                      <span className="text-xs text-slate-soft italic"></span>
                    ) : (
                      <>
                        {e.Status !== 'Active' && (
                          <button onClick={() => handleStatusChange(e.EmployeeID, 'Active')} className="text-xs text-ledger-green hover:underline">Activate</button>
                        )}
                        {e.Status !== 'Suspended' && (
                          <button onClick={() => handleStatusChange(e.EmployeeID, 'Suspended')} className="text-xs text-brass-dark hover:underline">Suspend</button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {employees.length === 0 && <p className="text-center text-slate-soft py-8">No employees yet.</p>}
        </div>
      )}
    </div>
  );
}