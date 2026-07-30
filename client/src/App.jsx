import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/staff/Login';
import Dashboard from './pages/staff/Dashboard';
import Customers from './pages/staff/Customers';
import Accounts from './pages/staff/Accounts';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="customers" element={<Customers />} />
        <Route path="accounts" element={<Accounts />} />
        {/* Transactions, Approvals, Audit, Employees, Branches
            will be added here as we build each one. */}
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;