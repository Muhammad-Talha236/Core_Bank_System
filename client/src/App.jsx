import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/staff/Login';
import Dashboard from './pages/staff/Dashboard';
import Customers from './pages/staff/Customers';
import Accounts from './pages/staff/Accounts';
import Transactions from './pages/staff/Transactions';
import Approvals from './pages/staff/Approvals';
import AuditLog from './pages/staff/AuditLog';
import Employees from './pages/staff/Employees';
import Branches from './pages/staff/Branches';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import CustomerLogin from './pages/customer/Login';
import CustomerRegister from './pages/customer/Register';
import CustomerDashboard from './pages/customer/Dashboard';
import CustomerProtectedRoute from './components/CustomerProtectedRoute';

function App() {
  return (
    <Routes>
      {/* Staff */}
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
        <Route
          path="employees"
          element={
            <ProtectedRoute roles={['SuperAdmin']}>
              <Employees />
            </ProtectedRoute>
          }
        />
        <Route
          path="branches"
          element={
            <ProtectedRoute roles={['SuperAdmin']}>
              <Branches />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Customer self-service portal */}
      <Route path="/customer/login" element={<CustomerLogin />} />
      <Route path="/customer/register" element={<CustomerRegister />} />
      <Route
        path="/customer/portal"
        element={
          <CustomerProtectedRoute>
            <CustomerDashboard />
          </CustomerProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;