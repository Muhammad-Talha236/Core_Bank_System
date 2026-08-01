import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/staff/Login';
import Dashboard from './pages/staff/Dashboard';
import Customers from './pages/staff/Customers';
import Accounts from './pages/staff/Accounts';
import Transactions from './pages/staff/Transactions';
import Approvals from './pages/staff/Approvals';
import AuditLog from './pages/staff/AuditLog';
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
        <Route path="transactions" element={<Transactions />} />
        <Route
          path="approvals"
          element={
            <ProtectedRoute roles={['SuperAdmin', 'Admin', 'BranchManager']}>
              <Approvals />
            </ProtectedRoute>
          }
        />
        <Route path="audit" element={<AuditLog />} />
        {/* Employees, Branches added next */}
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;