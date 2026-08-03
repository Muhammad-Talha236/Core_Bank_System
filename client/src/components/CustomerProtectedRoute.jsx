import { Navigate } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext';

export default function CustomerProtectedRoute({ children }) {
  const { customer, loading } = useCustomerAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <p className="font-mono text-sm text-slate-soft">Loading...</p>
      </div>
    );
  }

  if (!customer) {
    return <Navigate to="/customer/login" replace />;
  }

  return children;
}