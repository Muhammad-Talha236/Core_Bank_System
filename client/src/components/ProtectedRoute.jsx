import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Wrap any page that requires login with this. Optionally restrict to
// specific roles: <ProtectedRoute roles={['SuperAdmin']}>...</ProtectedRoute>
export default function ProtectedRoute({ children, roles }) {
  const { employee, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <p className="font-mono text-sm text-slate-soft">Loading...</p>
      </div>
    );
  }

  if (!employee) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(employee.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="text-center">
          <p className="font-display text-2xl text-ink-900 mb-2">Access Restricted</p>
          <p className="text-slate-soft">Your role ({employee.role}) doesn't have access to this page.</p>
        </div>
      </div>
    );
  }

  return children;
}