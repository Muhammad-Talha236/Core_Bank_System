import { useEffect, useState } from 'react';
import api from '../../api/client';
import SearchableSelect from '../../components/SearchableSelect';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';

export default function Employees() {
  const { employee: currentEmployee } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', roleId: '', branchId: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', roleId: '', branchId: '' });
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  async function loadData() {
    try {
      const [empRes, rolesRes, branchesRes] = await Promise.all([api.get('/employees'), api.get('/employees/roles'), api.get('/branches')]);
      setEmployees(empRes.data); setRoles(rolesRes.data); setBranches(branchesRes.data);
    } catch { setError('Could not load employees.'); } finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  async function handleSubmit(e) {
    e.preventDefault(); setFormError(''); setSubmitting(true);
    try {
      await api.post('/employees', form);
      setForm({ name: '', email: '', password: '', roleId: '', branchId: '' }); setShowCreate(false); loadData();
    } catch (err) { setFormError(err.response?.data?.error || 'Failed to create employee.'); }
    finally { setSubmitting(false); }
  }

  function openEdit(emp) {
    setEditingEmployee(emp);
    setEditForm({ name: emp.Name, roleId: emp.RoleID, branchId: emp.BranchID || '' });
    setEditError('');
  }

  async function handleEditSubmit(e) {
    e.preventDefault(); setEditError(''); setEditSubmitting(true);
    try {
      await api.put(`/employees/${editingEmployee.EmployeeID}`, { name: editForm.name, roleId: editForm.roleId, branchId: editForm.branchId || null });
      setEditingEmployee(null); loadData();
    } catch (err) { setEditError(err.response?.data?.error || 'Failed to update employee.'); }
    finally { setEditSubmitting(false); }
  }

  async function handleStatusChange(employeeId, status) {
    try { await api.patch(`/employees/${employeeId}/status`, { status }); loadData(); }
    catch (err) { alert(err.response?.data?.error || 'Could not update status.'); }
  }

  const statusPill = (status) => status === 'Active' ? 'pill-green' : status === 'Locked' ? 'pill-red' : 'pill-brass';

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-8 animate-fade-up">
        <div>
          <p className="eyebrow mb-1">Administration</p>
          <h1 className="font-display text-3xl text-ink-900">Employees</h1>
          <p className="text-slate-soft mt-1">Manage staff accounts, roles, and branch assignments.</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn btn-primary">{showCreate ? 'Cancel' : '+ Add Employee'}</button>
      </div>

      {showCreate && (
        <form onSubmit={handleSubmit} className="panel p-6 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-scale-in">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Full Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-paper-line rounded-md focus:outline-none focus:ring-2 focus:ring-brass" />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-paper-line rounded-md focus:outline-none focus:ring-2 focus:ring-brass" />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Password</label>
            <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 border border-paper-line rounded-md focus:outline-none focus:ring-2 focus:ring-brass" />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Role</label>
            <SearchableSelect placeholder="Select role" value={form.roleId} onChange={(v) => setForm({ ...form, roleId: v })}
              options={roles.map((r) => ({ value: r.RoleID, label: r.RoleName, sublabel: r.Description }))} />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Branch</label>
            <SearchableSelect placeholder="Select branch" value={form.branchId} onChange={(v) => setForm({ ...form, branchId: v })}
              options={branches.map((b) => ({ value: b.BranchID, label: `${b.BranchName} (${b.BranchCode})` }))} />
          </div>
          {formError && <div className="sm:col-span-2 text-sm text-ledger-red bg-ledger-red-100 border border-ledger-red/30 rounded-md px-3 py-2">{formError}</div>}
          <div className="sm:col-span-2">
            <button type="submit" disabled={submitting} className="btn btn-brass">{submitting ? 'Creating...' : 'Create Employee'}</button>
          </div>
        </form>
      )}

      {loading && <p className="text-slate-soft">Loading...</p>}
      {error && <p className="text-ledger-red">{error}</p>}

      {!loading && !error && (
        <div className="panel overflow-x-auto animate-fade-up">
          <table className="w-full ledger-table min-w-[900px]">
            <thead>
              <tr className="bg-ink-900 text-paper text-left text-xs font-mono uppercase tracking-wide">
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
                  <td className="px-5 py-3"><span className="pill pill-navy">{e.RoleName}</span></td>
                  <td className="px-5 py-3 text-slate-soft">{e.BranchName || '—'}</td>
                  <td className="px-5 py-3"><span className={`pill ${statusPill(e.Status)}`}>{e.Status}</span></td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-soft">{e.LastLogin ? new Date(e.LastLogin).toLocaleDateString() : 'Never'}</td>
                  <td className="px-5 py-3 space-x-3 whitespace-nowrap">
                    <button onClick={() => openEdit(e)} className="text-xs text-ink-800 hover:underline font-medium">Edit</button>
                    {e.EmployeeID !== currentEmployee.employeeId && (
                      <>
                        {e.Status !== 'Active' && <button onClick={() => handleStatusChange(e.EmployeeID, 'Active')} className="text-xs text-ledger-green hover:underline">Activate</button>}
                        {e.Status !== 'Suspended' && <button onClick={() => handleStatusChange(e.EmployeeID, 'Suspended')} className="text-xs text-brass-dark hover:underline">Suspend</button>}
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

      <Modal open={!!editingEmployee} onClose={() => setEditingEmployee(null)} title="Edit Employee"
        subtitle={editingEmployee ? `#${editingEmployee.EmployeeID} — ${editingEmployee.Email}` : ''}>
        {editingEmployee && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Full Name</label>
              <input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-paper-line rounded-md focus:outline-none focus:ring-2 focus:ring-brass" />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Role</label>
              <SearchableSelect placeholder="Select role" value={editForm.roleId} onChange={(v) => setEditForm({ ...editForm, roleId: v })}
                options={roles.map((r) => ({ value: r.RoleID, label: r.RoleName, sublabel: r.Description }))} />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-slate-soft mb-2">Branch</label>
              <SearchableSelect placeholder="Select branch" value={editForm.branchId} onChange={(v) => setEditForm({ ...editForm, branchId: v })}
                options={branches.map((b) => ({ value: b.BranchID, label: `${b.BranchName} (${b.BranchCode})` }))} />
            </div>
            {editError && <div className="text-sm text-ledger-red bg-ledger-red-100 border border-ledger-red/30 rounded-md px-3 py-2">{editError}</div>}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={editSubmitting} className="btn btn-brass">{editSubmitting ? 'Saving...' : 'Save Changes'}</button>
              <button type="button" onClick={() => setEditingEmployee(null)} className="btn btn-ghost">Cancel</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}