import { createContext, useContext, useState, useEffect } from 'react';
import customerApi from '../api/customerClient';

const CustomerAuthContext = createContext(null);

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedProfile = localStorage.getItem('customerProfile');
    const token = localStorage.getItem('customerToken');
    if (token && storedProfile) {
      setCustomer(JSON.parse(storedProfile));
    }
    setLoading(false);
  }, []);

  async function login(cnic, password) {
    const { data } = await customerApi.post('/customer-auth/login', { cnic, password });
    localStorage.setItem('customerToken', data.token);
    localStorage.setItem('customerProfile', JSON.stringify(data.customer));
    setCustomer(data.customer);
    return data.customer;
  }

  function logout() {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerProfile');
    setCustomer(null);
  }

  return (
    <CustomerAuthContext.Provider value={{ customer, login, logout, loading }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
}